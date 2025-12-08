#!/bin/sh
# Simplified sync loop
while true; do
  cd /vault
  git pull && git add . && git commit -m "auto-sync" && git push
  echo "Synced at $(date)"
  sleep $GIT_SYNC_INTERVAL
done
