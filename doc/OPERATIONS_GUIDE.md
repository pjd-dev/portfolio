# Operations Guide - Vault Platform Phase 4

**Status**: ✅ PRODUCTION READY  
**Last Updated**: December 21, 2025  
**Version**: 1.0

---

## Table of Contents

1. [Daily Operations](#daily-operations)
2. [Common Tasks](#common-tasks)
3. [Troubleshooting](#troubleshooting)
4. [Performance Tuning](#performance-tuning)
5. [Backup & Recovery](#backup--recovery)
6. [Health Monitoring](#health-monitoring)

---

## Daily Operations

### Morning Checklist

```bash
# 1. Verify services running
./scripts/vault status

# Expected output:
# ✓ mcp is running
# ✓ vaulty is running
# ✓ vault is running
```

### Service Health

```bash
# Check detailed health
podman ps | grep -E "mcp|vault|vaulty"

# Expected: All containers "Up" and with status indicators
```

### Log Review

```bash
# Check for errors in last hour
./scripts/vault logs | grep -i error | tail -20

# For specific service
./scripts/vault logs mcp | grep -i error
```

---

## Common Tasks

### Starting Services

**Option 1: Quick Start (if infrastructure exists)**

```bash
./scripts/vault start
```

**Option 2: Full Initialization**

```bash
./scripts/vault infrastructure init
./scripts/vault build
./scripts/vault start
```

### Stopping Services

```bash
./scripts/vault stop
```

Services will stop gracefully in 30 seconds.

### Restarting Services

```bash
./scripts/vault restart
```

Complete stop + start cycle takes ~20-30 seconds.

### Viewing Logs

```bash
# Real-time logs (tail -f mode)
./scripts/vault logs -f

# Specific service
./scripts/vault logs mcp
./scripts/vault logs vaulty

# Search for specific events
./scripts/vault logs | grep "sync"
```

### Syncing Vault Data

```bash
# Sync vault volume to local filesystem
./scripts/vault utilities sync

# Creates backup at: ./.vault/
```

### Verifying Vault Integrity

```bash
# Check vault structure and file counts
./scripts/vault utilities verify

# Shows:
# - Required directories
# - File count
# - Large files
# - Integrity issues
```

---

## Troubleshooting

### Problem: Services Won't Start

**Symptoms:**

```
[✗] Failed to start container
```

**Solution:**

```bash
# 1. Check what went wrong
./scripts/vault logs

# 2. Try restart
./scripts/vault restart

# 3. If still failing, full reset
./scripts/vault infrastructure clean
./scripts/vault infrastructure init
./scripts/vault start
```

### Problem: High CPU Usage

**Check:**

```bash
podman stats vault mcp-server-dev vaulty
```

**Typical causes:**

- Git sync in progress (temporary)
- Large file operations
- Excessive logging

**Solution:**

```bash
# Check what's running
podman top vaulty
podman top mcp-server-dev

# View logs during high CPU
./scripts/vault logs -f
```

### Problem: Out of Disk Space

**Check:**

```bash
df -h
podman volume inspect vault | grep Mountpoint
du -sh /path/to/vault
```

**Solution:**

```bash
# 1. Clean up dangling images
./scripts/vault infrastructure prune

# 2. Archive old logs
tar -czf logs-archive-$(date +%Y%m%d).tar.gz logs/
rm -rf logs/*

# 3. If still full, check vault volume
du -sh ~/.obsidian/vault
```

### Problem: Git Sync Failing

**Check logs:**

```bash
./scripts/vault logs vaulty | grep -i "git\|sync"
```

**Common issues:**

- Network connectivity
- Git credentials expired
- Repository corrupted

**Solution:**

```bash
# 1. Check network
ping github.com

# 2. Restart sync service
./scripts/vault restart

# 3. Check git status
podman exec vaulty git -C /vault status

# 4. Manual fix
podman exec vaulty git -C /vault fetch origin
podman exec vaulty git -C /vault pull origin main
```

### Problem: MCP Server Not Responding

**Check:**

```bash
curl http://localhost:4000/
```

**If getting connection refused:**

```bash
# 1. Check if running
podman ps | grep mcp-server-dev

# 2. Check logs
./scripts/vault logs mcp

# 3. Restart
./scripts/vault restart

# 4. Check port
lsof -i :4000
```

---

## Performance Tuning

### Optimize Build Time

```bash
# Build once, reuse images
./scripts/vault build  # ~2 minutes

# Use cached builds
./scripts/vault start  # Uses cache if not changed
```

### Optimize Sync Interval

Edit environment or script:

```bash
# In scripts/services/start.sh or container env
GIT_SYNC_INTERVAL=30  # seconds (adjust as needed)

# Less frequent = lower CPU, more lag
# More frequent = higher CPU, more current
```

### Resource Limits

Current allocation:

- MCP: 533 MB image
- Vault: 81.9 MB image
- Memory: 2048 MB (podman default)

To limit memory:

```bash
podman run -m 1024m <image>
```

---

## Backup & Recovery

### Creating Backups

**Automatic (on startup):**

```bash
# Backups created: vault-backup-prod-TIMESTAMP.tar.gz
./scripts/vault start
```

**Manual backup:**

```bash
tar -czf vault-backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  .vault \
  logs/ \
  --exclude=node_modules
```

**Backup location:** Project root directory

### Restoring from Backup

```bash
# 1. Stop services
./scripts/vault stop

# 2. Extract backup
tar -xzf vault-backup-prod-20251221-120144.tar.gz

# 3. Restart services
./scripts/vault start

# 4. Verify
./scripts/vault status
```

### Full System Recovery

```bash
# 1. Clean everything
./scripts/vault infrastructure clean
echo "y" | podman volume rm vault mcp-data vaulty-data

# 2. Re-initialize
./scripts/vault infrastructure init

# 3. Restore data
tar -xzf vault-backup-prod-20251221-120144.tar.gz

# 4. Start fresh
./scripts/vault start

# 5. Verify
./scripts/vault status
./scripts/vault logs | grep -i error
```

---

## Health Monitoring

### Regular Health Checks

```bash
#!/bin/bash
# Run hourly via cron

echo "=== Vault Platform Health Check ==="
echo "Time: $(date)"
echo

# Check services
./scripts/vault status

# Check endpoints
echo "MCP Endpoint:"
curl -s -o /dev/null -w "HTTP %{http_code} - Response: %{time_total}s\n" http://localhost:4000/

# Check logs for errors
echo "Recent Errors:"
./scripts/vault logs | grep -i error | tail -5 || echo "No errors"

# Check disk usage
echo "Disk Usage:"
df -h | grep -E "Filesystem|/$"
```

### Set Up Monitoring (crontab)

```bash
# Add to crontab -e
0 * * * * /path/to/vault-platform/scripts/health-check.sh >> /var/log/vault-health.log 2>&1
```

### Metrics to Track

| Metric            | Healthy | Warning | Critical |
| ----------------- | ------- | ------- | -------- |
| Service Uptime    | >99%    | >95%    | <95%     |
| API Response Time | <100ms  | <500ms  | >500ms   |
| CPU Usage         | <20%    | <50%    | >50%     |
| Memory Usage      | <30%    | <60%    | >60%     |
| Disk Free         | >50%    | >20%    | <20%     |
| Sync Success Rate | 100%    | >95%    | <95%     |

---

## Emergency Procedures

### Service Crash

```bash
# Immediate action
./scripts/vault restart

# Monitor recovery
./scripts/vault logs -f

# Verify stability
for i in {1..10}; do
  sleep 5
  ./scripts/vault status
done
```

### Complete System Failure

```bash
# 1. Full stop
echo "Stopping services..."
./scripts/vault stop

# 2. Clean state
echo "Cleaning..."
./scripts/vault infrastructure clean

# 3. Re-initialize
echo "Initializing..."
./scripts/vault infrastructure init

# 4. Restore from backup
echo "Restoring..."
tar -xzf vault-backup-prod-*.tar.gz

# 5. Start services
echo "Starting..."
./scripts/vault start

# 6. Verify
echo "Verifying..."
./scripts/vault status
./scripts/vault logs | grep -E "error|failed"
```

### Disk Full Emergency

```bash
# 1. Free up space immediately
./scripts/vault infrastructure prune
rm -rf logs/* 2>/dev/null
rm -f vault-backup-prod-*.tar.gz  # Keep latest only

# 2. Check free space
df -h /

# 3. If still full, expand volume or add storage
# Contact infrastructure team
```

---

## Maintenance Windows

### Recommended Schedule

- **Daily**: Check logs, verify uptime
- **Weekly**: Run full health checks, review metrics
- **Monthly**: Backup verification, update review
- **Quarterly**: Security audit, dependency updates

### Planned Downtime

If maintenance required:

```bash
# 1. Announce downtime
# 2. Backup systems
tar -czf vault-backup-maintenance-$(date +%Y%m%d).tar.gz .vault logs/

# 3. Perform maintenance
# 4. Restart services
./scripts/vault restart

# 5. Verify all systems
./scripts/vault status
./scripts/vault logs | head -50
```

---

## Quick Reference Commands

```bash
# Status & Health
./scripts/vault status                    # Check all services
./scripts/vault logs                      # View all logs
./scripts/vault logs mcp                  # View MCP logs
./scripts/vault logs vaulty               # View Vault logs

# Start/Stop
./scripts/vault start                     # Start services
./scripts/vault stop                      # Stop services
./scripts/vault restart                   # Restart services

# Infrastructure
./scripts/vault infrastructure init       # Initialize
./scripts/vault infrastructure clean      # Clean
./scripts/vault infrastructure prune      # Prune

# Utilities
./scripts/vault utilities sync            # Sync vault data
./scripts/vault utilities verify          # Verify vault

# Build
./scripts/vault build                     # Build images
./scripts/vault rebuild                   # Rebuild (no cache)
```

---

## Support & Documentation

- **Quick Start**: PHASE4_QUICK_START.md
- **Deployment Guide**: PHASE4_DEPLOYMENT_GUIDE.md
- **Production Runbooks**: PRODUCTION_RUNBOOKS.md
- **Troubleshooting**: See section above

---

**Last Updated**: December 21, 2025  
**Next Review**: January 21, 2026
