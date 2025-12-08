#!/bin/sh
# Watches /vault for changes and syncs immediately
# Requires inotify-tools installed

WATCH_DIR=${WATCH_DIR:-/vault}
INTERVAL=${GIT_SYNC_INTERVAL:-2}
COMMIT_MSG=${GIT_COMMIT_MESSAGE:-"auto-sync"}

echo "Watching $WATCH_DIR for changes..."

while true; do
  inotifywait -r -e modify,create,delete "$WATCH_DIR" &&   cd "$WATCH_DIR" &&   git add . &&   git commit -m "$COMMIT_MSG" &&   git push &&   echo "Changes pushed at $(date)"
  sleep $INTERVAL
done
