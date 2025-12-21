# Vault Platform - Operations Guide

**Version**: 1.0  
**Date**: December 21, 2025  
**Audience**: DevOps, Operations Team

---

## Quick Reference

### Daily Operations

```bash
# Morning check
./scripts/vault status

# View recent activity
./scripts/vault logs mcp | tail -50
./scripts/vault logs vaulty | tail -50

# Check disk usage
du -sh .vault logs/

# Verify git sync
cd /vault && git log --oneline | head -3
```

### Emergency Procedures

```bash
# Emergency stop
./scripts/vault stop

# Emergency start
./scripts/vault start

# Emergency logs
./scripts/vault logs -f mcp
```

---

## Starting Services

### Full System Start

```bash
./scripts/vault start
```

**What it does**:

1. Builds images (with cache)
2. Creates pod infrastructure
3. Starts Vault service
4. Starts MCP service
5. Verifies all services running

**Expected output**:

```
✓ Vault service started: vaulty
✓ MCP service started: mcp-server-dev
✓ MCP service verified running
✓ Vault service verified running
✓ All services started successfully
```

### Service-Specific Start

```bash
# View available scripts
ls scripts/services/

# Manually start specific service
bash scripts/services/start.sh
```

---

## Stopping Services

### Graceful Stop

```bash
./scripts/vault stop
```

**What it does**:

1. Stops MCP service
2. Stops Vault service
3. Removes pod infrastructure
4. Verifies all stopped

**Expected output**:

```
✓ Stopped: mcp-server-dev
✓ Stopped: vaulty
✓ All services stopped
```

### Force Stop (if graceful fails)

```bash
podman stop mcp-server-dev vaulty
podman rm mcp-server-dev vaulty
```

---

## Restarting Services

### Full Restart

```bash
./scripts/vault restart
```

**Duration**: ~20-30 seconds

**What it does**:

1. Stops all services
2. Waits for clean shutdown
3. Removes containers
4. Starts fresh services
5. Verifies health

### Restart Individual Service

```bash
# Restart MCP only
podman stop mcp-server-dev
podman rm mcp-server-dev
bash scripts/services/start.sh
```

---

## Viewing Logs

### Real-time MCP Logs

```bash
./scripts/vault logs mcp
# or
./scripts/vault logs mcp -f
```

### Real-time Vault Logs

```bash
./scripts/vault logs vaulty -f
```

### All Logs

```bash
./scripts/vault logs
```

### Filter Logs

```bash
# Errors only
./scripts/vault logs mcp | grep -i error

# Last 50 lines
podman logs mcp-server-dev | tail -50

# Last hour (if timestamps available)
podman logs mcp-server-dev --until 1h
```

### Archive Logs

```bash
# Create daily archive
mkdir -p logs/archive
cp logs/mcp.log logs/archive/mcp-$(date +%Y-%m-%d).log

# Compress old logs
gzip logs/archive/mcp-*.log
```

---

## Common Tasks

### Checking Service Status

```bash
# Full status
./scripts/vault status

# Container details
podman ps
podman inspect mcp-server-dev

# Port status
lsof -i :4000
lsof -i :3333
```

### Monitoring Resource Usage

```bash
# Live monitoring
podman stats --no-stream

# Memory usage
podman stats --no-stream | awk '{print $1, $4}'

# Disk usage
du -sh .vault logs/ .vault/
```

### Syncing Vault Data

```bash
# Sync from volume to local
./scripts/vault utilities sync

# Verify vault integrity
./scripts/vault utilities verify

# Force git pull
cd /vault && git pull origin main
```

### Building Images

```bash
# Build with cache (fast)
./scripts/vault build

# Rebuild without cache (slower but fresh)
./scripts/vault rebuild
```

### Cleaning Up

```bash
# Remove stopped containers
./scripts/vault infrastructure prune

# Remove old images
podman image prune

# Full cleanup (with volume removal)
echo "y" | ./scripts/vault infrastructure clean
```

---

## Monitoring & Alerts

### Critical Metrics

1. **Service Availability**: All services running
2. **Response Time**: < 100ms
3. **Memory Usage**: < 2GB
4. **CPU Usage**: < 50%
5. **Disk Space**: > 1GB free
6. **Git Sync**: < 1 hour behind

### Health Check Script

```bash
#!/bin/bash
# Save as scripts/health-check.sh

echo "=== Health Check ==="
echo "Services: $(./scripts/vault status | grep -c '✓')/3"
echo "Memory: $(podman stats --no-stream | tail -1 | awk '{print $4}')"
echo "Disk: $(df -h . | tail -1 | awk '{print $5}')"
echo "Git: $(cd /vault && git log --oneline -1)"
```

### Running Health Checks Regularly

```bash
# Hourly via cron
0 * * * * cd /path/to/vault && ./scripts/vault status >> logs/health.log 2>&1

# Every 5 minutes
*/5 * * * * cd /path/to/vault && podman stats --no-stream >> logs/metrics.log 2>&1
```

---

## Troubleshooting

### Service Won't Start

```bash
# 1. Check logs
./scripts/vault logs mcp

# 2. Check ports
lsof -i :4000

# 3. Check disk space
df -h

# 4. Force clean start
./scripts/vault stop
./scripts/vault infrastructure clean
./scripts/vault start
```

### High Memory Usage

```bash
# Check what's using memory
podman stats

# Restart the service
./scripts/vault restart

# If persists, check logs for memory leaks
./scripts/vault logs mcp | grep -i "memory\|outofmemory"
```

### Git Sync Errors

```bash
# Check git status
cd /vault
git status

# Show errors
git pull -v

# Force sync
git fetch origin
git reset --hard origin/main
```

### Network Issues

```bash
# Check container network
podman network ls
podman network inspect vault-network

# Test connectivity
podman exec mcp-server-dev ping -c 1 vaulty

# Check ports
netstat -an | grep -E "4000|3333"
```

---

## Backup & Recovery

### Automated Backup

```bash
# Daily backup
0 2 * * * tar -czf /backups/vault-$(date +%Y%m%d).tar.gz /path/to/.vault

# Weekly full backup
0 3 * * 0 tar -czf /backups/vault-full-$(date +%Y%m%d).tar.gz /path/to/
```

### Manual Backup

```bash
tar -czf vault-backup-$(date +%Y%m%d-%H%M%S).tar.gz .vault logs/

# Verify backup
tar -tzf vault-backup-*.tar.gz | head -10
```

### Recovery

```bash
# Stop services
./scripts/vault stop

# Restore backup
tar -xzf vault-backup-YYYYMMDD-HHMMSS.tar.gz

# Restart services
./scripts/vault start

# Verify
./scripts/vault status
```

---

## Performance Tuning

### Container Resource Limits

```bash
# Check current limits
podman inspect mcp-server-dev | grep -A 10 Resources

# Set memory limit (edit docker-compose or scripts)
# 512M for MCP
# 256M for Vault
# 128M for LLM Adapter
```

### Git Sync Optimization

```bash
# Adjust sync interval in environment
export GIT_SYNC_INTERVAL=60  # seconds

# Shallow clone for faster pulls
export GIT_SHALLOW=true
```

### Image Optimization

```bash
# Remove unused images
podman image prune

# List image sizes
podman images --format "{{.Repository}}:{{.Tag}}\t{{.Size}}"
```

---

## Documentation

- **Deployment Guide**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Scripts Reference**: [SCRIPTS_REFERENCE.md](SCRIPTS_REFERENCE.md)
- **Architecture**: [Architecture docs](ARCHITECTURE_REVIEW.md)

---

**Last Updated**: December 21, 2025  
**Phase**: 4 of 4 - Complete ✅
