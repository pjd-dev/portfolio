# Production Operations Procedures

## Phase 4 Objective 5: Production Operational Procedures

---

## Table of Contents

1. [Daily Operations](#daily-operations)
2. [Monitoring & Alerting](#monitoring--alerting)
3. [Scaling Procedures](#scaling-procedures)
4. [Maintenance Windows](#maintenance-windows)
5. [Backup & Recovery](#backup--recovery)
6. [Performance Optimization](#performance-optimization)

---

## Daily Operations

### Morning Checklist (Start of Business Day)

```bash
#!/usr/bin/env bash
# Daily operations checklist

# 1. System Status
podman ps -a | grep -E "mcp|vaulty"

# 2. Health Check
curl -s http://localhost:4000/health | jq .
curl -s http://localhost:3333/health | jq .

# 3. Resource Usage
podman stats --no-stream mcp-prod vaulty-prod

# 4. Recent Errors
echo "=== MCP Errors ==="
podman logs mcp-prod --since 24h | grep -i error | tail -10

echo "=== Vaulty Errors ==="
podman logs vaulty-prod --since 24h | grep -i error | tail -10

# 5. Disk Space
df -h / | tail -1

# 6. Database Connectivity
curl -s http://localhost:3333/api/health/db | jq .
```

---

### Hourly Monitoring (During Business Hours)

```bash
#!/usr/bin/env bash
# Hourly monitoring script

# Check every hour
while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

    # Health check
    MCP_HEALTH=$(curl -s http://localhost:4000/health | jq -r '.status')
    VAULTY_HEALTH=$(curl -s http://localhost:3333/health | jq -r '.status')

    # Resource check
    MCP_MEMORY=$(podman stats --no-stream mcp-prod --format "{{.MemPerc}}" 2>/dev/null)
    VAULTY_MEMORY=$(podman stats --no-stream vaulty-prod --format "{{.MemPerc}}" 2>/dev/null)

    echo "[$TIMESTAMP] MCP: $MCP_HEALTH ($MCP_MEMORY) | Vaulty: $VAULTY_HEALTH ($VAULTY_MEMORY)"

    # Alert if unhealthy
    if [[ "$MCP_HEALTH" != "healthy" || "$VAULTY_HEALTH" != "healthy" ]]; then
        echo "⚠️  SERVICE ALERT: $TIMESTAMP"
        # Trigger alert: Slack, PagerDuty, etc.
    fi

    sleep 3600  # 1 hour
done
```

---

### Evening Checklist (End of Business Day)

```bash
#!/usr/bin/env bash
# Evening operations checklist

# 1. System Status
echo "=== Current Status ==="
podman ps -a | grep -E "mcp|vaulty"

# 2. Error Summary
echo "=== Error Count (last 24h) ==="
echo "MCP: $(podman logs mcp-prod --since 24h | grep -ic error) errors"
echo "Vaulty: $(podman logs vaulty-prod --since 24h | grep -ic error) errors"

# 3. Performance Summary
echo "=== Performance Metrics ==="
podman stats --no-stream --format "table {{.Names}}\t{{.CPUPerc}}\t{{.MemPerc}}" mcp-prod vaulty-prod

# 4. Storage Check
echo "=== Storage Status ==="
df -h / | tail -1

# 5. Create daily backup
echo "=== Creating Daily Backup ==="
BACKUP_PATH="./backups/daily-$(date +%Y%m%d)"
mkdir -p "$BACKUP_PATH"
cp -r ./vault-data "$BACKUP_PATH/" || echo "Backup failed"
echo "Backup size: $(du -sh "$BACKUP_PATH" | cut -f1)"
```

---

## Monitoring & Alerting

### Key Metrics to Monitor

| Metric             | Normal Range | Warning | Critical |
| ------------------ | ------------ | ------- | -------- |
| CPU Usage          | <30%         | >60%    | >80%     |
| Memory Usage       | <50%         | >75%    | >90%     |
| Disk I/O           | <1ms latency | >10ms   | >100ms   |
| Request Latency    | <200ms p99   | >500ms  | >1s      |
| Error Rate         | <0.01%       | >0.1%   | >1%      |
| Container Restarts | 0/day        | >2/day  | >5/day   |

---

### Setting Up Prometheus Monitoring

```yaml
# config/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'mcp'
    static_configs:
      - targets: ['localhost:4000']
    metrics_path: '/metrics'

  - job_name: 'vaulty'
    static_configs:
      - targets: ['localhost:3333']
    metrics_path: '/metrics'

  - job_name: 'cadvisor' # Container metrics
    static_configs:
      - targets: ['localhost:8080']
```

---

### Alert Rules

```yaml
# config/alert-rules.yml
groups:
  - name: production
    rules:
      - alert: ServiceDown
        expr: up{job=~"mcp|vaulty"} == 0
        for: 2m
        annotations:
          summary: '{{ $labels.job }} is down'

      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes / 1024 / 1024 > 3500
        for: 5m
        annotations:
          summary: 'High memory usage: {{ $value }}MB'

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
        for: 5m
        annotations:
          summary: 'High error rate detected'

      - alert: DiskSpaceLow
        expr: node_filesystem_avail_bytes{mountpoint="/"} / 1024 / 1024 / 1024 < 10
        for: 5m
        annotations:
          summary: 'Low disk space: {{ $value }}GB free'
```

---

### Slack Integration

```bash
#!/usr/bin/env bash
# Alert to Slack on issues

SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

send_alert() {
    local severity="$1"
    local message="$2"

    local color="good"
    if [[ "$severity" == "warning" ]]; then
        color="warning"
    elif [[ "$severity" == "critical" ]]; then
        color="danger"
    fi

    curl -X POST "$SLACK_WEBHOOK" \
        -H 'Content-Type: application/json' \
        -d @- << EOF
{
    "attachments": [
        {
            "color": "$color",
            "title": "Production Alert",
            "text": "$message",
            "ts": $(date +%s)
        }
    ]
}
EOF
}

# Example usage
if [[ $MCP_CPU -gt 80 ]]; then
    send_alert "critical" "MCP CPU usage critical: ${MCP_CPU}%"
fi
```

---

## Scaling Procedures

### Vertical Scaling (Increase Resources)

```bash
#!/usr/bin/env bash
# Vertical scaling - increase CPU/memory

# 1. Update production.env
export VAULTY_MEMORY_LIMIT="8Gi"  # Increase from 4Gi
export VAULTY_CPU_LIMIT="4000m"   # Increase from 2000m

# 2. Stop current container
podman stop vaulty-prod

# 3. Remove old container
podman rm vaulty-prod --force

# 4. Start new container with updated limits
podman run -d \
    --name vaulty-prod \
    --pod production-pod \
    --cpus 4 \
    --memory 8Gi \
    -e "NODE_ENV=production" \
    -e "PORT=3333" \
    -v vault-data:/app/data \
    ghcr.io/org/vaulty:latest

# 5. Verify
podman stats --no-stream vaulty-prod
```

---

### Horizontal Scaling (Add Replicas)

```bash
#!/usr/bin/env bash
# Horizontal scaling - add replica instances

# 1. Update replica configuration
export MCP_REPLICAS="3"  # Increase from 2
export VAULTY_REPLICAS="3"

# 2. Update load balancer config
cat > config/nginx-lb.conf << 'EOF'
upstream mcp_backend {
    server mcp-prod-1:4000;
    server mcp-prod-2:4000;
    server mcp-prod-3:4000;
}

upstream vaulty_backend {
    server vaulty-prod-1:3333;
    server vaulty-prod-2:3333;
    server vaulty-prod-3:3333;
}
EOF

# 3. Start new container instances
podman run -d --name mcp-prod-3 --pod production-pod ghcr.io/org/mcp:latest
podman run -d --name vaulty-prod-3 --pod production-pod \
    -v vault-data:/app/data \
    ghcr.io/org/vaulty:latest

# 4. Reload load balancer
nginx -s reload

# 5. Verify all replicas
podman ps | grep -E "mcp-prod|vaulty-prod"
```

---

### Scaling Down

```bash
#!/usr/bin/env bash
# Scale down during low traffic periods

# Stop least-loaded replicas
podman stop mcp-prod-3
podman stop vaulty-prod-3

# Remove containers
podman rm mcp-prod-3
podman rm vaulty-prod-3

# Update load balancer
# (Remove entries for stopped replicas)

# Verify
podman ps | grep -E "mcp-prod|vaulty-prod"
```

---

## Maintenance Windows

### Scheduled Maintenance

```bash
#!/usr/bin/env bash
# Scheduled maintenance procedures

# 1. Announce maintenance window
echo "Announcing maintenance window in Slack/Status Page"

# 2. Enable maintenance mode
touch ./config/maintenance.flag

# 3. Graceful shutdown
podman stop mcp-prod
podman stop vaulty-prod

# 4. Perform maintenance
echo "- Update dependencies"
echo "- Apply security patches"
echo "- Optimize database"
echo "- Clean up logs"

# 5. Restart services
podman start mcp-prod
podman start vaulty-prod

# 6. Verify services
./scripts/services/verify.sh

# 7. Disable maintenance mode
rm ./config/maintenance.flag

# 8. Communicate completion
echo "Maintenance completed - services restored"
```

---

### Database Maintenance

```bash
#!/usr/bin/env bash
# Database optimization and maintenance

# 1. Stop write operations (optional)
curl -X POST http://localhost:3333/api/admin/read-only

# 2. Backup database
pg_dump -U postgres vault_db > backups/vault_db.sql

# 3. Vacuum database
psql -U postgres -d vault_db -c "VACUUM FULL;"

# 4. Analyze tables
psql -U postgres -d vault_db -c "ANALYZE;"

# 5. Reindex
psql -U postgres -d vault_db -c "REINDEX DATABASE vault_db;"

# 6. Resume write operations
curl -X POST http://localhost:3333/api/admin/write-enabled

# 7. Verify data integrity
./scripts/deployment/validate-production.sh
```

---

### Certificate Rotation

```bash
#!/usr/bin/env bash
# SSL/TLS certificate rotation

# 1. Generate new certificate
openssl req -new -newkey rsa:2048 -keyout config/vault.key \
    -out config/vault.csr

# 2. Get signed certificate
# Submit CSR to CA, receive vault.crt

# 3. Verify certificate
openssl x509 -in config/vault.crt -text -noout

# 4. Update certificate in secrets vault
# vault write secret/production/ssl cert=@config/vault.crt

# 5. Restart services with new cert
podman restart mcp-prod vaulty-prod

# 6. Verify SSL
curl -I https://localhost:3333

# 7. Monitor for any SSL errors
podman logs mcp-prod | grep -i ssl
podman logs vaulty-prod | grep -i ssl
```

---

## Backup & Recovery

### Automated Backup Strategy

```bash
#!/usr/bin/env bash
# Automated backup script (runs daily at 2 AM)

BACKUP_DIR="./backups"
BACKUP_RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# 1. Create backup directory
mkdir -p "$BACKUP_DIR/daily-$TIMESTAMP"

# 2. Backup application data
tar -czf "$BACKUP_DIR/daily-$TIMESTAMP/vault-data.tar.gz" \
    --exclude='*.tmp' \
    --exclude='*.log' \
    ./vault-data/

# 3. Backup configuration
cp config/production.env "$BACKUP_DIR/daily-$TIMESTAMP/"
cp -r config/secrets "$BACKUP_DIR/daily-$TIMESTAMP/"

# 4. Backup database
pg_dump -U postgres vault_db | gzip > \
    "$BACKUP_DIR/daily-$TIMESTAMP/database.sql.gz"

# 5. Create backup manifest
cat > "$BACKUP_DIR/daily-$TIMESTAMP/manifest.txt" << EOF
Backup Date: $TIMESTAMP
Application Version: $(cat version.txt)
Database Size: $(du -sh ./vault-data)
Configuration: Production
Retention: $BACKUP_RETENTION_DAYS days
EOF

# 6. Verify backup integrity
tar -tzf "$BACKUP_DIR/daily-$TIMESTAMP/vault-data.tar.gz" > /dev/null && \
    echo "✅ Backup verified"

# 7. Cleanup old backups
find "$BACKUP_DIR" -type d -mtime +$BACKUP_RETENTION_DAYS -exec rm -rf {} \;

# 8. Sync to external storage (AWS S3, etc.)
aws s3 sync "$BACKUP_DIR/daily-$TIMESTAMP/" \
    "s3://backup-bucket/vault-platform/$TIMESTAMP/" || \
    echo "⚠️  S3 sync failed - retrying..."
```

---

### Point-in-Time Recovery (PITR)

```bash
#!/usr/bin/env bash
# Restore to specific point in time

TARGET_TIME="2024-01-20 10:30:00"
BACKUP_DATE="2024-01-20"

# 1. Stop services
./scripts/services/stop.sh

# 2. Find closest backup before target time
BACKUP_DIR="./backups/daily-${BACKUP_DATE}"

# 3. Restore database to target time
# Using PostgreSQL WAL archives and recovery.conf
psql -U postgres -d vault_db -c \
    "RESTORE FROM WAL WITH TARGET_TIMELINE='${TARGET_TIME}';"

# 4. Restore application data
tar -xzf "$BACKUP_DIR/vault-data.tar.gz"

# 5. Verify restoration
./scripts/services/verify.sh

# 6. Start services
./scripts/services/start.sh

# 7. Run tests
./scripts/deployment/validate-production.sh
```

---

### Disaster Recovery

```bash
#!/usr/bin/env bash
# Complete system recovery from backup

# 1. Prepare new infrastructure
# - Create new VM/container host
# - Install dependencies
# - Configure networking

# 2. Download backup from external storage
aws s3 cp "s3://backup-bucket/vault-platform/daily-20240120/" \
    ./disaster-recovery/ --recursive

# 3. Restore application
cd disaster-recovery/
tar -xzf vault-data.tar.gz

# 4. Restore database
gunzip database.sql.gz
psql -U postgres < database.sql

# 5. Restore configuration
cp production.env ../config/
cp -r secrets ../config/

# 6. Start services
./scripts/services/start.sh

# 7. Verify all systems
./scripts/services/verify.sh
./scripts/deployment/validate-production.sh

# 8. Run smoke tests
npm run test:smoke

# 9. Update DNS/routing
# Point traffic to new infrastructure

# 10. Monitor for issues
# Watch logs, metrics, user reports
```

---

## Performance Optimization

### Performance Baseline

```bash
#!/usr/bin/env bash
# Establish performance baseline

# 1. Measure response times
echo "=== Response Time Baseline ==="
for i in {1..100}; do
    curl -w "%{time_total}\n" -o /dev/null -s http://localhost:3333/api/health
done | awk '{sum+=$1; count++} END {print "Average: " sum/count " seconds"}'

# 2. Measure throughput
echo "=== Throughput Baseline ==="
ab -n 10000 -c 100 http://localhost:3333/api/health

# 3. Measure resource usage
echo "=== Resource Usage Baseline ==="
podman stats --no-stream mcp-prod vaulty-prod

# 4. Measure database performance
echo "=== Database Performance Baseline ==="
time psql -U postgres -d vault_db -c "SELECT COUNT(*) FROM vaults;"
```

---

### Performance Optimization Techniques

```bash
#!/usr/bin/env bash
# Performance optimization procedures

# 1. Enable caching
export CACHE_ENABLED="true"
export CACHE_TTL="3600"

# 2. Optimize database queries
# - Add indexes on frequently queried columns
# - Analyze slow query logs
psql -U postgres -d vault_db << 'EOF'
-- Index frequently queried columns
CREATE INDEX idx_vault_owner ON vaults(owner_id);
CREATE INDEX idx_vault_created ON vaults(created_at);
CREATE INDEX idx_items_vault ON items(vault_id);

-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM vaults
WHERE owner_id = $1 ORDER BY created_at DESC;
EOF

# 3. Enable compression
export COMPRESSION_ENABLED="true"
export COMPRESSION_LEVEL="6"

# 4. Connection pooling
export DB_POOL_SIZE="20"
export DB_POOL_IDLE_TIMEOUT="30"

# 5. Restart services with optimizations
podman restart mcp-prod vaulty-prod

# 6. Verify improvements
echo "=== Performance After Optimization ==="
ab -n 10000 -c 100 http://localhost:3333/api/health
```

---

## Quick Reference Commands

```bash
# System Status
podman ps -a
podman logs -f mcp-prod
podman stats mcp-prod

# Health Checks
curl http://localhost:4000/health
curl http://localhost:3333/health

# Restart Services
podman restart mcp-prod vaulty-prod

# Emergency Rollback
./scripts/deployment/rollback-production.sh auto

# Create Backup
tar -czf backup-$(date +%s).tar.gz vault-data/

# Monitor Resources
watch -n 5 'podman stats --no-stream'

# View Recent Errors
podman logs mcp-prod --since 1h | grep -i error
```

---

**Last Updated:** 2024-01-20  
**Version:** 1.0  
**Author:** Platform Engineering Team
