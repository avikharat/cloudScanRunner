#!/usr/bin/env node

/**
 * GitHub Actions Accessibility Scanner Trigger (Node.js)
 * 
 * Usage:
 *   node trigger-github-scan.js [config-file] [owner/repo] [github-token]
 *   
 * Environment variables:
 *   GITHUB_TOKEN - GitHub personal access token
 *   GITHUB_REPO - Repository in format owner/repo
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG_FILE = process.argv[2] || 'sample-crawler-config.json';
const REPO = process.argv[3] || process.env.GITHUB_REPO || 'your-username/your-repo';
const GITHUB_TOKEN = process.argv[4] || process.env.GITHUB_TOKEN;
const WORKFLOW_FILE = 'scanner.yml';
const REF = 'main';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ Error: ${message}`, 'red');
  process.exit(1);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function main() {
  log('🚀 GitHub Actions Accessibility Scanner Trigger', 'cyan');
  log('==================================================', 'cyan');

  // Validate inputs
  if (!GITHUB_TOKEN) {
    error('GitHub token is required. Set GITHUB_TOKEN env var or pass as argument.');
  }

  if (!fs.existsSync(CONFIG_FILE)) {
    error(`Config file '${CONFIG_FILE}' not found.`);
  }

  info(`Config file: ${CONFIG_FILE}`);
  info(`Repository: ${REPO}`);
  info(`Workflow: ${WORKFLOW_FILE}`);
  info(`Branch: ${REF}`);

  // Read and validate config
  log('\n📄 Reading configuration...', 'yellow');
  let config;
  try {
    const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
    config = JSON.parse(configData);
    success('Configuration loaded and validated');
  } catch (err) {
    error(`Invalid JSON in config file: ${err.message}`);
  }

  // Show config summary
  log('\n📊 Scan Configuration Summary:', 'blue');
  console.log(`  Mode: ${config.scan_config?.mode || 'manual'}`);
  console.log(`  URLs: ${config.scan_config?.urls?.length || 0}`);
  console.log(`  Start URL: ${config.scan_config?.start_url || 'N/A'}`);
  console.log(`  Screenshots: ${config.scan_config?.capture_screenshots || false}`);
  console.log(`  Standard: ${config.scan_config?.accessibility_standard || 'wcag2aa'}`);

  // Prepare API payload
  const payload = {
    ref: REF,
    inputs: {
      config: JSON.stringify(config)
    }
  };

  // Make API call
  log('\n🌐 Triggering GitHub Action...', 'yellow');
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(
      `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    if (response.ok) {
      success('Workflow triggered successfully!');
      
      log('\n🔗 Links:', 'blue');
      console.log(`  Repository: https://github.com/${REPO}`);
      console.log(`  Actions: https://github.com/${REPO}/actions`);
      console.log(`  Workflow: https://github.com/${REPO}/actions/workflows/${WORKFLOW_FILE}`);
      
      log('\n📋 Next Steps:', 'yellow');
      console.log('1. Visit the Actions page to monitor progress');
      console.log('2. Download artifacts when scan completes');
      console.log('3. Check workflow logs for detailed output');
      
      log('\n🎉 Done!', 'green');
      
    } else {
      const errorText = await response.text();
      error(`Failed to trigger workflow (${response.status}): ${errorText}`);
    }
    
  } catch (err) {
    error(`Network error: ${err.message}`);
  }
}

// Handle CLI usage
if (require.main === module) {
  main().catch(err => {
    error(`Unexpected error: ${err.message}`);
  });
}

module.exports = { main };