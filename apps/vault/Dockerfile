FROM alpine:3.20

RUN apk add --no-cache git ca-certificates inotify-tools

WORKDIR /vault

COPY git-sync.sh git-sync-realtime.sh git_conflict_simulation.sh vault-init.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/*.sh

ENV SYNC_MODE=interval
ENV GIT_SYNC_INTERVAL=30

ENTRYPOINT ["/usr/local/bin/vault-init.sh"]

# Basic healthcheck: ensure the vault volume path exists and is accessible
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD [ "test", "-d", "/vault" ] || exit 1
