# GitHub Actions Accessibility Scanner

A comprehensive GitHub Actions workflow that runs your Puppeteer-based accessibility scanner automatically, triggered via API or GitHub UI.

## 🚀 Features

- **API Triggerable**: Start scans from external systems via GitHub API
- **Dynamic Configuration**: Pass scan parameters via JSON input
- **Multiple Scan Modes**: Support for crawler and manual URL scanning  
- **Screenshot Capture**: Full-page screenshots with issue positioning
- **Database Integration**: Saves results to your backend API
- **Artifact Upload**: Downloads results as GitHub artifacts
- **Webhook Notifications**: Optional result posting to external endpoints
- **Error Handling**: Comprehensive logging and error recovery

## 📋 Setup Instructions

### 1. Add Workflow File

Copy the `scanner.yml` file to your repository at `.github/workflows/scanner.yml`

### 2. Configure Repository Secrets

Go to your repository → Settings → Secrets and variables → Actions

Add these secrets:

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `API_TOKEN` | Your backend API token | No |
| `WEBHOOK_URL` | URL to receive scan results | No |
| `BASIC_AUTH_USER` | Basic auth username for scanned sites | No |
| `BASIC_AUTH_PASS` | Basic auth password for scanned sites | No |

### 3. Enable Actions

Ensure GitHub Actions are enabled in your repository settings.

## 🎯 Usage Methods

### Method 1: GitHub UI

1. Go to your repository → Actions tab
2. Select "Puppeteer Accessibility Scanner" workflow
3. Click "Run workflow"
4. Paste your JSON configuration
5. Click "Run workflow"

### Method 2: API Call (cURL)

```bash
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/OWNER/REPO/actions/workflows/scanner.yml/dispatches \
  -d '{
    "ref": "main",
    "inputs": {
      "config": "{\"user_id\":\"auth0|scanner\",\"organization_id\":\"org_github\",\"project_id\":\"proj_github\",\"scan_config\":{\"mode\":\"manual\",\"urls\":[\"https://example.com\"],\"viewport\":\"1920x1080\",\"accessibility_standard\":\"wcag2aa\",\"capture_screenshots\":true,\"timeout_ms\":30000},\"metadata\":{\"trigger_source\":\"github_action\",\"environment\":\"ci\"}}"
    }
  }'
```

### Method 3: Bash Script

```bash
# Make the script executable
chmod +x trigger-scan.sh

# Run with default config
./trigger-scan.sh sample-crawler-config.json owner/repo your_github_token

# Or set environment variables
export GITHUB_TOKEN="your_token_here"
export GITHUB_REPO="owner/repo"
./trigger-scan.sh config.json
```

### Method 4: Node.js Script

```bash
# Install dependencies first
npm install node-fetch

# Run the trigger script
node trigger-github-scan.js config.json owner/repo your_github_token

# Or use environment variables
export GITHUB_TOKEN="your_token_here"
export GITHUB_REPO="owner/repo"
node trigger-github-scan.js config.json
```

## 📝 Configuration Format

### Basic Configuration

```json
{
  "user_id": "auth0|scanner",
  "organization_id": "org_github", 
  "project_id": "proj_github",
  "scan_config": {
    "mode": "manual",
    "urls": ["https://example.com", "https://example.com/about"],
    "viewport": "1920x1080",
    "accessibility_standard": "wcag2aa",
    "capture_screenshots": true,
    "timeout_ms": 30000
  },
  "metadata": {
    "trigger_source": "github_action",
    "environment": "ci",
    "notes": "Automated accessibility scan"
  }
}
```

### Crawler Configuration

```json
{
  "user_id": "auth0|scanner",
  "organization_id": "org_github",
  "project_id": "proj_github", 
  "scan_config": {
    "mode": "crawler",
    "start_url": "https://example.com",
    "max_urls": 10,
    "scan_depth": 3,
    "include_patterns": ["https://example.com/*"],
    "exclude_patterns": ["https://example.com/admin/*"],
    "viewport": "1920x1080",
    "accessibility_standard": "wcag2aa",
    "capture_screenshots": true,
    "timeout_ms": 30000
  },
  "metadata": {
    "trigger_source": "github_action",
    "environment": "production"
  }
}
```

### Configuration with Authentication

```json
{
  "user_id": "auth0|scanner",
  "organization_id": "org_github",
  "project_id": "proj_github",
  "scan_config": {
    "mode": "crawler", 
    "start_url": "https://app.example.com",
    "max_urls": 5,
    "authentication": {
      "enabled": true,
      "type": "form",
      "login_url": "https://app.example.com/login",
      "username_field": "#email",
      "password_field": "#password", 
      "submit_selector": "button[type='submit']",
      "credentials": {
        "username": "test@example.com",
        "password": "password123"
      }
    }
  }
}
```

## 📊 Output Format

The workflow generates detailed results in JSON format:

```json
{
  "scan_id": "scan_20251018_143022",
  "github_run_id": "1234567890",
  "github_run_number": "42",
  "completed_at": "2025-10-18T14:30:22Z",
  "body": {
    "scan_id": "uuid-here",
    "created_by": "auth0|scanner",
    "scan_summary": {
      "total_pages_scanned": 5,
      "total_issues_found": 23,
      "high_impact_issues": 8,
      "medium_impact_issues": 12,
      "low_impact_issues": 3,
      "pages_scanned": [
        {
          "url": "https://example.com",
          "scan_url_id": "url-uuid",
          "issues_count": 5,
          "screenshot_available": true,
          "screenshot_url": "https://cloudinary.com/image.png"
        }
      ]
    },
    "issues": [
      {
        "description": "Images must have alternative text",
        "impact": "high",
        "issue_code": "image-alt",
        "selector": "img.hero",
        "html_snippet": "<img src='hero.jpg' class='hero'>",
        "screenshot_region": {
          "x": 100,
          "y": 200,
          "width": 300,
          "height": 200
        },
        "wcag_guideline": "2.a"
      }
    ]
  }
}
```

## 📁 Artifacts

Each scan produces downloadable artifacts:

- **`scan-results.json`** - Complete scan results
- **`scan.log`** - Detailed execution logs  
- **`screenshots/`** - Full-page screenshots (if enabled)
- **`page-results/`** - Individual page results (if available)

## 🔧 Advanced Features

### Environment Variables

The workflow supports these environment variables:

- `PUPPETEER_EXECUTABLE_PATH` - Chrome binary path
- `API_TOKEN` - Backend API authentication  
- `WEBHOOK_URL` - Results webhook endpoint

### Timeout Configuration

- **Workflow timeout**: 30 minutes maximum
- **Scan timeout**: 25 minutes with graceful handling
- **Per-page timeout**: Configurable via `timeout_ms`

### Error Handling

- Network timeouts are handled gracefully
- Failed scans still produce artifacts with error details
- Webhook failures don't stop the workflow
- Detailed logging for debugging

## 🔔 Webhook Integration

If `WEBHOOK_URL` secret is set, results are automatically posted:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_TOKEN" \
  "$WEBHOOK_URL" \
  --data @scan-results.json
```

## 🧪 Testing

Test the workflow with a simple configuration:

```json
{
  "user_id": "test_user",
  "organization_id": "test_org",
  "project_id": "test_project",
  "scan_config": {
    "mode": "manual",
    "urls": ["https://example.com"],
    "capture_screenshots": false,
    "timeout_ms": 10000
  },
  "metadata": {
    "trigger_source": "test",
    "environment": "test"
  }
}
```

## 🔍 Troubleshooting

### Common Issues

1. **"Workflow not found"**
   - Ensure `scanner.yml` is in `.github/workflows/`
   - Check file permissions and syntax

2. **"Chrome not found"**
   - The workflow installs Chrome automatically
   - Check system dependencies step

3. **"API authentication failed"** 
   - Verify GitHub token has `workflow` scope
   - Check repository permissions

4. **"Scan timeout"**
   - Reduce `max_urls` or increase `timeout_ms`
   - Check target site availability

### Debug Mode

Add this to your config for verbose logging:

```json
{
  "scan_config": {
    "headless": false,
    "debug": true
  }
}
```

## 📚 Examples

See the included files for working examples:

- `sample-crawler-config.json` - Basic crawler setup
- `sample-db-config.json` - Database integration example  
- `trigger-scan.sh` - Bash trigger script
- `trigger-github-scan.js` - Node.js trigger script

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Test your changes with the workflow
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details