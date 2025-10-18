# Accessibility Scanner

A comprehensive web accessibility scanner that takes JSON configuration files as input and performs WCAG compliance checks on web pages.

## Features

- **Multiple Scan Modes**: Supports both manual URL scanning and web crawling
- **Authentication Support**: Handles form-based, basic, and cookie authentication
- **Screenshot Capture**: Takes full-page screenshots with element positioning data
- **WCAG Compliance**: Checks against WCAG 2.0 AA and AAA standards
- **Detailed Reporting**: Provides comprehensive accessibility issue reports with recommendations

## Installation

1. Install dependencies:
```bash
npm install
```

2. The scanner requires the following packages:
   - `puppeteer` - For browser automation
   - `axe-core` - For accessibility testing

## Usage

### Command Line Usage

```bash
node run-scan.js <config-file-path>
```

Example:
```bash
node run-scan.js sample-config.json
```

### Programmatic Usage

```javascript
const AccessibilityChecker = require('./accessibilityChecker');

const checker = new AccessibilityChecker();
const results = await checker.scanFromConfig('./config.json');
console.log(results);
```

## Configuration

The scanner accepts JSON configuration files with the following structure:

### Manual Scan Configuration

```json
{
  "user_id": "auth0|68e5fff46dc80010b238ef3a",
  "organization_id": "org_12345",
  "project_id": "proj_78910",
  "scan_config": {
    "mode": "manual",
    "urls": [
      "https://example.com/about",
      "https://example.com/contact"
    ],
    "viewport": "1920x1080",
    "accessibility_standard": "wcag2aa",
    "enable_contrast_check": true,
    "headless": true,
    "capture_screenshots": true,
    "timeout_ms": 25000
  },
  "metadata": {
    "trigger_source": "frontend",
    "environment": "staging",
    "notes": "Manual scan triggered from dashboard"
  }
}
```

### Crawler Configuration with Authentication

```json
{
  "user_id": "auth0|68e5fff46dc80010b238ef3a",
  "organization_id": "org_12345",
  "project_id": "proj_78910",
  "scan_config": {
    "start_url": "https://example.com/login",
    "mode": "crawler",
    "scan_depth": 3,
    "max_urls": 50,
    "viewport": "1920x1080",
    "include_patterns": ["https://example.com/*"],
    "exclude_patterns": ["https://example.com/logout", "https://example.com/api/*"],
    "accessibility_standard": "wcag2aa",
    "enable_contrast_check": true,
    "headless": true,
    "capture_screenshots": true,
    "timeout_ms": 30000,
    "authentication": {
      "enabled": true,
      "type": "form",
      "login_url": "https://example.com/login",
      "username_field": "#email",
      "password_field": "#password",
      "submit_selector": "button[type='submit']",
      "credentials": {
        "username": "testuser@example.com",
        "password": "securepassword123"
      },
      "post_login_wait_selector": "nav.main-nav"
    }
  }
}
```

## Configuration Options

### Scan Config

- `mode`: "manual" or "crawler"
- `urls`: Array of URLs to scan (manual mode)
- `start_url`: Starting URL for crawling (crawler mode)
- `scan_depth`: Maximum crawl depth
- `max_urls`: Maximum number of URLs to scan
- `viewport`: Browser viewport size (e.g., "1920x1080")
- `accessibility_standard`: "wcag2a" or "wcag2aa"
- `enable_contrast_check`: Boolean for color contrast checking
- `headless`: Run browser in headless mode
- `capture_screenshots`: Take screenshots of pages
- `timeout_ms`: Page load timeout in milliseconds
- `include_patterns`: URL patterns to include (crawler mode)
- `exclude_patterns`: URL patterns to exclude (crawler mode)

### Authentication Config

- `enabled`: Enable authentication
- `type`: "form", "basic", or "cookie"
- `login_url`: URL of login page
- `username_field`: CSS selector for username field
- `password_field`: CSS selector for password field
- `submit_selector`: CSS selector for submit button
- `credentials`: Username and password
- `post_login_wait_selector`: Element to wait for after login

## Output Format

The scanner generates results in the following JSON format:

```json
{
  "body": {
    "created_by": "auth0|68e5fff46dc80010b238ef3a",
    "issues": [
      {
        "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
        "element_data": {
          "ancestry": null,
          "failureSummary": "Fix any of the following: Element has insufficient color contrast...",
          "impact": "serious",
          "occurrence_index": 1,
          "total_occurrences": 4,
          "xpath": null
        },
        "help_url": "https://dequeuniversity.com/rules/axe/4.10/color-contrast",
        "html_snippet": "<div class=\"example\">Content</div>",
        "impact": "high",
        "issue_code": "color-contrast",
        "recommendation": "Elements must meet minimum color contrast ratio thresholds",
        "screenshot_region": {
          "x": 100,
          "y": 200,
          "width": 300,
          "height": 50
        },
        "selector": ".example",
        "tags": "cat.color,wcag2aa,wcag143",
        "wcag_guideline": "2.aa"
      }
    ]
  }
}
```

## Output Files

- `accessibility-results.json`: Main results file
- `screenshots/`: Directory containing page screenshots (if enabled)

## Screenshots and Element Positioning

When `capture_screenshots` is enabled, the scanner:
1. Takes full-page screenshots of each scanned page
2. Calculates the exact position of elements with accessibility issues
3. Stores coordinates in `screenshot_region` for frontend visualization
4. Saves screenshots in the `screenshots/` directory

This allows frontend applications to display visual indicators on screenshots showing where accessibility issues are located.

## Error Handling

The scanner includes comprehensive error handling for:
- Network timeouts
- Authentication failures
- Page load errors
- Element positioning errors

Failed pages are logged but don't stop the overall scan process.

## Examples

See the included sample configuration files:
- `sample-config.json` - Basic manual scan
- `sample-crawler-config.json` - Crawler with authentication