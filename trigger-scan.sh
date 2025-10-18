#!/bin/bash

# GitHub Actions Accessibility Scanner Trigger Script
# Usage: ./trigger-scan.sh [config-file.json] [owner/repo] [github-token]

set -e

# Configuration
CONFIG_FILE="${1:-sample-crawler-config.json}"
REPO="${2:-your-username/your-repo}"
GITHUB_TOKEN="${3:-$GITHUB_TOKEN}"
WORKFLOW_FILE="scanner.yml"
REF="main"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 GitHub Actions Accessibility Scanner Trigger${NC}"
echo "=================================="

# Validate inputs
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}❌ Error: GitHub token is required${NC}"
    echo "Set GITHUB_TOKEN environment variable or pass as third argument"
    exit 1
fi

if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}❌ Error: Config file '$CONFIG_FILE' not found${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Configuration:${NC}"
echo "  Config file: $CONFIG_FILE"
echo "  Repository: $REPO"
echo "  Workflow: $WORKFLOW_FILE"
echo "  Branch: $REF"

# Read and validate config JSON
echo -e "\n${YELLOW}📄 Validating configuration...${NC}"
if ! jq . "$CONFIG_FILE" > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Invalid JSON in config file${NC}"
    exit 1
fi

# Escape JSON for API call
CONFIG_JSON=$(jq -c . "$CONFIG_FILE" | jq -R .)

echo -e "${GREEN}✅ Configuration validated${NC}"

# Show config summary (without sensitive data)
echo -e "\n${BLUE}📊 Scan Configuration Summary:${NC}"
jq -r '
"  Mode: " + (.scan_config.mode // "manual") +
"\n  URLs: " + ((.scan_config.urls // []) | length | tostring) +
"\n  Start URL: " + (.scan_config.start_url // "N/A") +
"\n  Screenshots: " + ((.scan_config.capture_screenshots // false) | tostring) +
"\n  Standard: " + (.scan_config.accessibility_standard // "wcag2aa")
' "$CONFIG_FILE"

# Prepare API payload
PAYLOAD=$(cat << EOF
{
  "ref": "$REF",
  "inputs": {
    "config": $CONFIG_JSON
  }
}
EOF
)

echo -e "\n${YELLOW}🌐 Triggering GitHub Action...${NC}"

# Make API call
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/$REPO/actions/workflows/$WORKFLOW_FILE/dispatches" \
  -d "$PAYLOAD")

# Parse response
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -eq 204 ]; then
    echo -e "${GREEN}✅ Workflow triggered successfully!${NC}"
    
    echo -e "\n${BLUE}🔗 Links:${NC}"
    echo "  Repository: https://github.com/$REPO"
    echo "  Actions: https://github.com/$REPO/actions"
    echo "  Workflow: https://github.com/$REPO/actions/workflows/$WORKFLOW_FILE"
    
    echo -e "\n${YELLOW}📋 Next Steps:${NC}"
    echo "1. Visit the Actions page to monitor progress"
    echo "2. Download artifacts when scan completes"
    echo "3. Check workflow logs for detailed output"
    
else
    echo -e "${RED}❌ Failed to trigger workflow${NC}"
    echo "HTTP Code: $HTTP_CODE"
    echo "Response: $RESPONSE_BODY"
    exit 1
fi

echo -e "\n${GREEN}🎉 Done!${NC}"