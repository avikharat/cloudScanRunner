const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const ApiClient = require('./apiClient');
const axe = require('axe-core'); // Import axe-core module

const { source: axeSource } = axe; // Destructure axe.source

class AccessibilityChecker {
  constructor() {
    this.browser = null;
    this.page = null;
    this.apiClient = null;
    this.currentScan = null;
  }

  async initialize() {
    this.browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async authenticateIfNeeded(page, authConfig) {
    if (!authConfig || !authConfig.enabled) {
      return;
    }

    console.log('Performing authentication...');
    
    if (authConfig.type === 'form') {
      await page.goto(authConfig.login_url);
      await page.waitForSelector(authConfig.username_field);
      
      await page.type(authConfig.username_field, authConfig.credentials.username);
      await page.type(authConfig.password_field, authConfig.credentials.password);
      
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
        page.click(authConfig.submit_selector)
      ]);

      if (authConfig.post_login_wait_selector) {
        await page.waitForSelector(authConfig.post_login_wait_selector);
      }
    } else if (authConfig.type === 'basic') {
      await page.authenticate({
        username: authConfig.credentials.username,
        password: authConfig.credentials.password
      });
    }
  }

  async crawlUrls(startUrl, config) {
    const urls = new Set([startUrl]);
    const visited = new Set();
    const queue = [startUrl];
    
    while (queue.length > 0 && urls.size < config.max_urls) {
      const currentUrl = queue.shift();
      if (visited.has(currentUrl)) continue;
      
      visited.add(currentUrl);
      
      try {
        const page = await this.browser.newPage();
        await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: config.timeout_ms });
        
        // Extract links for crawling only if we haven't reached max_urls
        if (urls.size < config.max_urls && visited.size < config.scan_depth) {
          const links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a[href]'))
              .map(a => a.href)
              .filter(href => href.startsWith('http'));
          });
          
          for (const link of links) {
            if (urls.size >= config.max_urls) break; // Stop adding URLs if limit reached
            if (this.shouldIncludeUrl(link, config) && !visited.has(link) && !urls.has(link)) {
              queue.push(link);
              urls.add(link);
            }
          }
        }
        
        await page.close();
      } catch (error) {
        console.error(`Error crawling ${currentUrl}:`, error.message);
      }
    }
    
    return Array.from(urls);
  }

  shouldIncludeUrl(url, config) {
    // Check include patterns
    if (config.include_patterns && config.include_patterns.length > 0) {
      const included = config.include_patterns.some(pattern => {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(url);
      });
      if (!included) return false;
    }
    
    // Check exclude patterns
    if (config.exclude_patterns && config.exclude_patterns.length > 0) {
      const excluded = config.exclude_patterns.some(pattern => {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(url);
      });
      if (excluded) return false;
    }
    
    return true;
  }

  async handleLazyLoading(page) {
    // Get initial page height
    let previousHeight = 0;
    let currentHeight = await page.evaluate(() => {
      return Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    });
    
    let scrollAttempts = 0;
    const maxScrollAttempts = 20;
    
    // Scroll through the page to trigger lazy loading
    while (currentHeight > previousHeight && scrollAttempts < maxScrollAttempts) {
      previousHeight = currentHeight;
      scrollAttempts++;
      
      // Scroll to bottom in chunks to better trigger lazy loading
      const viewportHeight = await page.evaluate(() => window.innerHeight);
      const scrollSteps = Math.ceil(currentHeight / viewportHeight);
      
      for (let i = 0; i <= scrollSteps; i++) {
        const scrollY = (currentHeight / scrollSteps) * i;
        await page.evaluate((y) => {
          window.scrollTo(0, y);
        }, scrollY);
        await new Promise(resolve => setTimeout(resolve, 300)); // Short delay between scroll steps
      }
      
      // Wait for new content to load after full scroll
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if page height increased (new content loaded)
      currentHeight = await page.evaluate(() => {
        return Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      });
      
      console.log(`Lazy loading attempt ${scrollAttempts}: height changed from ${previousHeight} to ${currentHeight}`);
    }
    
    // Scroll back to top for consistent screenshot
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    
    // Wait for any animations or content shifts to settle
    await new Promise(resolve => setTimeout(resolve, 2000));
      
    
    console.log(`Lazy loading complete after ${scrollAttempts} attempts. Final page height: ${currentHeight}px`);
  }

  async runAccessibilityCheck(url, config, userId) {
    const page = await this.browser.newPage();
    const startTime = Date.now();
    
    try {
      // Set viewport
      if (config.viewport) {
        const [width, height] = config.viewport.split('x').map(Number);
        await page.setViewport({ width, height });
      }

      // Navigate to page
      const response = await page.goto(url, { 
        waitUntil: 'domcontentloaded', 
        timeout: config.timeout_ms || 30000 
      });

      const loadTime = Date.now() - startTime;
      const statusCode = response ? response.status() : 200;

      // Get page title
      const pageTitle = await page.title();

      // Inject axe-core source directly
      await page.evaluate(axeSource);

      // Run accessibility scan
      const axeResults = await page.evaluate((standard) => {
        return new Promise((resolve) => {
          const tags = standard === 'wcag2aa' ? ['wcag2a', 'wcag2aa'] : ['wcag2a'];
          axe.run(document, { tags }, (err, results) => {
            if (err) {
              resolve({ violations: [] });
            } else {
              resolve(results);
            }
          });
        });
      }, config.accessibility_standard || 'wcag2aa');

      // Take screenshot with lazy loading support
      let screenshotPath = null;
      let screenshotUrl = null;
      
      if (config.capture_screenshots) {
        const screenshotDir = path.join(__dirname, 'screenshots');
        await fs.mkdir(screenshotDir, { recursive: true });
        
        // Handle lazy loading by scrolling through the page
        await this.handleLazyLoading(page);
        
        const urlHash = Buffer.from(url).toString('base64').replace(/[/+=]/g, '');
        screenshotPath = path.join(screenshotDir, `${urlHash}.png`);
        
        // Get full page dimensions
        const dimensions = await page.evaluate(() => {
          return {
            width: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
            height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)
          };
        });
        
        console.log(`Capturing full page screenshot: ${dimensions.width}x${dimensions.height}`);
        
        // Take screenshot with timeout
        await page.screenshot({ 
          path: screenshotPath, 
          fullPage: true, 
          timeout: config.timeout_ms || 30000,
          captureBeyondViewport: false // Prevent issues with large pages
        });

        // Upload screenshot to database if API upload is enabled
        if (config.upload_to_api !== false && this.apiClient) {
          try {
            const uploadResult = await this.apiClient.uploadScreenshot(screenshotPath);
            screenshotUrl = uploadResult.url;
            console.log(`Screenshot uploaded: ${screenshotUrl}`);
          } catch (error) {
            console.error('Failed to upload screenshot:', error.message);
          }
        }
      }

      // Create scan URL entry in database if API upload is enabled
      let scanUrlData = null;
      if (config.upload_to_api !== false && this.apiClient && this.currentScan) {
        try {
          scanUrlData = await this.apiClient.createScanUrl(
            this.currentScan.id,
            url,
            userId,
            {
              title: pageTitle,
              loadTime,
              statusCode,
              screenshotPath: screenshotUrl
            }
          );

          if (!scanUrlData || !scanUrlData.id) {
            throw new Error('Failed to create scan URL entry: No ID returned');
          }

          console.log(`Created scan URL entry: ${scanUrlData.id}`);
        } catch (error) {
          console.error('Failed to create scan URL entry:', error.message);
          console.log('Continuing scan without database integration...');
        }
      }

      // Process violations and get element positions
      const processedIssues = await this.processViolations(page, axeResults.violations, screenshotPath);

      // Create issues in database if API upload is enabled and we have a scan URL
      if (config.upload_to_api !== false && scanUrlData && processedIssues.length > 0) {
        try {
          await this.apiClient.createBulkIssues(scanUrlData.id, userId, processedIssues);
          console.log(`Created ${processedIssues.length} issues for URL: ${url}`);
        } catch (error) {
          console.error('Failed to create issues in database:', error.message);
          console.log('Issues saved locally only');
        }
      } else {
        console.log(`Found ${processedIssues.length} accessibility issues for URL: ${url}`);
      }

      await page.close();
      
      return {
        url,
        scanUrlId: scanUrlData ? scanUrlData.id : null,
        issues: processedIssues,
        screenshotPath,
        screenshotUrl,
        pageTitle,
        loadTime,
        statusCode
      };

    } catch (error) {
      await page.close();
      throw error;
    }
  }

  async processViolations(page, violations, screenshotPath) {
    const issues = [];
    
    for (const violation of violations) {
      for (let i = 0; i < violation.nodes.length; i++) {
        const node = violation.nodes[i];
        
        // Get element position for screenshot region
        let screenshotRegion = null;
        if (screenshotPath && node.target && node.target.length > 0) {
          try {
            const elementRect = await page.evaluate((selector) => {
              const element = document.querySelector(selector);
              if (element) {
                // Get bounding rect relative to the document (not viewport)
                const rect = element.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
                
                return {
                  x: rect.left + scrollLeft,
                  y: rect.top + scrollTop,
                  width: rect.width,
                  height: rect.height
                };
              }
              return null;
            }, node.target[0]);
            
            if (elementRect && elementRect.width > 0 && elementRect.height > 0) {
              screenshotRegion = {
                x: Math.round(elementRect.x),
                y: Math.round(elementRect.y),
                width: Math.round(elementRect.width),
                height: Math.round(elementRect.height)
              };
            }
          } catch (error) {
            // Element might not be found, continue without screenshot region
            console.log(`Could not get position for selector ${node.target[0]}:`, error.message);
          }
        }

        // Map impact levels
        const impactMapping = {
          'critical': 'high',
          'serious': 'high',
          'moderate': 'medium',
          'minor': 'low'
        };

        // Determine WCAG guideline
        let wcagGuideline = 'unknown';
        if (violation.tags.includes('wcag2aa')) {
          wcagGuideline = '2.aa';
        } else if (violation.tags.includes('wcag2a')) {
          wcagGuideline = '2.a';
        }

        const issue = {
          description: violation.description,
          element_data: {
            ancestry: null,
            failureSummary: node.failureSummary || 'No failure summary available',
            impact: violation.impact,
            occurrence_index: i + 1,
            total_occurrences: violation.nodes.length,
            xpath: null
          },
          help_url: violation.helpUrl,
          html_snippet: node.html,
          impact: impactMapping[violation.impact] || 'low',
          issue_code: violation.id,
          recommendation: violation.help,
          screenshot_region: screenshotRegion,
          selector: node.target ? node.target[0] : null,
          tags: violation.tags.join(','),
          wcag_guideline: wcagGuideline
        };

        issues.push(issue);
      }
    }
    
    return issues;
  }

  async scanFromConfig(configPath) {
    try {
      // Read and parse config
      const configData = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      console.log('Starting accessibility scan...');
      await this.initialize();

      // Initialize API client and create scan only if API upload is enabled
      if (config.scan_config.upload_to_api !== false) {
        try {
          this.apiClient = new ApiClient();

          // Create scan in database
          console.log('Creating scan in database...');
          this.currentScan = await this.apiClient.createScan(
            config.project_id,
            config.user_id,
            config.scan_config,
            config.metadata
          );
          
          console.log(`Scan created with ID: ${this.currentScan.id}`);

          // Update scan status to running
          await this.apiClient.updateScanStatus(this.currentScan.id, 'running', config.user_id);
        } catch (error) {
          console.error('Failed to initialize API client or create scan:', error.message);
          console.log('Continuing with local-only scan...');
          this.apiClient = null;
          this.currentScan = null;
        }
      } else {
        console.log('API upload disabled - running local-only scan');
        this.apiClient = null;
        this.currentScan = null;
      }

      // Create a new page for authentication
      const authPage = await this.browser.newPage();
      
      // Perform authentication if needed
      if (config.scan_config.authentication) {
        await this.authenticateIfNeeded(authPage, config.scan_config.authentication);
      }

      let urlsToScan = [];
      
      // Determine URLs to scan
      if (config.scan_config.mode === 'crawler') {
        console.log('Crawling URLs starting from:', config.scan_config.start_url);
        urlsToScan = await this.crawlUrls(config.scan_config.start_url, config.scan_config);
      } else if (config.scan_config.mode === 'manual') {
        urlsToScan = config.scan_config.urls;
      }

      console.log(`Found ${urlsToScan.length} URLs to scan`);

      // Scan each URL
      const allIssues = [];
      const scanResults = [];

      let highImpactIssues = 0;
      let mediumImpactIssues = 0;
      let lowImpactIssues = 0;

      for (let i = 0; i < urlsToScan.length; i++) {
        const url = urlsToScan[i];
        console.log(`Scanning ${i + 1}/${urlsToScan.length}: ${url}`);
        try {
          const result = await this.runAccessibilityCheck(url, config.scan_config, config.user_id);
          allIssues.push(...result.issues);
          scanResults.push(result);

          // Count issues by impact
          result.issues.forEach(issue => {
            switch (issue.impact) {
              case 'high':
                highImpactIssues++;
                break;
              case 'medium':
                mediumImpactIssues++;
                break;
              case 'low':
                lowImpactIssues++;
                break;
            }
          });

          console.log(`Page scan completed: ${result.issues.length} issues found`);

        } catch (error) {
          console.error(`Error scanning ${url}:`, error.message);
        }
      }

      await authPage.close();

      // Update scan status to completed with statistics (if API is enabled)
      if (this.apiClient && this.currentScan) {
        try {
          await this.apiClient.updateScanStatus(
            this.currentScan.id, 
            'completed', 
            config.user_id,
            {
              total_urls: urlsToScan.length,
              total_issues: allIssues.length,
              high_impact_issues: highImpactIssues,
              medium_impact_issues: mediumImpactIssues,
              low_impact_issues: lowImpactIssues,
              duration_ms: Date.now() - new Date(this.currentScan.created_at).getTime()
            }
          );
        } catch (error) {
          console.error('Failed to update scan status:', error.message);
        }
      }

      await this.cleanup();

      // Generate output in required format
      const output = {
        body: {
          scan_id: this.currentScan ? this.currentScan.id : `local-${Date.now()}`,
          created_by: config.user_id,
          scan_summary: {
            total_pages_scanned: scanResults.length,
            total_issues_found: allIssues.length,
            high_impact_issues: highImpactIssues,
            medium_impact_issues: mediumImpactIssues,
            low_impact_issues: lowImpactIssues,
            scan_timestamp: new Date().toISOString(),
            pages_scanned: scanResults.map(r => ({
              url: r.url,
              scan_url_id: r.scanUrlId || null,
              issues_count: r.issues.length,
              screenshot_available: !!r.screenshotPath,
              screenshot_url: r.screenshotUrl || null
            }))
          },
          issues: allIssues
        }
      };

      // Save results locally for offline mode
      await fs.writeFile('accessibility-results.json', JSON.stringify(output, null, 2));
      
      console.log(`\n=== Scan Summary ===`);
      console.log(`Scan ID: ${output.body.scan_id}`);
      console.log(`Pages scanned: ${scanResults.length}`);
      console.log(`Total issues found: ${allIssues.length}`);
      console.log(`  - High impact: ${highImpactIssues}`);
      console.log(`  - Medium impact: ${mediumImpactIssues}`);
      console.log(`  - Low impact: ${lowImpactIssues}`);
      if (this.currentScan) {
        console.log(`Scan completed and saved to database`);
      } else {
        console.log(`Scan completed - results saved locally only`);
      }
      
      return output;

    } catch (error) {
      // Mark scan as failed if it exists
      if (this.currentScan) {
        try {
          await this.apiClient.updateScanStatus(this.currentScan.id, 'failed', config.user_id);
        } catch (updateError) {
          console.error('Failed to update scan status to failed:', updateError.message);
        }
      }
      
      await this.cleanup();
      throw error;
    }
  }
}

module.exports = AccessibilityChecker;