# Production Deployment Runbooks

## Phase 4 Objective 5: Production Deployment Procedures

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Standard Deployment Procedure](#standard-deployment-procedure)
3. [Emergency Rollback Procedure](#emergency-rollback-procedure)
4. [Troubleshooting Guide](#troubleshooting-guide)
5. [Health Checks and Monitoring](#health-checks-and-monitoring)
6. [Post-Deployment Validation](#post-deployment-validation)

---

## Pre-Deployment Checklist

### 48 Hours Before Deployment

- [ ] **Schedule Communication**
  - Notify all stakeholders of deployment window
  - Document maintenance window (typically 2 hours)
  - Post announcement in status page

- [ ] **Code Freeze**
  - Ensure no new commits to production branch
  - Verify all code has been reviewed and merged to main
  - Tag release version (e.g., v1.2.0)

- [ ] **Testing Verification**
  - Run full test suite: `npm run test:all`
  - Verify E2E tests pass: `npm run test:e2e`
  - Check integration tests: `__tests__/scripts/services-runtime.test.sh`

- [ ] **Backup & Snapshots**
  - Create full database backup
  - Snapshot current VM/container state
  - Verify backup integrity: `tar -tzf backup.tar.gz | head -20`

### 24 Hours Before Deployment

- [ ] **Environment Preparation**
  - Verify production.env configuration
  - Check all secrets are loaded in vault
  - Validate SSL certificates validity
  - Confirm DNS records point to correct endpoints

- [ ] **Infrastructure Checks**
  - Verify disk space: `df -h`
  - Check memory availability: `free -h`
  - Confirm network connectivity to all dependencies
  - Verify container registry access

- [ ] **Deployment Script Validation**
  ```bash
  # Run validation without actual deployment
  ./scripts/deployment/validate-production.sh
  ```

### 2 Hours Before Deployment

- [ ] **Final Checks**
  - Verify all team members are available for deployment
  - Confirm rollback procedures are understood
  - Double-check deployment strategy selection
  - Review recent logs for any anomalies

- [ ] **Health Baseline**
  - Document current system metrics
  - Record baseline response times
  - Note current user sessions/connections
  - Capture current error rates

- [ ] **Communication Setup**
  - Establish communication channel (Slack, Teams, etc.)
  - Ensure monitoring alerts are configured
  - Start deployment log streaming

---

## Standard Deployment Procedure

### Step 1: Pre-Deployment Validation

```bash
# Navigate to project root
cd /path/to/vault-platform-full

# Validate production environment
./scripts/deployment/validate-production.sh

# Expected output:
# ✅ All validations passed - Ready for deployment
```

**If validation fails:**

- Review error messages carefully
- Fix identified issues
- Re-run validation
- Do NOT proceed if validation fails

---

### Step 2: Create Pre-Deployment Backup

```bash
# Manual backup
BACKUP_DIR="./backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r ./vault-data "$BACKUP_DIR/"
cp ./config/production.env "$BACKUP_DIR/"

# Verify backup
ls -lah "$BACKUP_DIR/"
```

**Verification:**

- Check backup size is reasonable
- Verify all critical files are included
- Test backup integrity (optional but recommended)

---

### Step 3: Execute Deployment

#### For Rolling Deployment (Recommended)

```bash
# Execute rolling deployment
./scripts/deployment/deploy-production.sh

# Expected timeline:
# - 5 min: MCP deployment and health checks
# - 5 min: Vaulty deployment and health checks
# - 5 min: Smoke tests
# Total: ~15-20 minutes
```

#### For Blue-Green Deployment (Zero-Downtime)

```bash
# Edit config/production.env
export DEPLOYMENT_STRATEGY="blue-green"

# Execute deployment
./scripts/deployment/deploy-production.sh

# Expected timeline:
# - 10 min: Deploy both services to green environment
# - 5 min: Health verification
# - 2 min: Traffic switch
# Total: ~17-20 minutes
```

---

### Step 4: Monitor Deployment

```bash
# Monitor in real-time
watch -n 5 'podman ps | grep -E "mcp|vaulty"'

# Or use separate terminal
podman logs -f mcp-container
podman logs -f vaulty-container
```

**Success Indicators:**

- Both containers running
- No error messages in logs
- Health endpoints responding
- Response times normal

---

### Step 5: Post-Deployment Validation

```bash
# Verify all services are healthy
./scripts/services/verify.sh

# Run health checks
curl http://localhost:4000/health  # MCP
curl http://localhost:3333/health  # Vaulty

# Check response format
curl -s http://localhost:4000/health | jq .
```

**Expected Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:45Z",
  "version": "1.2.0",
  "services": {
    "mcp": "healthy",
    "vaulty": "healthy"
  }
}
```

---

### Step 6: Smoke Tests

```bash
# Run automated smoke tests
npm run test:smoke

# Or manual tests
curl -X GET http://localhost:3333/api/health
curl -X GET http://localhost:4000/api/v1/status

# Check basic functionality
curl -X POST http://localhost:3333/api/vault/create \
  -H "Content-Type: application/json" \
  -d '{"name": "test-vault"}'
```

**Success Criteria:**

- All HTTP endpoints respond with 2xx status
- No 5xx errors in logs
- Response times within normal range
- Data is persisted and retrievable

---

## Emergency Rollback Procedure

### When to Rollback

Rollback immediately if any of the following occur:

- [ ] Services fail to start after 5 minutes
- [ ] Health checks continuously fail
- [ ] Critical functionality is broken
- [ ] Database becomes corrupted
- [ ] Performance degrades >50% from baseline
- [ ] Data loss is detected

### Step 1: Announce Rollback

```bash
# Notify all stakeholders immediately
# Use: Slack, PagerDuty, Status Page, Email
# Message: "Production deployment rollback in progress due to [reason]"
```

---

### Step 2: Execute Rollback

#### Automatic Rollback (Fastest)

```bash
# Stop new containers
podman stop mcp-prod
podman stop vaulty-prod

# Automatic rollback to previous version
./scripts/deployment/rollback-production.sh auto

# Expected time: 3-5 minutes
```

#### Interactive Rollback (Manual Control)

```bash
# Start interactive rollback
./scripts/deployment/rollback-production.sh interactive

# Select:
# 1 = MCP only
# 2 = Vaulty only
# 3 = Both (recommended)
# 4 = Cancel
```

---

### Step 3: Verify Rollback

```bash
# Check container status
podman ps | grep -E "mcp|vaulty"

# Verify health
curl http://localhost:4000/health
curl http://localhost:3333/health

# Monitor logs
podman logs -f mcp-prod --tail 50
podman logs -f vaulty-prod --tail 50
```

**Success Indicators:**

- Containers running
- Health endpoints responding
- No errors in logs
- Performance baseline restored

---

### Step 4: Restore from Backup (If Needed)

```bash
# If data was corrupted, restore from backup
LATEST_BACKUP=$(ls -t backups/ | head -1)

# Stop services
./scripts/services/stop.sh

# Restore data
rm -rf vault-data/
cp -r "backups/$LATEST_BACKUP/vault-data" ./

# Restart services
./scripts/services/start.sh

# Verify
./scripts/services/verify.sh
```

---

### Step 5: Post-Rollback Analysis

```bash
# Document the issue
cat > incident-report-$(date +%Y%m%d).txt << 'EOF'
# Incident Report

## Timeline
- 10:30 UTC: Deployment started
- 10:45 UTC: Service failed
- 10:47 UTC: Rollback initiated
- 10:50 UTC: Rollback complete

## Root Cause
[Document the issue]

## Resolution Steps
[Document how it was fixed]

## Prevention
[How to prevent in future]
EOF

# Share incident report with team
# Schedule postmortem meeting
```

---

## Troubleshooting Guide

### Issue: Deployment Timeout

**Symptoms:**

- Deployment hangs at a specific step
- Services not starting within expected time
- Health checks timing out

**Resolution:**

```bash
# Check if ports are already in use
lsof -i :4000  # MCP
lsof -i :3333  # Vaulty

# Kill conflicting processes
kill -9 <PID>

# Clean up old containers
podman rm -f mcp-container
podman rm -f vaulty-container

# Retry deployment
./scripts/deployment/deploy-production.sh
```

---

### Issue: Health Check Failures

**Symptoms:**

```
❌ Service health check failed after 30 attempts
```

**Resolution:**

```bash
# Check container logs
podman logs mcp-prod | tail -100
podman logs vaulty-prod | tail -100

# Look for common errors:
# - Port binding errors
# - Missing environment variables
# - Database connection errors
# - Configuration issues

# Re-check environment
cat config/production.env | grep -v "^#"

# Verify port availability
netstat -tlnp | grep -E ":4000|:3333"

# Verify Docker image
podman images | grep -E "mcp|vaulty"
```

---

### Issue: High Memory Usage

**Symptoms:**

- Container killed due to memory limit
- `OOMKilled` in container status
- Sluggish performance

**Resolution:**

```bash
# Check current memory usage
podman stats --no-stream mcp-prod vaulty-prod

# If memory limit is exceeded:
# 1. Scale down workload temporarily
# 2. Update memory limits in production.env
# 3. Restart containers

# Edit production.env
export VAULTY_MEMORY_LIMIT="8Gi"  # Increase from 4Gi

# Restart with new limits
./scripts/deployment/deploy-production.sh
```

---

### Issue: Database Connection Errors

**Symptoms:**

```
ERROR: Connection refused
ERROR: timeout connecting to database
```

**Resolution:**

```bash
# Check database connectivity
telnet <db-host> <db-port>

# Verify database credentials
echo $DATABASE_URL
echo $DATABASE_USER

# Check network connectivity
ping <db-host>
curl -v <db-host>:<db-port>

# Review database logs
journalctl -u postgresql -n 50

# If database is down:
# 1. Contact DBA or database team
# 2. Check backup restore procedure
# 3. Initiate data recovery
```

---

### Issue: Configuration Mismatch

**Symptoms:**

```
ERROR: Undefined environment variable
ERROR: Invalid configuration
```

**Resolution:**

```bash
# Verify all required variables are set
./scripts/deployment/validate-production.sh

# Check environment file
cat config/production.env

# Verify all secrets are available
podman run -e VAULT_ADDR=https://vault.example.com \
  ghcr.io/my-org/mcp:latest \
  /app/scripts/verify-secrets.sh

# Reload configuration
source config/production.env

# Retry deployment
./scripts/deployment/deploy-production.sh
```

---

## Health Checks and Monitoring

### Continuous Monitoring

```bash
# Monitor key metrics
watch -n 10 'podman stats --no-stream mcp-prod vaulty-prod'

# Monitor logs in real-time
podman logs -f mcp-prod &
podman logs -f vaulty-prod &

# Check for errors
podman logs mcp-prod | grep -i error
podman logs vaulty-prod | grep -i error
```

---

### Performance Baseline

```bash
# Establish baseline metrics
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3333/api/health

# Expected response times:
# - Health check: <100ms
# - API requests: <500ms
# - Database queries: <1000ms
```

---

### Alert Thresholds

| Metric        | Threshold | Action                   |
| ------------- | --------- | ------------------------ |
| CPU Usage     | >80%      | Scale up, investigate    |
| Memory Usage  | >90%      | Increase limits, restart |
| Error Rate    | >1%       | Check logs, investigate  |
| Response Time | >1s       | Profile, optimize        |
| Disk Space    | <10% free | Add storage, cleanup     |

---

## Post-Deployment Validation

### 30 Minutes After Deployment

- [ ] All services running
- [ ] Health checks passing
- [ ] No errors in logs
- [ ] Response times normal
- [ ] Database accessible
- [ ] File uploads working
- [ ] API endpoints responding
- [ ] Websocket connections stable

### 2 Hours After Deployment

- [ ] No memory leaks detected
- [ ] CPU usage normal
- [ ] Error rates <0.1%
- [ ] All scheduled jobs running
- [ ] Monitoring alerts functioning
- [ ] User reports: no issues

### 24 Hours After Deployment

- [ ] System stable under normal load
- [ ] No data integrity issues
- [ ] Backups successful
- [ ] Monitoring reports normal
- [ ] User feedback: positive
- [ ] Performance metrics: acceptable

---

## Deployment Success Criteria

✅ **Deployment is successful when:**

1. All containers are running
2. Health endpoints responding with 2xx
3. Database connectivity verified
4. Smoke tests passing
5. No critical errors in logs
6. Response times within baseline
7. Memory/CPU usage normal
8. User functionality working
9. Backups completed
10. Monitoring active

---

## Quick Reference Commands

```bash
# Check deployment status
podman ps | grep -E "mcp|vaulty"

# View logs
podman logs -f mcp-prod
podman logs -f vaulty-prod

# Restart services
podman restart mcp-prod
podman restart vaulty-prod

# Execute backup
cp -r vault-data ./backups/vault-data-$(date +%s)

# Check disk space
df -h

# Monitor resources
podman stats --no-stream

# View deployment history
cat logs/deployment-history.json | jq .

# Rollback to previous version
./scripts/deployment/rollback-production.sh auto
```

---

## Contact & Escalation

| Role             | Contact            | Availability   |
| ---------------- | ------------------ | -------------- |
| DevOps Engineer  | devops@company.com | 24/7           |
| Database Admin   | dba@company.com    | 24/7           |
| Lead Developer   | lead@company.com   | Business hours |
| On-Call Engineer | Check PagerDuty    | 24/7           |

---

**Last Updated:** 2024-01-20  
**Version:** 1.0  
**Author:** Platform Engineering Team
