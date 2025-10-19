const fs = require('fs').promises;
const path = require('path');

class ApiClient {
  constructor(baseUrl = null) {
    // Priority: parameter > environment variable > default
    this.baseUrl = baseUrl || process.env.API_BASE_URL || 'http://localhost:3000';
    console.log(`API Client initialized with base URL: ${this.baseUrl}`);
  }

  async makeRequest(method, endpoint, data = null, options = {}) {
    const { default: fetch } = await import('node-fetch');
    const url = `${this.baseUrl}${endpoint}`;
    
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': `scan-${Date.now()}`,
        ...options.headers
      }
    };

    if (data && method !== 'GET') {
      if (options.isFormData) {
        delete config.headers['Content-Type'];
        config.body = data;
      } else {
        config.body = JSON.stringify(data);
      }
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request error for ${method} ${endpoint}:`, error.message);
      throw error;
    }
  }

  // Create a new scan
  async createScan(projectId, userId, scanConfig, metadata = {}) {
    if (!projectId || !userId || !scanConfig) {
      throw new Error('Missing required parameters: projectId, userId, and scanConfig are required');
    }

    const scanData = {
      triggered_by: userId,
      trigger_source: metadata.trigger_source || 'automated_scanner',
      scan_config: {
        scan_depth: scanConfig.scan_depth || 3,
        max_urls: scanConfig.max_urls || 50,
        viewport: scanConfig.viewport || '1920x1080',
        accessibility_standard: scanConfig.accessibility_standard || 'wcag2aa',
        timeout_ms: scanConfig.timeout_ms || 30000,
        include_patterns: scanConfig.include_patterns || [],
        exclude_patterns: scanConfig.exclude_patterns || []
      },
      metadata: {
        environment: metadata.environment || 'automated',
        notes: metadata.notes || 'Automated accessibility scan',
        ...metadata
      }
    };

    console.log('Creating scan with data:', JSON.stringify(scanData, null, 2));

    const response = await this.makeRequest('POST', `/api/projects/${projectId}/scans`, scanData);
    
    if (!response || !response.scan) {
      console.error('Invalid response from createScan:', response);
      throw new Error('Failed to create scan: Invalid response structure');
    }

    const scan = response.scan;
    if (!scan.id) {
      console.error('No ID in scan response:', scan);
      throw new Error('Failed to create scan: No ID returned');
    }

    console.log('Scan created successfully with ID:', scan.id);
    return scan;
  }

  // Update scan status
  async updateScanStatus(scanId, status, userId, stats = {}) {
    const updateData = {
      status,
      updated_by: userId,
      ...stats
    };

    return await this.makeRequest('PUT', `/api/scans/${scanId}/status`, updateData);
  }

  // Create scan URL entry
  async createScanUrl(scanId, url, userId, pageData = {}) {
    if (!scanId || !url || !userId) {
      throw new Error('Missing required parameters: scanId, url, and userId are required');
    }

    const urlData = {
      scan_id: scanId,
      url,
      created_by: userId,
      page_title: pageData.title || '',
      page_load_time_ms: pageData.loadTime || 0,
      status_code: pageData.statusCode || 200,
      screenshot_path: pageData.screenshotPath || null,
      html_snapshot_path: pageData.htmlSnapshotPath || null
    };

    console.log('Creating scan URL with data:', JSON.stringify(urlData, null, 2));

    const response = await this.makeRequest('POST', '/api/scan-urls', urlData);
    
    if (!response || (!response.scan_url && !response.scanUrl)) {
      console.error('Invalid response from createScanUrl:', response);
      throw new Error('Failed to create scan URL: Invalid response structure');
    }

    // Handle both possible response formats
    const scanUrl = response.scan_url || response.scanUrl;
    if (!scanUrl.id) {
      console.error('No ID in scan URL response:', scanUrl);
      throw new Error('Failed to create scan URL: No ID returned');
    }

    console.log('Scan URL created successfully with ID:', scanUrl.id);
    return scanUrl;
  }

  // Upload screenshot to database
  async uploadScreenshot(imagePath) {
    try {
      const { default: fetch } = await import('node-fetch');
      const FormData = require('form-data');
      const form = new FormData();
      
      const imageBuffer = await fs.readFile(imagePath);
      const fileName = path.basename(imagePath);
      
      form.append('image', imageBuffer, {
        filename: fileName,
        contentType: 'image/png'
      });

      const url = `${this.baseUrl}/api/upload-image`;
      
      const response = await fetch(url, {
        method: 'POST',
        body: form,
        headers: {
          'x-request-id': `upload-${Date.now()}`,
          ...form.getHeaders()
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return result.upload;
    } catch (error) {
      console.error('Error uploading screenshot:', error.message);
      throw error;
    }
  }

  // Create bulk issues for a scan URL
  async createBulkIssues(scanUrlId, userId, issues) {
    if (!scanUrlId || !userId || !Array.isArray(issues) || issues.length === 0) {
      throw new Error('Missing required parameters: scanUrlId, userId, and non-empty issues array are required');
    }

    const issueData = {
      created_by: userId,
      issues: issues.map(issue => ({
        issue_code: issue.issue_code || 'unknown-issue',
        description: issue.description || 'No description available',
        impact: issue.impact || 'low',
        wcag_guideline: issue.wcag_guideline || 'unknown',
        selector: issue.selector || null,
        html_snippet: issue.html_snippet || '',
        recommendation: issue.recommendation || '',
        tags: issue.tags || '',
        help_url: issue.help_url || null,
        screenshot_region: issue.screenshot_region || null
      }))
    };

    console.log(`Creating ${issues.length} issues for scan URL ID: ${scanUrlId}`);

    const response = await this.makeRequest('POST', `/api/scan-urls/${scanUrlId}/issues/bulk`, issueData);
    console.log(`Successfully created ${issues.length} issues`);
    return response;
  }

  // Get scan details
  async getScanDetails(scanId, userId) {
    return await this.makeRequest('GET', `/api/scans/${scanId}?user_id=${userId}`);
  }

  // Get scan summary
  async getScanSummary(scanId, userId) {
    return await this.makeRequest('GET', `/api/scans/${scanId}/summary?user_id=${userId}`);
  }
}

module.exports = ApiClient;