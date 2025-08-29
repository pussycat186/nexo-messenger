#!/bin/bash
# NEXO smoke test wrapper - strips trailing slashes and runs comprehensive checks

set -e

# Get URL from argument or environment
URL="${1:-${SMOKE_URL:-http://127.0.0.1:5000}}"
TIMEOUT="${SMOKE_TIMEOUT_SEC:-180}"

# Strip trailing slash to avoid 301 redirects
URL=$(echo "$URL" | sed 's|/$||')

echo "🔥 NEXO Smoke Test"
echo "Target: $URL"
echo "Timeout: ${TIMEOUT}s"
echo "=========================================="

# Check if server is responding
echo "1. Health Check..."
curl -f -s --max-time 10 "$URL/health" > /dev/null || {
    echo "❌ Health check failed"
    exit 1
}
echo "✅ Health endpoint responding"

# Run TypeScript smoke test
echo "2. Running comprehensive smoke tests..."
export SMOKE_URL="$URL"
export SMOKE_TIMEOUT_SEC="$TIMEOUT"

node --loader tsx ./scripts/smoke.ts

echo "=========================================="
echo "🎉 All smoke tests PASSED"
