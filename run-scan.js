#!/usr/bin/env node

const AccessibilityChecker = require('./accessibilityChecker');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node run-scan.js <config-file-path>');
    console.error('Example: node run-scan.js ./config.json');
    process.exit(1);
  }

  const configPath = path.resolve(args[0]);
  
  try {
    const checker = new AccessibilityChecker();
    const results = await checker.scanFromConfig(configPath);
    
    console.log('\n=== Scan Summary ===');
    console.log(`Total issues found: ${results.body.issues.length}`);
    
    // Group issues by impact
    const issuesByImpact = results.body.issues.reduce((acc, issue) => {
      acc[issue.impact] = (acc[issue.impact] || 0) + 1;
      return acc;
    }, {});
    
    console.log('Issues by impact level:');
    Object.entries(issuesByImpact).forEach(([impact, count]) => {
      console.log(`  ${impact}: ${count}`);
    });
    
    // Group issues by type
    const issuesByType = results.body.issues.reduce((acc, issue) => {
      acc[issue.issue_code] = (acc[issue.issue_code] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nTop issue types:');
    Object.entries(issuesByType)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });

  } catch (error) {
    console.error('Error running accessibility scan:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}