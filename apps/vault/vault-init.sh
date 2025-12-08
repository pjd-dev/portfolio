#!/bin/sh

echo "🧠 Vault Pod Starting with SYNC_MODE=$SYNC_MODE"

if [ "$SYNC_MODE" = "realtime" ]; then
    exec /usr/local/bin/git-sync-realtime.sh
else
    exec /usr/local/bin/git-sync.sh
fi
