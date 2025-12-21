# Vault Platform - Production Deployment Guide

**Version**: 1.0  
**Date**: December 21, 2025  
**Status**: Production Ready ✅

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Deployment Steps](#deployment-steps)
4. [Verification](#verification)
5. [Monitoring](#monitoring)
6. [Troubleshooting](#troubleshooting)
7. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

### System Requirements

- **OS**: Linux, macOS with Podman/Docker
- **Memory**: 4GB minimum, 8GB recommended
- **Disk**: 10GB free space
- **Network**: Internet access for package downloads

### Required Software

```bash
# Check installations
podman --version     # v4.0+
git --version        # v2.30+
bash --version       # v5.0+
python3 --version    # v3.8+
```

### Network Access

- Port 4000: MCP Server (HTTP)
- Port 3333: Vault Service (HTTP)
- Port 22: SSH (for git operations)

---

## Pre-Deployment Checklist

Run before deployment:

```bash
# 1. Verify infrastructure
./scripts/vault infrastructure init

# 2. Check git configuration
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# 3. Verify environment variables
echo $VAULT_PATH
echo $LOCAL_VAULT_PATH

# 4. Backup current state
tar -czf vault-backup-$(date +%Y%m%d-%H%M%S).tar.gz .vault logs/

# 5. Verify all images build successfully
./scripts/vault build
```

**Verification Output Example**:

```
✓ Volumes configured (vault, mcp-data, vaulty-data)
✓ Networks created (vault-network)
✓ Directories ready (.vault, logs)
✓ Git configured
✓ All images built successfully
```

---

## Deployment Steps

### Step 1: Clean Environment

```bash
cd /path/to/vault-platform-full

# Stop existing services
./scripts/vault stop

# Optional: Remove old containers
echo "n" | ./scripts/vault infrastructure clean
```

### Step 2: Initialize Infrastructure

```bash
# Create volumes and networks
./scripts/vault infrastructure init

# Expected output:
# ✓ Volume created: vault
# ✓ Volume created: mcp-data
# ✓ Volume created: vaulty-data
# ✓ Network created: vault-network
```

### Step 3: Build Images

```bash
# Build all container images
./scripts/vault build

# Verify images
podman images | grep vault
```

**Expected images**:

- `localhost/vault-mcp:latest` (533 MB)
- `localhost/vault-vaulty:latest` (81.9 MB)
- `localhost/vault-llm-adapter:latest` (128 MB)

### Step 4: Start Services

```bash
# Start all services
./scripts/vault start

# Output should show:
# ✓ MCP service started
# ✓ Vault service started
# ✓ All services verified running
```

### Step 5: Verify Deployment

```bash
# Check status
./scripts/vault status

# Expected:
# ✓ mcp is running
# ✓ vaulty is running
# ✓ vault is running
```

---

## Verification

### Health Check

```bash
# 1. Check container health
podman ps --format "{{.Names}}\t{{.Status}}" | grep vault

# Expected: (healthy) or (Up X minutes)

# 2. Verify endpoints
curl http://localhost:4000/
curl http://localhost:3333/ (if applicable)

# Expected: HTTP 200 response

# 3. Check logs
./scripts/vault logs mcp
./scripts/vault logs vaulty
```

### Performance Verification

```bash
# Response time check (should be < 100ms)
time curl -s http://localhost:4000/ > /dev/null

# Container resource usage
podman stats --no-stream

# Expected: Normal CPU/Memory usage
```

---

## Monitoring

### Continuous Monitoring (First 30 minutes)

Monitor these metrics continuously:

```bash
# Terminal 1: Watch status
watch -n 5 './scripts/vault status'

# Terminal 2: Monitor logs
./scripts/vault logs -f mcp

# Terminal 3: Monitor resources
podman stats
```

### Success Criteria

- ✅ All services running for 30+ minutes without restart
- ✅ No error messages in logs
- ✅ CPU usage < 50%
- ✅ Memory usage < 2GB
- ✅ Endpoints responding with < 100ms latency

### Daily Monitoring

```bash
# Check services daily
./scripts/vault status

# Rotate logs weekly
./scripts/vault logs > logs/archive/$(date +%Y-%m-%d).log

# Monitor disk usage
df -h | grep vault

# Verify git sync
git log --oneline | head -5
```

---

## Troubleshooting

### Services Not Starting

**Symptom**: One or more services fail to start

```bash
# Check logs
./scripts/vault logs mcp
./scripts/vault logs vaulty

# Common causes:
# - Port already in use: lsof -i :4000
# - Insufficient disk space: df -h
# - Permission denied: sudo chown -R $USER .vault

# Solution
./scripts/vault stop
./scripts/vault start
```

### High Memory Usage

**Symptom**: Container using > 2GB memory

```bash
# Check memory
podman stats

# Check for stuck processes
podman top vaulty

# Restart the affected service
./scripts/vault restart
```

### Network Issues

**Symptom**: Services can't communicate

```bash
# Check network
podman network ls
podman network inspect vault-network

# Verify connectivity
podman exec mcp-server-dev ping vaulty
```

### Git Sync Failing

**Symptom**: Git sync errors in logs

```bash
# Check git status
cd /vault
git status

# Verify credentials
git credential fill < <(echo "host=github.com")

# Manual sync
git pull origin main
```

---

## Rollback Procedures

### Quick Rollback (< 5 minutes)

```bash
# 1. Stop services
./scripts/vault stop

# 2. Restore from backup
tar -xzf vault-backup-YYYYMMDD-HHMMSS.tar.gz

# 3. Restart services
./scripts/vault start

# 4. Verify
./scripts/vault status
```

### Full Rollback (to previous version)

```bash
# 1. Stop services
./scripts/vault stop

# 2. Checkout previous git commit
git log --oneline | head -10
git checkout <PREVIOUS-COMMIT-SHA>

# 3. Rebuild images
./scripts/vault rebuild

# 4. Restart
./scripts/vault start

# 5. Restore data if needed
tar -xzf vault-backup-YYYYMMDD-HHMMSS.tar.gz
```

---

## Support & Contact

**For Issues**:

- Check logs: `./scripts/vault logs -f`
- Review troubleshooting section above
- Check GitHub issues: [stranbury/vault-platform-full](https://github.com/stranbury/vault-platform-full/issues)

**Production Contacts**:

- On-call: [Your team contact]
- Escalation: [Manager contact]
- Emergency: [Emergency contact]

---

## Appendix: Common Commands

```bash
# View status
./scripts/vault status

# View logs
./scripts/vault logs [service]

# Stop services
./scripts/vault stop

# Start services
./scripts/vault start

# Restart services
./scripts/vault restart

# Rebuild images
./scripts/vault rebuild

# Clean up
./scripts/vault infrastructure clean

# Prune resources
./scripts/vault infrastructure prune
```

---

**Last Updated**: December 21, 2025  
**Phase**: 4 of 4 - Complete ✅
