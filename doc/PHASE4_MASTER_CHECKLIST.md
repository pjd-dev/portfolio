# Phase 4 Master Checklist

**Date:** December 18, 2025  
**Phase:** 4 of 4 - Final Integration & Polish  
**Status:** Ready to Execute

---

## OBJECTIVE 1: Script Migration (Target: 2-3 hours)

### Task 1.1: Analyze Legacy Scripts

- [ ] Catalog all legacy scripts in `./script/`
- [ ] Catalog all podman scripts in `./podman/`
- [ ] Catalog app-specific scripts
- [ ] Identify logic to migrate
- [ ] Identify logic to deprecate
- [ ] Document findings in analysis file
- [ ] Identify dependencies between scripts

**Documentation:**

- [ ] Create `doc/LEGACY_SCRIPTS_ANALYSIS.md`

### Task 1.2: Migrate Service Scripts

- [ ] Extract start logic from `podman/run-mcp.sh`
- [ ] Extract start logic from `podman/run-vault.sh`
- [ ] Extract stop logic from cleanup procedures
- [ ] Update `scripts/services/start.sh`
  - [ ] MCP startup added
  - [ ] Vault startup added
  - [ ] Port checks implemented
  - [ ] Health verification added
  - [ ] Logging added
- [ ] Update `scripts/services/stop.sh`
  - [ ] Service stop logic added
  - [ ] Cleanup procedures added
  - [ ] Graceful shutdown logic added
- [ ] Update `scripts/services/restart.sh`
  - [ ] Clean restart cycle implemented
  - [ ] Service dependencies handled
- [ ] Test service scripts locally

**Testing:**

- [ ] `./scripts/vault start` works
- [ ] `./scripts/vault stop` works
- [ ] `./scripts/vault restart` works
- [ ] Services respond correctly
- [ ] Logs show proper output

### Task 1.3: Migrate Infrastructure Scripts

- [ ] Extract logic from `script/init-volume.sh`
- [ ] Update `scripts/infrastructure/init.sh`
  - [ ] Volume creation logic added
  - [ ] Network creation logic added
  - [ ] Directory setup logic added
  - [ ] Permission setup logic added
- [ ] Extract logic from cleanup operations
- [ ] Update `scripts/infrastructure/clean.sh`
  - [ ] Container removal logic added
  - [ ] Volume cleanup logic added
  - [ ] Confirmation handling added
- [ ] Review `scripts/infrastructure/prune.sh`
  - [ ] Verify prune logic complete
  - [ ] Add resource reporting
- [ ] Test infrastructure scripts

**Testing:**

- [ ] `./scripts/vault init` creates volumes
- [ ] `./scripts/vault init` creates networks
- [ ] `./scripts/vault clean` removes containers
- [ ] `./scripts/vault prune` cleans resources

### Task 1.4: Migrate Utility Scripts

- [ ] Extract logic from `script/sync-volume-to-local.sh`
- [ ] Update `scripts/utilities/sync-vault.sh`
  - [ ] Rsync logic implemented
  - [ ] Backup created before sync
  - [ ] Verification added
  - [ ] Statistics reported
- [ ] Extract logic from `script/verify-shared-vault.sh`
- [ ] Update `scripts/utilities/verify-vault.sh`
  - [ ] Structure validation added
  - [ ] File counting added
  - [ ] Large file detection added
  - [ ] Issue reporting added
- [ ] Extract tunnel logic from `script/cloudflared.tunnel.sh`
- [ ] Update `scripts/utilities/tunnel.sh`
  - [ ] Cloudflared startup logic added
  - [ ] URL reporting added
  - [ ] Error handling added
- [ ] Test utility scripts

**Testing:**

- [ ] `./scripts/vault sync-vault` works
- [ ] `./scripts/vault verify-vault` works
- [ ] `./scripts/vault tunnel` works (if available)

### Task 1.5: Deprecate Old Scripts

- [ ] Create `legacy/` directory structure
- [ ] Move `./script/` to `legacy/script/`
- [ ] Move `./podman/` scripts to `legacy/podman/`
- [ ] Move app restart scripts to `legacy/apps/`
- [ ] Add deprecation warning scripts
- [ ] Create migration guide
- [ ] Update CI/CD references
- [ ] Document deprecation timeline

**Documentation:**

- [ ] Create deprecation notice files
- [ ] Update CI/CD scripts
- [ ] Create migration guide
- [ ] Document timeline: 3 months → 6 months → removal

---

## OBJECTIVE 2: Integration Testing (Target: 3-4 hours)

### Task 2.1: End-to-End Service Tests

#### Test 2.1.1: Fresh Start

- [ ] Run `./scripts/vault clean`
- [ ] Run `./scripts/vault init`
- [ ] Run `./scripts/vault build`
- [ ] Run `./scripts/vault start`
  - [ ] MCP starts successfully
  - [ ] Vault starts successfully
  - [ ] No errors in output
- [ ] Run `./scripts/vault status`
  - [ ] All services report running
  - [ ] No error messages
- [ ] Verify services responsive
  - [ ] MCP responds on port 4000
  - [ ] Vault responds on port 3333

#### Test 2.1.2: Service Restart

- [ ] Run `./scripts/vault restart`
- [ ] Verify clean shutdown
- [ ] Verify clean startup
- [ ] Run `./scripts/vault status` after 5 seconds
- [ ] All services healthy
- [ ] No data lost

#### Test 2.1.3: Logs and Monitoring

- [ ] Run `./scripts/vault logs mcp`
  - [ ] MCP logs display
  - [ ] Follow mode works (-f)
- [ ] Run `./scripts/vault logs vaulty`
  - [ ] Vault logs display
  - [ ] Follow mode works
- [ ] Run `./scripts/vault logs`
  - [ ] All logs display
  - [ ] Clear labeling

#### Test 2.1.4: Build and Rebuild

- [ ] Run `./scripts/vault build`
  - [ ] MCP image builds
  - [ ] Vault image builds
  - [ ] All images successful
- [ ] Run `./scripts/vault rebuild`
  - [ ] Rebuild with --no-cache
  - [ ] All images rebuild
  - [ ] New images functional

### Task 2.2: Infrastructure Tests

#### Test 2.2.1: Initialization

- [ ] Run `./scripts/vault init`
- [ ] Verify volumes created
  - [ ] vault-data volume exists
  - [ ] mcp-data volume exists
  - [ ] vaulty-data volume exists
- [ ] Verify networks created
  - [ ] vault-network exists
  - [ ] Containers can join network
- [ ] Verify directories created
- [ ] Verify permissions correct

#### Test 2.2.2: Cleanup

- [ ] Run `./scripts/vault clean`
- [ ] Verify containers stopped
- [ ] Verify containers removed
- [ ] Verify confirmation prompt works
- [ ] Verify optional volume removal works

#### Test 2.2.3: Pruning

- [ ] Run `./scripts/vault prune`
- [ ] Verify dangling images removed
- [ ] Verify unused volumes freed
- [ ] Verify networks cleaned
- [ ] Verify disk space reclaimed

### Task 2.3: Utilities Testing

#### Test 2.3.1: Vault Sync

- [ ] Run `./scripts/vault sync-vault`
- [ ] Verify files sync
- [ ] Verify backup created
- [ ] Verify verification passes
- [ ] Verify statistics reported

#### Test 2.3.2: Vault Verify

- [ ] Run `./scripts/vault verify-vault`
- [ ] Verify structure validation
- [ ] Verify file counts accurate
- [ ] Verify large files detected
- [ ] Verify issues reported clearly

#### Test 2.3.3: Tunnel (if available)

- [ ] Check if cloudflared installed
- [ ] Run `./scripts/vault tunnel`
  - [ ] Tunnel starts
  - [ ] URL provided
  - [ ] Traffic routes correctly

### Task 2.4: Error Handling Tests

#### Test 2.4.1: Missing Dependencies

- [ ] Uninstall podman/docker temporarily
- [ ] Run `./scripts/vault status`
  - [ ] Clear error message shown
  - [ ] Suggestions provided
- [ ] Reinstall podman/docker

#### Test 2.4.2: Port Conflicts

- [ ] Occupy port 4000
- [ ] Run `./scripts/vault start`
  - [ ] Error detected
  - [ ] Port conflict reported
  - [ ] Suggestions provided
- [ ] Release port 4000

#### Test 2.4.3: Permission Issues

- [ ] Attempt operations without permissions
- [ ] Verify error handled gracefully
- [ ] Verify suggestions provided

### Task 2.5: Performance Tests

#### Performance Benchmarks

- [ ] Service startup time: **< 5 seconds**
  - [ ] Measure and record
  - [ ] Verify under 5s
- [ ] Script execution: **< 1 second**
  - [ ] Time status command
  - [ ] Time logs command
  - [ ] Verify under 1s
- [ ] Build time: **< 3 minutes**
  - [ ] Time full build
  - [ ] Verify under 3min
- [ ] Restart cycle: **< 10 seconds**
  - [ ] Time restart command
  - [ ] Verify under 10s
- [ ] Log retrieval: **< 1 second**
  - [ ] Time logs display
  - [ ] Verify under 1s

**Documentation:**

- [ ] Create `doc/PHASE4_TEST_RESULTS.md`
- [ ] Record all timings
- [ ] Document any failures
- [ ] Document any warnings

---

## OBJECTIVE 3: CI/CD Integration (Target: 2-3 hours)

### Task 3.1: GitHub Actions Integration

- [ ] Review existing workflows
- [ ] Update build workflow
  - [ ] Use `./scripts/vault build`
  - [ ] Capture build output
  - [ ] Report on failures
- [ ] Update test workflow
  - [ ] Use `./scripts/vault init`
  - [ ] Use `./scripts/vault start`
  - [ ] Use `./scripts/vault status`
  - [ ] Run tests
  - [ ] Capture logs
- [ ] Add new integration test workflow
- [ ] Test workflow in branch
  - [ ] Commit triggers tests
  - [ ] Tests pass
  - [ ] Logs captured
- [ ] Push to remote

### Task 3.2: Script Validation

- [ ] Add shellcheck to CI
  - [ ] Install shellcheck
  - [ ] Run on all shell scripts
  - [ ] Fix any issues
- [ ] Add markdown validation
  - [ ] Validate all docs
  - [ ] Fix formatting
- [ ] Add configuration validation
  - [ ] Validate all configs
  - [ ] Run builds with verify

### Task 3.3: Deployment Verification

- [ ] Document deployment steps
- [ ] Test on staging environment
- [ ] Verify all services operational
- [ ] Test rollback procedure
- [ ] Document troubleshooting

**Documentation:**

- [ ] Update GitHub Actions workflows
- [ ] Document validation rules
- [ ] Create deployment checklist

---

## OBJECTIVE 4: Performance Optimization (Target: 1-2 hours)

### Task 4.1: Script Performance

- [ ] Measure startup time
  - [ ] Record current time
- [ ] Identify slow operations
- [ ] Parallelize where safe
  - [ ] Test parallel service startup
  - [ ] Verify no conflicts
- [ ] Optimize script sourcing
  - [ ] Profile startup
  - [ ] Remove redundancy
- [ ] Re-measure time
  - [ ] Verify improvement
  - [ ] Document results

### Task 4.2: Build Optimization

- [ ] Review Dockerfiles
- [ ] Minimize layer count
- [ ] Cache dependencies
- [ ] Reduce image size
- [ ] Parallelize builds
- [ ] Re-measure build time
  - [ ] Verify improvement
  - [ ] Document results

### Task 4.3: Runtime Optimization

- [ ] Measure resource usage
  - [ ] CPU usage
  - [ ] Memory usage
  - [ ] I/O patterns
- [ ] Profile bottlenecks
- [ ] Optimize as needed
- [ ] Re-measure
  - [ ] Verify improvement
  - [ ] No regressions

**Documentation:**

- [ ] Create performance baseline
- [ ] Document optimizations
- [ ] Record new measurements

---

## OBJECTIVE 5: Production Deployment (Target: 2-3 hours)

### Task 5.1: Pre-Deployment Verification

#### Infrastructure Checks

- [ ] All volumes configured
- [ ] All networks created
- [ ] Firewall rules in place
- [ ] SSL certificates ready (if needed)
- [ ] Database migrations ready
- [ ] Cache systems ready
- [ ] Security keys configured

#### Service Checks

- [ ] All images built
- [ ] All containers functional
- [ ] Health checks passing
- [ ] Logs being captured

#### Configuration Checks

- [ ] Environment variables set
- [ ] Secrets configured
- [ ] Database credentials ready
- [ ] API keys configured

#### Documentation Checks

- [ ] Deployment guide complete
- [ ] Runbooks created
- [ ] Troubleshooting guide ready
- [ ] Contact info provided

### Task 5.2: Deployment Execution

- [ ] Create backup
- [ ] Run `./scripts/vault clean`
- [ ] Run `./scripts/vault build`
- [ ] Run `./scripts/vault start`
- [ ] Verify services starting
  - [ ] MCP running
  - [ ] Vault running
- [ ] Check health metrics
  - [ ] CPU normal
  - [ ] Memory normal
  - [ ] I/O normal
- [ ] Monitor for errors
  - [ ] No error logs
  - [ ] No crashes

### Task 5.3: Post-Deployment Monitoring

- [ ] Monitor for 30 minutes to 2 hours
- [ ] Watch status continuously
- [ ] Monitor logs
- [ ] Check resource usage
- [ ] Verify all endpoints responding

**Success Criteria:**

- [ ] All services stable
- [ ] No errors occurring
- [ ] Performance acceptable
- [ ] All endpoints responding

---

## OBJECTIVE 6: Documentation & Handoff (Target: 2-3 hours)

### Task 6.1: Complete Documentation

#### Document: Deployment Guide

- [ ] Prerequisites listed
- [ ] Step-by-step instructions
- [ ] Troubleshooting section
- [ ] Rollback procedures
- [ ] Contact information

#### Document: Scripts Reference

- [ ] Each script documented
- [ ] Usage examples provided
- [ ] Environment variables listed
- [ ] Common issues addressed

#### Document: Operations Guide

- [ ] Starting services documented
- [ ] Stopping services documented
- [ ] Viewing logs documented
- [ ] Common tasks documented
- [ ] Troubleshooting documented

#### Document: Architecture

- [ ] System overview complete
- [ ] Component interactions documented
- [ ] Data flows illustrated
- [ ] Security considerations listed

#### Document: README Update

- [ ] Quick start added
- [ ] Features listed
- [ ] Requirements documented
- [ ] Contributing guidelines

**Deliverables:**

- [ ] `doc/DEPLOYMENT_GUIDE.md` complete
- [ ] `doc/SCRIPTS_REFERENCE.md` complete
- [ ] `doc/OPERATIONS_GUIDE.md` complete
- [ ] `doc/ARCHITECTURE_FINAL.md` complete
- [ ] `README.md` updated

### Task 6.2: Create Runbooks

#### Runbook: Startup Procedures

- [ ] Cold start documented
- [ ] Warm restart documented
- [ ] Rolling restart documented

#### Runbook: Shutdown Procedures

- [ ] Graceful shutdown documented
- [ ] Emergency shutdown documented
- [ ] Backup before shutdown documented

#### Runbook: Troubleshooting

- [ ] Service won't start → solutions
- [ ] Service crashes → diagnosis
- [ ] Performance issues → troubleshooting
- [ ] Connectivity issues → solutions

#### Runbook: Maintenance

- [ ] Updating images documented
- [ ] Updating configuration documented
- [ ] Cleaning up resources documented
- [ ] Backing up data documented

**Deliverables:**

- [ ] `doc/RUNBOOKS_STARTUP.md` complete
- [ ] `doc/RUNBOOKS_SHUTDOWN.md` complete
- [ ] `doc/RUNBOOKS_TROUBLESHOOTING.md` complete
- [ ] `doc/RUNBOOKS_MAINTENANCE.md` complete

### Task 6.3: Update README

- [ ] Quick Start section complete
- [ ] Features section complete
- [ ] Prerequisites section complete
- [ ] Architecture section complete
- [ ] Development section complete
- [ ] Deployment section complete
- [ ] Contributing section complete
- [ ] License section complete

### Task 6.4: Final Verification

#### End-to-End Test

- [ ] Simulate fresh installation
- [ ] Initialize platform
- [ ] Build images
- [ ] Deploy services
- [ ] Verify operational
- [ ] Run full command set
- [ ] Test recovery procedures
- [ ] Verify cleanup procedures

#### Verification Checklist

- [ ] All steps successful
- [ ] No errors encountered
- [ ] Documentation accurate
- [ ] Ready for handoff

---

## FINAL ACCEPTANCE CRITERIA

### Functional ✅

- [ ] All legacy scripts migrated
- [ ] All services integrated
- [ ] All infrastructure operational
- [ ] All utilities functional
- [ ] CI/CD pipeline updated

### Quality ✅

- [ ] 100% test pass rate
- [ ] Zero critical issues
- [ ] Performance benchmarks met
- [ ] All documentation complete
- [ ] Code follows standards

### Operational ✅

- [ ] Deployment procedure documented
- [ ] Rollback procedure tested
- [ ] Monitoring implemented
- [ ] On-call runbooks ready

### Performance ✅

- [ ] Startup: < 5 seconds
- [ ] Scripts: < 1 second
- [ ] Build: < 3 minutes
- [ ] CPU: < 5% average
- [ ] Memory: < 300MB per service

---

## SIGN-OFF

- [ ] Technical Lead Approval
- [ ] QA Approval
- [ ] Operations Approval
- [ ] Ready for Production

---

## NOTES & OBSERVATIONS

```
Space for notes during Phase 4 execution:


```

---

**Phase 4 Master Checklist** - Complete & Ready to Execute ✅

Start with: OBJECTIVE 1 - Task 1.1 - Analyze Legacy Scripts
