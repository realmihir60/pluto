#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔵 Plut Health Local Backend Launcher${NC}"

# Check if port 8000 is in use and kill it if necessary
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "⚠️  Port 8000 is occupied. Killing existing process..."
    kill -9 $(lsof -Pi :8000 -sTCP:LISTEN -t)
fi

# Run the local API server
echo -e "${GREEN}🚀 Starting FastAPI on http://localhost:8000...${NC}"
echo -e "   - Health Check: http://localhost:8000/health"
echo -e "   - Triage API:   http://localhost:8000/triage"

# Use python3 directly/from current env
python3 local_api.py
