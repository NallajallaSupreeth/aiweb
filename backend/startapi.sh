#!/bin/bash
pyenv shell 3.12.0
cd /Users/srinivasmac/Documents/backend/backend || exit
# Kill any process on port 8001
lsof -ti :8001 | xargs kill -9 2>/dev/null
# Start Uvicorn in foreground
echo "✅ Starting FastAPI server on port 8001..."
uvicorn app:app --reload --port 8001
