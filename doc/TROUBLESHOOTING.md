# Vault Platform - Troubleshooting Guide

**Version**: 1.0  
**Date**: December 21, 2025  
**Quick Reference**: [Jump to symptoms](#symptoms)

---

## Quick Diagnostics

Run this first to identify issues:

```bash
#!/bin/bash
echo "=== Vault Platform Diagnostics ==="
echo
echo "1. Service Status:"
./scripts/vault status
echo
echo "2. Container Health:"
podman ps --format "{{.Names}}\t{{.Status}}"
echo
echo "3. Disk Usage:"
df -h | grep -E "Filesystem|vault|/"
echo
echo "4. Memory Usage:"
podman stats --no-stream 2>/dev/null | head -5
echo
echo "5. Recent Errors:"
podman logs mcp-server-dev 2>&1 | grep -i error | tail -3
podman logs vaulty 2>&1 | grep -i error | tail -3
```

---

## Symptoms

### Services Not Running

**Symptom**: `./scripts/vault status` shows services stopped

**Diagnostic**:

```bash
podman ps -a | grep vault
```

**Solutions**:

**Option 1: Simple Restart**

```bash
./scripts/vault start
./scripts/vault status
```

**Option 2: Clean Restart**

```bash
./scripts/vault stop
sleep 5
./scripts/vault start
```

**Option 3: Full Reset**

```bash
./scripts/vault stop
echo "n" | ./scripts/vault infrastructure clean
./scripts/vault infrastructure init
./scripts/vault start
```

---

### Port Already in Use

**Symptom**: Error: "Address already in use", port 4000 conflict

**Diagnostic**:

```bash
lsof -i :4000
netstat -an | grep 4000
```

**Solutions**:

**Option 1: Kill Process Using Port**

```bash
# Find PID
PID=$(lsof -i :4000 -t)

# Kill it
kill -9 $PID

# Restart
./scripts/vault restart
```

**Option 2: Use Different Port**

```bash
export PORT=4001
./scripts/vault start
```

**Option 3: Clean Docker State**

```bash
podman stop mcp-server-dev
podman rm mcp-server-dev
./scripts/vault start
```

---

### High Memory Usage

**Symptom**: Services consuming > 2GB RAM

**Diagnostic**:

```bash
podman stats --no-stream

# Check specific container
podman top mcp-server-dev

# Check for memory leaks in logs
./scripts/vault logs mcp | grep -i "memory\|heap"
```

**Solutions**:

**Option 1: Restart Services**

```bash
./scripts/vault restart
```

**Option 2: Check for Memory Leaks**

```bash
# Monitor memory growth
watch -n 5 'podman stats --no-stream | head -3'

# If growing, check application logs
./scripts/vault logs mcp | tail -50
```

**Option 3: Increase Container Limits**
Edit `scripts/services/start.sh` and add:

```bash
--memory=1g
--memswap=2g
```

---

### Disk Space Issues

**Symptom**: "No space left on device" errors

**Diagnostic**:

```bash
df -h
du -sh .vault logs/
```

**Solutions**:

**Option 1: Clean Docker Resources**

```bash
./scripts/vault infrastructure prune
podman image prune -a
```

**Option 2: Archive Old Logs**

```bash
mkdir -p logs/archive
gzip logs/mcp.log
mv logs/mcp.log.gz logs/archive/
```

**Option 3: Clear Old Data**

```bash
# Remove old backups
rm vault-backup-*.tar.gz

# Clean partial builds
podman image prune
```

---

### Git Sync Errors

**Symptom**: "Failed to pull from origin" or git-related errors

**Diagnostic**:

```bash
cd /vault
git status
git remote -v

# Check credentials
git credential fill < <(echo "host=github.com")
```

**Solutions**:

**Option 1: Force Sync**

```bash
cd /vault
git fetch origin
git reset --hard origin/main
```

**Option 2: Check Credentials**

```bash
# Configure git
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# Test authentication
ssh -T git@github.com
```

**Option 3: Manual Pull**

```bash
cd /vault
git pull origin main --verbose
```

---

### Slow Response Times

**Symptom**: Services responding slowly (> 500ms)

**Diagnostic**:

```bash
# Measure response time
time curl http://localhost:4000/

# Check container performance
podman stats --no-stream

# Check system load
top -l 1 | grep "Load"
```

**Solutions**:

**Option 1: Restart Services**

```bash
./scripts/vault restart
```

**Option 2: Check Resource Availability**

```bash
# Memory
podman stats --no-stream | awk '{print $NF}'

# CPU
podman stats --no-stream | awk '{print $6}'
```

**Option 3: Optimize Container**

```bash
# Reduce log verbosity
export LOG_LEVEL=warn

# Increase container resources
podman update --memory=2g mcp-server-dev
```

---

### Build Failures

**Symptom**: `./scripts/vault build` fails with errors

**Diagnostic**:

```bash
./scripts/vault build 2>&1 | tail -50

# Check available disk space
df -h

# Check network connectivity
curl -I https://hub.docker.com
```

**Solutions**:

**Option 1: Clean Build**

```bash
# Remove images
podman image rm -a vault

# Build fresh
./scripts/vault rebuild
```

**Option 2: No Cache Build**

```bash
./scripts/vault rebuild
```

**Option 3: Fix Network Issues**

```bash
# Check DNS
nslookup hub.docker.com

# Try again with verbose output
podman build --verbose .
```

---

### Logging Issues

**Symptom**: Logs not appearing or truncated

**Diagnostic**:

```bash
./scripts/vault logs mcp
./scripts/vault logs vaulty

# Check log file permissions
ls -la logs/
```

**Solutions**:

**Option 1: Restart Logging**

```bash
./scripts/vault stop
sleep 2
./scripts/vault start
```

**Option 2: Check Log Permissions**

```bash
chmod 755 logs/
chmod 644 logs/*.log
```

**Option 3: View Container Logs Directly**

```bash
podman logs mcp-server-dev
podman logs vaulty
```

---

## Advanced Troubleshooting

### Enable Debug Mode

```bash
export LOG_LEVEL=debug
./scripts/vault start 2>&1 | tee debug.log
```

### Inspect Container Configuration

```bash
podman inspect mcp-server-dev | jq '.[] | .Config, .HostConfig'
```

### Network Debugging

```bash
# Check network connectivity
podman exec mcp-server-dev ping -c 1 vaulty

# DNS resolution
podman exec mcp-server-dev nslookup github.com

# Port forwarding
podman port mcp-server-dev
```

### Database Issues

```bash
# Check database status
podman exec vaulty ls -la /vault

# Verify database
podman exec vaulty du -sh /vault
```

### Performance Profiling

```bash
# CPU profiling
time ./scripts/vault status

# Memory profiling
podman stats --no-stream mcp-server-dev

# Disk I/O
iostat -x 1 10
```

---

## Common Error Messages

### Error: "Address already in use"

**Cause**: Port 4000 or 3333 already in use

**Fix**: See [Port Already in Use](#port-already-in-use)

### Error: "No such container"

**Cause**: Container doesn't exist or was removed

**Fix**:

```bash
./scripts/vault start
```

### Error: "Out of memory"

**Cause**: Container memory limit exceeded

**Fix**: See [High Memory Usage](#high-memory-usage)

### Error: "Cannot pull image"

**Cause**: Network issue or image doesn't exist

**Fix**:

```bash
podman pull node:22-alpine  # Pre-pull image
./scripts/vault build        # Try build again
```

### Error: "Permission denied"

**Cause**: File permission issue

**Fix**:

```bash
chmod +x scripts/vault
chmod +x scripts/**/*.sh
```

---

## Escalation Procedures

### Level 1: Self-Service

1. Check [Quick Diagnostics](#quick-diagnostics)
2. Review [Symptoms](#symptoms) section
3. Try recommended solutions

### Level 2: Container Reset

```bash
./scripts/vault stop
podman system prune -a
./scripts/vault start
```

### Level 3: Full Reset

```bash
./scripts/vault stop
echo "y" | ./scripts/vault infrastructure clean
./scripts/vault infrastructure init
./scripts/vault build
./scripts/vault start
```

### Level 4: Rollback

```bash
# Stop services
./scripts/vault stop

# Restore from backup
tar -xzf vault-backup-YYYYMMDD-HHMMSS.tar.gz

# Restart
./scripts/vault start
```

### Level 5: Escalate to Engineering

Contact: [engineering-team@example.com]

Provide:

- Output from quick diagnostics
- Error logs (`./scripts/vault logs mcp`)
- Steps taken to resolve
- System info (`uname -a`, `podman --version`)

---

## Prevention

### Daily Checks

```bash
# Add to cron (daily at 9 AM)
0 9 * * * /path/to/vault-platform-full/scripts/vault status >> /tmp/vault-check.log 2>&1

# Weekly cleanup (Sunday at midnight)
0 0 * * 0 /path/to/vault-platform-full/scripts/vault infrastructure prune
```

### Monitoring Setup

```bash
# Enable logging
export LOG_LEVEL=info

# Regular backups
0 2 * * * tar -czf /backups/vault-$(date +\%Y\%m\%d).tar.gz /path/to/.vault

# Disk monitoring
0 */4 * * * df -h | mail -s "Disk Usage" admin@example.com
```

### Health Checks

```bash
# Hourly health check
0 * * * * /path/to/vault-platform-full/doc/health-check.sh >> /tmp/health.log 2>&1
```

---

## Support Resources

- **Documentation**: See [doc/](../doc/)
- **Scripts Reference**: [SCRIPTS_REFERENCE.md](SCRIPTS_REFERENCE.md)
- **Operations Guide**: [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md)
- **GitHub Issues**: [stranbury/vault-platform-full](https://github.com/stranbury/vault-platform-full/issues)

---

**Last Updated**: December 21, 2025  
**Phase**: 4 of 4 - Complete ✅
