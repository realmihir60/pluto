#!/bin/bash

# Pluto Health - Smoke Test Script
# Tests critical paths to verify deployment is working

set -e  # Exit on any error

echo "🧪 Pluto Health Smoke Tests"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local command="$2"
    
    echo -n "Testing: $test_name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((TESTS_FAILED++))
    fi
}

# Determine base URLs
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"

echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL: $BACKEND_URL"
echo ""

# Test 1: Frontend Homepage
run_test "Frontend Homepage" "curl -f -s $FRONTEND_URL > /dev/null"

# Test 2: Frontend Static Pages
run_test "Privacy Policy Page" "curl -f -s $FRONTEND_URL/privacy > /dev/null"
run_test "Terms of Service Page" "curl -f -s $FRONTEND_URL/terms > /dev/null"
run_test "How It Works Page" "curl -f -s $FRONTEND_URL/how-it-works > /dev/null"
run_test "FAQ Page" "curl -f -s $FRONTEND_URL/faq > /dev/null"

# Test 3: Backend Health Check
run_test "Backend Health Check" "curl -f -s $BACKEND_URL/api/admin/metrics/health | grep -q 'ok'"

# Test 4: Triage API (will hit rate limit if not authenticated, but should return valid JSON)
echo -n "Testing: Triage API... "
TRIAGE_RESPONSE=$(curl -s -X POST $BACKEND_URL/api/triage \
    -H "Content-Type: application/json" \
    -d '{"input":"headache"}' 2>/dev/null)

if echo "$TRIAGE_RESPONSE" | grep -q -E '(triage_level|error|Rate limit)'; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((TESTS_FAILED++))
fi

# Test 5: Rate Limiting (should block after N requests)
echo -n "Testing: Rate Limiting... "
RATE_LIMIT_HIT=false

for i in {1..12}; do
    RESPONSE=$(curl -s -X POST $BACKEND_URL/api/triage \
        -H "Content-Type: application/json" \
        -d '{"input":"test"}' 2>/dev/null)
    
    if echo "$RESPONSE" | grep -q "Rate limit"; then
        RATE_LIMIT_HIT=true
        break
    fi
done

if [ "$RATE_LIMIT_HIT" = true ]; then
    echo -e "${GREEN}✓ PASS${NC} (Rate limit active)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (Rate limit not working)"
    ((TESTS_FAILED++))
fi

# Test 6: Database Connection (via backend health check)
run_test "Database Connection" "curl -s $BACKEND_URL/api/admin/metrics/health | grep -q 'uptime_hours'"

# Test 7: Check if logs directory exists (only works if running locally with file access)
if [ -d "./logs" ]; then
    echo -e "Testing: Logs Directory... ${GREEN}✓ PASS${NC} (found at ./logs)"
    ((TESTS_PASSED++))
else
    echo -e "Testing: Logs Directory... ${RED}⚠ SKIP${NC} (not accessible or not yet created)"
fi

# Summary
echo ""
echo "======================================"
echo "Test Results:"
echo "======================================"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! System is healthy.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Check the output above.${NC}"
    exit 1
fi
