#!/bin/bash
cd "$(dirname "$0")"
echo "👀 监听远端更新中 (10s)..."
while true; do
  before=$(git rev-parse HEAD 2>/dev/null)
  git pull origin main 2>/dev/null
  after=$(git rev-parse HEAD 2>/dev/null)
  if [ "$before" != "$after" ]; then
    echo "✅ 已拉取更新 $(date '+%H:%M:%S')"
  fi
  sleep 10
done
