# Scan Management API - cURL Examples

## SCAN MANAGEMENT

### 1. Create New Accessibility Scan
curl -X POST "http://localhost:3000/api/projects/project-uuid-here/scans" \
  -H "Content-Type: application/json" \
  -H "x-request-id: create-scan-001" \
  -d '{
    "triggered_by": "auth0|6123456789abcdef",
    "trigger_source": "manual",
    "scan_config": {
      "scan_depth": 3,
      "include_patterns": ["/products/*", "/about/*", "/contact"],
      "exclude_patterns": ["/admin/*", "/api/*", "/private/*"],
      "wait_time": 2000,
      "viewport": "1920x1080",
      "user_agent": "AccessibilityScanner/1.0"
    },
    "metadata": {
      "requested_by": "John Doe",
      "priority": "high",
      "deadline": "2025-01-10"
    }
  }'

### 2. List Project Scans with Pagination
curl -X GET "http://localhost:3000/api/projects/project-uuid-here/scans?page=1&limit=20&status=completed&user_id=auth0|6123456789abcdef" \
  -H "x-request-id: get-project-scans-001"

### 3. Get Detailed Scan Results
curl -X GET "http://localhost:3000/api/scans/scan-uuid-here?user_id=auth0|6123456789abcdef" \
  -H "x-request-id: get-scan-details-001"

### 4. Update Scan Status
curl -X PUT "http://localhost:3000/api/scans/scan-uuid-here/status" \
  -H "Content-Type: application/json" \
  -H "x-request-id: update-scan-status-001" \
  -d '{
    "status": "completed",
    "updated_by": "auth0|6123456789abcdef",
    "total_urls": 127,
    "total_issues": 45,
    "unique_issues": 23,
    "passed_checks": 1250,
    "failed_checks": 45,
    "high_impact_issues": 8,
    "medium_impact_issues": 22,
    "low_impact_issues": 15,
    "duration_ms": 480000,
    "scan_summary": {
      "coverage": "98%",
      "accessibility_score": 85,
      "top_issues": ["missing-alt-text", "color-contrast", "keyboard-navigation"]
    }
  }'

### 5. Get Scan Summary
curl -X GET "http://localhost:3000/api/scans/scan-uuid-here/summary?user_id=auth0|6123456789abcdef" \
  -H "x-request-id: get-scan-summary-001"

### 6. Export Scan Results
curl -X GET "http://localhost:3000/api/scans/scan-uuid-here/export?format=json&user_id=auth0|6123456789abcdef" \
  -H "x-request-id: export-scan-001"

### 7. Delete Scan
curl -X DELETE "http://localhost:3000/api/scans/scan-uuid-here" \
  -H "Content-Type: application/json" \
  -H "x-request-id: delete-scan-001" \
  -d '{
    "deleted_by": "auth0|6123456789abcdef"
  }'

## SCAN URLS & RESULTS

### 8. List Scan URLs
curl -X GET "http://localhost:3000/api/scans/scan-uuid-here/urls?page=1&limit=50&status_code_filter=success&user_id=auth0|6123456789abcdef" \
  -H "x-request-id: get-scan-urls-001"

### 9. Get Scan URL Details
curl -X GET "http://localhost:3000/api/scan-urls/scan-url-uuid-here?user_id=auth0|6123456789abcdef" \
  -H "x-request-id: get-scan-url-details-001"

### 10. Get Screenshot
curl -X GET "http://localhost:3000/api/scan-urls/scan-url-uuid-here/screenshot?user_id=auth0|6123456789abcdef" \
  -H "x-request-id: get-screenshot-001" \
  --output screenshot.png

### 11. Get HTML Snapshot
curl -X GET "http://localhost:3000/api/scan-urls/scan-url-uuid-here/html-snapshot?user_id=auth0|6123456789abcdef" \
  -H "x-request-id: get-html-snapshot-001"

### 12. Download HTML Snapshot
curl -X GET "http://localhost:3000/api/scan-urls/scan-url-uuid-here/html-snapshot?download=true&user_id=auth0|6123456789abcdef" \
  -H "x-request-id: download-html-snapshot-001" \
  --output page-snapshot.html

## ISSUES MANAGEMENT

### 13. List Issues for Scan URL
curl -X GET "http://localhost:3000/api/scan-urls/scan-url-uuid-here/issues?page=1&limit=25&impact=high&status=open&user_id=auth0|6123456789abcdef" \
  -H "x-request-id: get-scan-url-issues-001"

### 14. Get Issue Details
curl -X GET "http://localhost:3000/api/issues/issue-uuid-here?user_id=auth0|6123456789abcdef" \
  -H "x-request-id: get-issue-details-001"

### 15. Update Issue Status
curl -X PUT "http://localhost:3000/api/issues/issue-uuid-here/status" \
  -H "Content-Type: application/json" \
  -H "x-request-id: update-issue-status-001" \
  -d '{
    "status": "resolved",
    "updated_by": "auth0|6123456789abcdef"
  }'

### 16. Bulk Update Issues
curl -X POST "http://localhost:3000/api/issues/bulk-update" \
  -H "Content-Type: application/json" \
  -H "x-request-id: bulk-update-issues-001" \
  -d '{
    "issue_ids": [
      "issue-uuid-1",
      "issue-uuid-2",
      "issue-uuid-3"
    ],
    "updates": {
      "status": "ignored",
      "tags": "false-positive,design-decision"
    },
    "updated_by": "auth0|6123456789abcdef"
  }'

### 17. Get Trending Issues
curl -X GET "http://localhost:3000/api/projects/project-uuid-here/issues/trending?days=30&limit=10&impact=high&user_id=auth0|6123456789abcdef" \
  -H "x-request-id: get-trending-issues-001"

### 18. Get Issue Statistics
curl -X GET "http://localhost:3000/api/projects/project-uuid-here/issues/stats?days=30&scan_status=completed&user_id=auth0|6123456789abcdef" \
  -H "x-request-id: get-issue-stats-001"

## NEW ISSUE CREATION ENDPOINTS

### 19. Create Individual Issue
curl -X POST "http://localhost:3000/api/scan-urls/scan-url-uuid-here/issues" \
  -H "Content-Type: application/json" \
  -H "x-request-id: create-issue-001" \
  -d '{
    "issue_code": "missing-alt-text",
    "description": "Image element is missing alternative text that describes the content of the image",
    "impact": "high",
    "tags": "images,accessibility,wcag-aa",
    "help_url": "https://dequeuniversity.com/rules/axe/4.6/image-alt",
    "selector": "img.product-image:nth-child(3)",
    "html_snippet": "<img src=\"product-123.jpg\" class=\"product-image\" width=\"200\" height=\"150\">",
    "screenshot_region": {
      "x": 120,
      "y": 340,
      "width": 200,
      "height": 150
    },
    "wcag_guideline": "1.1.1",
    "recommendation": "Add a descriptive alt attribute to the image that conveys the same information as the image",
    "created_by": "auth0|scanner-bot"
  }'

### 20. Bulk Create Issues (Scanner Integration)
curl -X POST "http://localhost:3000/api/scan-urls/scan-url-uuid-here/issues/bulk" \
  -H "Content-Type: application/json" \
  -H "x-request-id: bulk-create-issues-001" \
  -d '{
    "created_by": "auth0|scanner-bot",
    "issues": [
      {
        "issue_code": "missing-alt-text",
        "description": "Image missing alternative text",
        "impact": "high",
        "wcag_guideline": "1.1.1",
        "selector": "img.hero-banner",
        "html_snippet": "<img src=\"hero.jpg\" class=\"hero-banner\">",
        "recommendation": "Add descriptive alt text to the hero banner image"
      },
      {
        "issue_code": "color-contrast",
        "description": "Text has insufficient color contrast against background",
        "impact": "medium", 
        "wcag_guideline": "1.4.3",
        "selector": ".btn-secondary",
        "html_snippet": "<button class=\"btn-secondary\">Learn More</button>",
        "recommendation": "Increase contrast ratio to at least 4.5:1"
      },
      {
        "issue_code": "keyboard-navigation",
        "description": "Interactive element is not keyboard accessible",
        "impact": "high",
        "wcag_guideline": "2.1.1",
        "selector": ".custom-dropdown",
        "html_snippet": "<div class=\"custom-dropdown\" onclick=\"toggle()\">Options</div>",
        "recommendation": "Add tabindex and keyboard event handlers"
      },
      {
        "issue_code": "form-label",
        "description": "Form input missing associated label",
        "impact": "medium",
        "wcag_guideline": "1.3.1",
        "selector": "input[name=\"email\"]",
        "html_snippet": "<input type=\"email\" name=\"email\" placeholder=\"Enter email\">",
        "recommendation": "Associate input with a proper label element"
      },
      {
        "issue_code": "heading-structure",
        "description": "Heading levels skip from h1 to h3",
        "impact": "low",
        "wcag_guideline": "1.3.1",
        "selector": "h3.section-title",
        "html_snippet": "<h3 class=\"section-title\">Our Services</h3>",
        "recommendation": "Use proper heading hierarchy (h1, h2, h3, etc.)"
      }
    ]
  }'

## NEW ENDPOINT: Create Scan URL Entry

### 21. Create Scan URL Entry (Extension Integration)
curl -X POST "http://localhost:3000/api/scan-urls" \
  -H "Content-Type: application/json" \
  -H "x-request-id: create-scan-url-001" \
  -d '{
    "scan_id": "scan-uuid-here",
    "url": "https://example.com/products",
    "page_title": "Our Products - Example Store",
    "page_load_time_ms": 1250,
    "status_code": 200,
    "screenshot_path": "/screenshots/products-page.png",
    "html_snapshot_path": "/snapshots/products-page.html",
    "created_by": "auth0|extension-user"
  }'

### 22. Create Scan URL Entry (Minimal Fields)
curl -X POST "http://localhost:3000/api/scan-urls" \
  -H "Content-Type: application/json" \
  -H "x-request-id: create-scan-url-minimal" \
  -d '{
    "scan_id": "scan-uuid-here",
    "url": "https://example.com/about",
    "created_by": "auth0|extension-user"
  }'

### 23. Chrome Extension Integration Example
# This shows the complete flow for Chrome extension
SCAN_ID="your-scan-id-here"
USER_ID="auth0|extension-user"

# Create scan URL entry for current page
curl -X POST "http://localhost:3000/api/scan-urls" \
  -H "Content-Type: application/json" \
  -H "x-request-id: extension-create-url" \
  -d "{
    \"scan_id\": \"$SCAN_ID\",
    \"url\": \"$(echo $CURRENT_PAGE_URL)\",
    \"page_title\": \"$(echo $PAGE_TITLE)\",
    \"page_load_time_ms\": $(echo $LOAD_TIME),
    \"status_code\": 200,
    \"created_by\": \"$USER_ID\"
  }"

## EXPECTED RESPONSES

### Create Scan Response:
# {
#   "success": true,
#   "scan": {
#     "id": "scan-uuid-here",
#     "project_id": "project-uuid-here",
#     "status": "pending",
#     "trigger_source": "manual",
#     "scan_config": { ... },
#     "started_at": "2025-01-04T23:30:00.000Z",
#     "created_at": "2025-01-04T23:30:00.000Z"
#   },
#   "message": "Scan created and queued successfully"
# }

### Scan Details Response:
# {
#   "scan": {
#     "id": "scan-uuid-here",
#     "project": {
#       "id": "project-uuid-here",
#       "name": "E-commerce Website",
#       "organization_id": "org-uuid-here"
#     },
#     "status": "completed",
#     "trigger_source": "manual",
#     "started_at": "2025-01-04T23:30:00.000Z",
#     "finished_at": "2025-01-04T23:38:00.000Z",
#     "duration_ms": 480000,
#     "total_urls": 127,
#     "total_issues": 45,
#     "high_impact_issues": 8,
#     "medium_impact_issues": 22,
#     "low_impact_issues": 15,
#     "triggered_by": {
#       "name": "John Doe",
#       "email": "john.doe@example.com"
#     },
#     "actual_counts": {
#       "url_count": 127,
#       "total_issues_count": 45
#     }
#   }
# }

### Scan Summary Response:
# {
#   "scan": {
#     "id": "scan-uuid-here",
#     "project_name": "E-commerce Website",
#     "status": "completed"
#   },
#   "summary": {
#     "urls_scanned": 127,
#     "successful_urls": 125,
#     "failed_urls": 2,
#     "avg_page_load_time": 1250,
#     "total_issues": 45,
#     "high_impact_issues": 8,
#     "medium_impact_issues": 22,
#     "low_impact_issues": 15,
#     "wcag_violations": ["1.1.1", "1.4.3", "2.1.1", "4.1.2"],
#     "issue_types": ["missing-alt-text", "color-contrast", "keyboard-navigation"],
#     "top_issues": [
#       {
#         "issue_code": "missing-alt-text",
#         "wcag_guideline": "1.1.1",
#         "impact": "high",
#         "frequency": 15
#       }
#     ]
#   }
# }

### Issue Statistics Response:
# {
#   "project_id": "project-uuid-here",
#   "statistics": {
#     "total_issues": 156,
#     "open_issues": 89,
#     "resolved_issues": 54,
#     "ignored_issues": 13,
#     "impact_breakdown": {
#       "high": 23,
#       "medium": 78,
#       "low": 55
#     },
#     "unique_wcag_violations": 12,
#     "unique_issue_types": 18,
#     "affected_urls": 45,
#     "avg_resolution_hours": 72.5
#   },
#   "wcag_breakdown": [
#     {
#       "guideline": "1.4.3",
#       "total_count": 34,
#       "open_count": 18
#     }
#   ]
# }

## FILTERING AND PAGINATION

### Filter Scans by Status and Source
curl -X GET "http://localhost:3000/api/projects/project-uuid-here/scans?status=completed&trigger_source=scheduled&sort_by=finished_at&sort_order=DESC" \
  -H "x-request-id: filter-scans-001"

### Filter URLs with Issues Only
curl -X GET "http://localhost:3000/api/scans/scan-uuid-here/urls?has_issues_only=true&status_code_filter=success" \
  -H "x-request-id: filter-urls-with-issues-001"

### Filter Issues by WCAG Guideline
curl -X GET "http://localhost:3000/api/scan-urls/scan-url-uuid-here/issues?wcag_guideline=1.4.3&impact=high&status=open" \
  -H "x-request-id: filter-issues-wcag-001"

## ERROR EXAMPLES

### Missing Required Fields
curl -X POST "http://localhost:3000/api/projects/project-uuid-here/scans" \
  -H "Content-Type: application/json" \
  -d '{
    "trigger_source": "manual"
  }'
# Response: 400 Bad Request
# { "error": "Missing required field: triggered_by" }

### Invalid Status Update
curl -X PUT "http://localhost:3000/api/scans/scan-uuid-here/status" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "invalid_status",
    "updated_by": "auth0|6123456789abcdef"
  }'
# Response: 400 Bad Request
# { "error": "Invalid status", "message": "Status must be one of: pending, running, completed, failed, cancelled" }

### Scan Not Found
curl -X GET "http://localhost:3000/api/scans/123e4567-e89b-12d3-a456-426614174000"
# Response: 404 Not Found
# { "error": "Scan not found" }

### Access Denied
curl -X GET "http://localhost:3000/api/scans/scan-uuid-here?user_id=auth0|unauthorized-user"
# Response: 403 Forbidden
# { "error": "Access denied", "message": "You do not have access to this scan" }

## WORKFLOW EXAMPLES

### Complete Scan Lifecycle
# 1. Create scan
curl -X POST "http://localhost:3000/api/projects/project-uuid-here/scans" \
  -H "Content-Type: application/json" \
  -d '{"triggered_by": "auth0|user123", "trigger_source": "manual"}'

# 2. Update to running
curl -X PUT "http://localhost:3000/api/scans/scan-uuid-here/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "running", "updated_by": "auth0|user123"}'

# 3. Complete with results
curl -X PUT "http://localhost:3000/api/scans/scan-uuid-here/status" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "updated_by": "auth0|user123",
    "total_urls": 50,
    "total_issues": 23,
    "high_impact_issues": 5
  }'

# 4. Get summary
curl -X GET "http://localhost:3000/api/scans/scan-uuid-here/summary?user_id=auth0|user123"

# 5. Export results
curl -X GET "http://localhost:3000/api/scans/scan-uuid-here/export?format=json&user_id=auth0|user123"

### Issue Management Workflow
# 1. Get issues for a URL
curl -X GET "http://localhost:3000/api/scan-urls/scan-url-uuid-here/issues?status=open&impact=high"

# 2. Review specific issue
curl -X GET "http://localhost:3000/api/issues/issue-uuid-here"

# 3. Resolve issue
curl -X PUT "http://localhost:3000/api/issues/issue-uuid-here/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "resolved", "updated_by": "auth0|user123"}'

# 4. Bulk update similar issues
curl -X POST "http://localhost:3000/api/issues/bulk-update" \
  -H "Content-Type: application/json" \
  -d '{
    "issue_ids": ["issue-1", "issue-2", "issue-3"],
    "updates": {"status": "ignored"},
    "updated_by": "auth0|user123"
  }'

### Scanner Integration Pattern
# This shows how a scanner would integrate with the API

# 1. Create scan
SCAN_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/projects/project-uuid/scans" \
  -H "Content-Type: application/json" \
  -d '{"triggered_by": "auth0|scanner", "trigger_source": "automated"}')

SCAN_ID=$(echo $SCAN_RESPONSE | jq -r '.scan.id')

# 2. Update to running
curl -X PUT "http://localhost:3000/api/scans/$SCAN_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "running", "updated_by": "auth0|scanner"}'

# 3. For each URL discovered, create scan_url and issues
# (Note: You'll need to implement POST /scan-urls endpoint for this)

# 4. Create issues for a URL
curl -X POST "http://localhost:3000/api/scan-urls/scan-url-uuid/issues/bulk" \
  -H "Content-Type: application/json" \
  -d '{
    "created_by": "auth0|scanner",
    "issues": [
      {
        "issue_code": "missing-alt-text",
        "description": "Image missing alt text",
        "impact": "high",
        "wcag_guideline": "1.1.1"
      }
    ]
  }'

# 5. Complete scan
curl -X PUT "http://localhost:3000/api/scans/$SCAN_ID/status" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "updated_by": "auth0|scanner",
    "total_urls": 25,
    "total_issues": 47,
    "high_impact_issues": 8
  }'

## DATA FLOW VERIFICATION

### Verify Complete Data Flow
# 1. Check scan details
curl "http://localhost:3000/api/scans/$SCAN_ID?user_id=auth0|user123"

# 2. Check scan URLs
curl "http://localhost:3000/api/scans/$SCAN_ID/urls?user_id=auth0|user123"

# 3. Check issues for a URL
curl "http://localhost:3000/api/scan-urls/scan-url-uuid/issues?user_id=auth0|user123"

# 4. Check project statistics
curl "http://localhost:3000/api/projects/project-uuid/issues/stats?user_id=auth0|user123"

## ERROR HANDLING EXAMPLES

### Missing Required Fields
curl -X POST "http://localhost:3000/api/scan-urls/scan-url-uuid/issues" \
  -H "Content-Type: application/json" \
  -d '{
    "issue_code": "missing-alt-text"
  }'
# Response: 400 Bad Request
# { "error": "Missing required field: created_by" }

### Invalid Scan URL
curl -X POST "http://localhost:3000/api/scan-urls/invalid-uuid/issues" \
  -H "Content-Type: application/json" \
  -d '{
    "issue_code": "test-issue", 
    "created_by": "auth0|user123"
  }'
# Response: 404 Not Found
# { "error": "Scan URL not found" }

### Too Many Issues in Bulk
curl -X POST "http://localhost:3000/api/scan-urls/scan-url-uuid/issues/bulk" \
  -H "Content-Type: application/json" \
  -d '{
    "created_by": "auth0|user123",
    "issues": []
  }'
# Response: 400 Bad Request
# { "error": "Missing or invalid issues array" }

## PROJECT STATISTICS FIX

### 24. Manually Refresh Project Statistics
curl -X PUT "http://localhost:3000/api/projects/efacc480-c790-4335-90dd-4ae812e12349/refresh-stats?user_id=auth0|user123" \
  -H "Content-Type: application/json" \
  -H "x-request-id: refresh-stats-001"

### 25. Refresh Statistics for Specific Project (Your Project)
curl -X PUT "http://localhost:3000/api/projects/efacc480-c790-4335-90dd-4ae812e12349/refresh-stats" \
  -H "Content-Type: application/json" \
  -H "x-request-id: fix-my-project-stats"

## UTILITY SCRIPT USAGE

### Run the utility script to fix all project statistics:
```bash
# Fix all projects
node scripts/fix-project-statistics.js

# Fix specific project only
node scripts/fix-project-statistics.js efacc480-c790-4335-90dd-4ae812e12349
```

### Expected Response from Refresh Stats:
# {
#   "success": true,
#   "project": {
#     "id": "efacc480-c790-4335-90dd-4ae812e12349",
#     "total_scans": 3,
#     "total_urls": 15,
#     "total_issues": 45,
#     "high_impact_issues": 8,
#     "medium_impact_issues": 22,
#     "low_impact_issues": 15,
#     "last_scan_at": "2025-01-04T23:50:00.000Z",
#     "last_scan_id": "latest-scan-uuid",
#     "updated_at": "2025-01-04T23:55:00.000Z"
#   },
#   "message": "Project statistics refreshed successfully"
# }

## AUTOMATIC STATISTICS UPDATE

# From now on, when you complete a scan, project statistics will be automatically updated
curl -X PUT "http://localhost:3000/api/scans/scan-uuid-here/status" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "updated_by": "auth0|user123",
    "total_urls": 5,
    "total_issues": 12,
    "high_impact_issues": 2,
    "medium_impact_issues": 7,
    "low_impact_issues": 3
  }'
# This will automatically update the project statistics

## UNIQUE ISSUES TRACKING

### 26. Get Unique Issues for Scan
curl -X GET "http://localhost:3000/api/scans/scan-uuid-here/unique-issues?user_id=auth0|user123" \
  -H "x-request-id: get-unique-issues-001"

### 27. Get Scan URLs with Unique Issues Count
curl -X GET "http://localhost:3000/api/scans/scan-uuid-here/urls?user_id=auth0|user123" \
  -H "x-request-id: get-urls-unique-issues"

## EXPECTED RESPONSES

### Unique Issues Response:
# {
#   "scan_id": "scan-uuid-here",
#   "unique_issues_summary": {
#     "total_unique_issues": 8,
#     "total_issues_count": 25,
#     "total_urls_scanned": 5,
#     "unique_high_impact_issues": 2,
#     "unique_medium_impact_issues": 4,
#     "unique_low_impact_issues": 2,
#     "unique_issue_codes": ["missing-alt-text", "color-contrast", "keyboard-navigation"],
#     "unique_wcag_violations": ["1.1.1", "1.4.3", "2.1.1"],
#     "uniqueness_ratio": 32
#   },
#   "generated_at": "2025-01-04T23:55:00.000Z"
# }

### Scan URLs with Unique Issues (Updated Response):
# {
#   "scan": {
#     "id": "scan-uuid-here",
#     "status": "completed",
#     "project_name": "My Website"
#   },
#   "urls": [
#     {
#       "id": "scan-url-uuid-1",
#       "url": "https://example.com/page1",
#       "page_title": "Home Page",
#       "status_code": 200,
#       "page_load_time_ms": 1250,
#       "total_issues": 5,
#       "unique_issues_count": 3,
#       "total_issues_count": 5,
#       "passed_checks": 15,
#       "failed_checks": 5,
#       "has_screenshot": true,
#       "has_html_snapshot": true,
#       "created_at": "2025-01-04T23:50:00.000Z"
#     },
#     {
#       "id": "scan-url-uuid-2", 
#       "url": "https://example.com/page2",
#       "page_title": "About Page",
#       "status_code": 200,
#       "page_load_time_ms": 980,
#       "total_issues": 8,
#       "unique_issues_count": 4,
#       "total_issues_count": 8,
#       "passed_checks": 22,
#       "failed_checks": 8,
#       "has_screenshot": false,
#       "has_html_snapshot": true,
#       "created_at": "2025-01-04T23:52:00.000Z"
#     }
#   ],
#   "pagination": {
#     "page": 1,
#     "limit": 50,
#     "total": 2,
#     "pages": 1,
#     "has_next": false,
#     "has_prev": false
#   }
# }

## UNDERSTANDING UNIQUE ISSUES

### What counts as "unique"?
# - Issues are considered unique based on their `issue_code` field
# - For example: "missing-alt-text", "color-contrast", "keyboard-navigation"
# - If the same issue type appears on multiple elements, it's still counted as 1 unique issue
# - This helps identify the types of accessibility problems, not just the volume

### URL Level vs Scan Level:
# - **URL Level**: How many unique issue types exist on this specific page
# - **Scan Level**: How many unique issue types exist across the entire website scan
# - **Uniqueness Ratio**: Percentage of unique issues vs total issues (lower is better for fixing)

### Example Scenario:
# Page 1: 
#   - 3x "missing-alt-text" issues
#   - 2x "color-contrast" issues  
#   - unique_issues_count = 2
#   - total_issues_count = 5
#
# Page 2:
#   - 1x "missing-alt-text" issue
#   - 3x "keyboard-navigation" issues
#   - unique_issues_count = 2
#   - total_issues_count = 4
#
# Scan Total:
#   - total_unique_issues = 3 (missing-alt-text, color-contrast, keyboard-navigation)
#   - total_issues_count = 9
#   - uniqueness_ratio = 33% (3/9)

## UNDERSTANDING URL-LEVEL UNIQUE ISSUES

### Example Response Interpretation:
```json
{
  "url": "https://example.com/products",
  "total_issues": 12,           // Total instances of all issues on this page
  "unique_issues_count": 4,     // 4 different types of issues found
  "total_issues_count": 12      // Same as total_issues (for consistency)
}
```

### Real-World Example:
**Page: https://example.com/products**
- 5x "missing-alt-text" issues (5 images without alt text)
- 3x "color-contrast" issues (3 elements with poor contrast)  
- 2x "missing-alt-text" issues (2 more images on same page)
- 2x "keyboard-navigation" issues (2 elements not keyboard accessible)

**Result:**
- `total_issues`: 12 (total instances)
- `unique_issues_count`: 3 (missing-alt-text, color-contrast, keyboard-navigation)
- **Insight**: Fix 3 types of issues to resolve all 12 instances on this page

### Practical Usage:
```bash
# Get all URLs and their unique issues
curl "http://localhost:3000/api/scans/your-scan-id/urls?user_id=your-user-id" | jq '.urls[] | {url: .url, unique_issues: .unique_issues_count, total_issues: .total_issues}'

# Find pages with the most issue diversity (high unique issues count)
curl "http://localhost:3000/api/scans/your-scan-id/urls?user_id=your-user-id" | jq '.urls | sort_by(.unique_issues_count) | reverse | .[0:5]'

# Find pages with repetitive issues (low uniqueness ratio)
curl "http://localhost:3000/api/scans/your-scan-id/urls?user_id=your-user-id" | jq '.urls[] | select(.total_issues > 0) | {url: .url, uniqueness_ratio: (.unique_issues_count / .total_issues * 100 | floor)}'
```
### **Upload Image**
**`POST /api/upload-image`**

**Content-Type:** `multipart/form-data`

**Form Data:**
- `image` (file): Image file to upload

**Response:**
```json
{
  "success": true,
  "upload": {
    "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/accessibility-screenshots/screenshot_1234567890.jpg",
    "public_id": "accessibility-screenshots/screenshot_1234567890",
    "created_at": "2025-01-04T23:55:00.000Z",
    "format": "jpg",
    "width": 1920,
    "height": 1080,
    "size_bytes": 245760,
    "folder": "accessibility-screenshots"
  },
  "message": "Image uploaded successfully"
}
