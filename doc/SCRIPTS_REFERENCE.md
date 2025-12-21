# Vault Platform - Scripts Reference

**Version**: 1.0  
**Date**: December 21, 2025

---

## Overview

The Vault Platform provides a unified command interface through `scripts/vault` for all operations.

**Quick Start**:

```bash
cd /path/to/vault-platform-full
./scripts/vault --help
```

---

## Main Command: `./scripts/vault`

Central command router for all vault operations.

### Usage

```bash
./scripts/vault [command] [options]
```

### Commands by Category

---

## Quick Start

### `./scripts/vault up [vault-path]`

Initialize and start all services in one command.

**Usage**:

```bash
./scripts/vault up
./scripts/vault up /path/to/vault
```

**What it does**:

1. Initializes platform infrastructure
2. Starts all services (MCP, Vault)
3. Verifies services are running

**Output**:

```
[INFO] Initializing and starting platform...
[✓] Platform infrastructure initialized successfully
[✓] All services started successfully
```

**Time**: ~3-5 minutes

---

## Container Management

### `./scripts/vault start`

Start all services (MCP, Vault).

**Usage**:

```bash
./scripts/vault start
```

**Duration**: ~30-60 seconds

**Output**:

```
[✓] MCP service started: mcp-server-dev
[✓] Vault service started: vaulty
[✓] All services started successfully
```

### `./scripts/vault stop`

Stop all services gracefully.

**Usage**:

```bash
./scripts/vault stop
```

**Duration**: ~10-15 seconds

**Output**:

```
[✓] Stopped: mcp-server-dev
[✓] Stopped: vaulty
[✓] All services stopped
```

### `./scripts/vault restart`

Restart all services (clean restart cycle).

**Usage**:

```bash
./scripts/vault restart
```

**Duration**: ~20-30 seconds

**Output**:

```
[INFO] Restarting all services...
[✓] All services restarted
```

### `./scripts/vault status`

Show current status of all services.

**Usage**:

```bash
./scripts/vault status
```

**Output**:

```
✓ mcp is running
✓ vaulty is running
✓ vault is running
✓ Status check complete
```

### `./scripts/vault logs [service]`

View service logs with tail -f (follow mode).

**Usage**:

```bash
./scripts/vault logs              # All logs
./scripts/vault logs mcp          # MCP logs
./scripts/vault logs vaulty       # Vault logs
```

**Output**:

```
[INFO] MCP server listening at http://localhost:4000/mcp
...
```

**Exit**: Press Ctrl+C

---

## Development

### `./scripts/vault build`

Build all container images (with cache).

**Usage**:

```bash
./scripts/vault build
```

**Duration**: ~2-5 minutes (depending on cache)

**Output**:

```
→ Building MCP service
  [✓] MCP image built

→ Building Vault service
  [✓] Vault image built

→ Building LLM Adapter service
  [✓] LLM Adapter image built

[✓] All images built successfully
```

### `./scripts/vault rebuild`

Rebuild all container images without cache.

**Usage**:

```bash
./scripts/vault rebuild
```

**Duration**: ~10-15 minutes (full build)

**Output**: Same as build, but fresh compilation

### `./scripts/vault shell [app]`

Start interactive shell in a running container.

**Usage**:

```bash
./scripts/vault shell mcp       # MCP container shell
./scripts/vault shell           # Defaults to MCP
```

**Exit**: Type `exit`

---

## Infrastructure

### `./scripts/vault infrastructure init`

Initialize platform infrastructure (volumes, networks, directories).

**Usage**:

```bash
./scripts/vault infrastructure init
```

**Creates**:

- Volumes: vault, mcp-data, vaulty-data
- Networks: vault-network
- Directories: .vault, logs, .vault

**Output**:

```
✓ Volume created: vault
✓ Network created: vault-network
✓ Directories ready
```

### `./scripts/vault infrastructure clean`

Clean up containers and optionally volumes.

**Usage**:

```bash
./scripts/vault infrastructure clean
```

**Prompt**: "Remove volumes as well? [y/N]"

**Output**:

```
✓ All services stopped
✓ Cleanup complete
```

### `./scripts/vault infrastructure prune`

Remove unused Docker resources (dangling images, volumes, networks).

**Usage**:

```bash
./scripts/vault infrastructure prune
```

**Output**:

```
→ Pruning system resources
[✓] Dangling images removed (117+ images)
[✓] Unused volumes freed
[✓] Networks cleaned
```

---

## Utilities

### `./scripts/vault utilities sync`

Sync vault volume to local filesystem.

**Usage**:

```bash
./scripts/vault utilities sync
```

**What it does**:

1. Creates backup of local vault
2. Syncs from volume to .vault/
3. Verifies sync completed

**Output**:

```
✓ Volume synced to: /path/to/.vault
✓ Vault sync complete
```

### `./scripts/vault utilities verify`

Verify vault integrity and structure.

**Usage**:

```bash
./scripts/vault utilities verify
```

**Checks**:

- Required directories present
- File count and structure
- Large files (> 100MB)
- Issues and anomalies

**Output**:

```
→ Checking vault structure
✓ Found: .obsidian
✓ Found: 3. Resources
  File count: 1,234
  Directory count: 45
✓ Vault verification complete
```

### `./scripts/vault utilities tunnel`

Start Cloudflared tunnel (if installed).

**Usage**:

```bash
./scripts/vault utilities tunnel
```

**Output**:

```
→ Starting tunnel
[✓] Tunnel started
[✓] URL: https://your-tunnel.trycloudflare.com
```

---

## General

### `./scripts/vault help`

Show help message.

**Usage**:

```bash
./scripts/vault help
./scripts/vault --help
./scripts/vault -h
```

### `./scripts/vault version`

Show version information.

**Usage**:

```bash
./scripts/vault version
./scripts/vault --version
./scripts/vault -v
```

---

## Environment Variables

### Common Variables

```bash
# Vault path (default: ~/.obsidian/vault)
export VAULT_PATH=/path/to/vault

# Local sync directory
export LOCAL_VAULT_PATH=/path/to/local/vault

# Log level (debug, info, warn, error)
export LOG_LEVEL=info

# Docker host socket (for remote docker)
export DOCKER_HOST=unix:///path/to/docker.sock
```

### Git-related Variables

```bash
# Git sync interval (seconds)
export GIT_SYNC_INTERVAL=30

# Git credentials
export GIT_USERNAME=your-username
export GIT_REPO=your-repo.git
```

---

## Examples

### Start Fresh Development Environment

```bash
./scripts/vault stop                        # Stop current
./scripts/vault infrastructure clean       # Clean up (with -y for auto)
./scripts/vault infrastructure init        # Initialize
./scripts/vault build                      # Build images
./scripts/vault start                      # Start services
./scripts/vault status                     # Verify
```

### Deploy to Production

```bash
./scripts/vault stop
tar -czf backup-$(date +%Y%m%d).tar.gz .vault logs/
./scripts/vault infrastructure init
./scripts/vault build
./scripts/vault start
./scripts/vault status
```

### Monitor Services

```bash
# Terminal 1: Continuous status
watch -n 5 './scripts/vault status'

# Terminal 2: Logs
./scripts/vault logs mcp -f

# Terminal 3: Resources
podman stats
```

### Restart Services Safely

```bash
# Check status before
./scripts/vault status

# Restart
./scripts/vault restart

# Wait and verify
sleep 5
./scripts/vault status

# Check logs for errors
./scripts/vault logs mcp | tail -20
```

---

## Troubleshooting

### Script Errors

**Error**: "Unknown command: xxx"

```bash
# List available commands
./scripts/vault help

# Check script permissions
ls -la scripts/vault
chmod +x scripts/vault
```

**Error**: "Permission denied"

```bash
# Fix permissions
chmod +x scripts/*.sh
chmod +x scripts/**/*.sh
```

### Common Issues

**Port already in use**:

```bash
lsof -i :4000  # Find what's using port 4000
kill -9 <PID>  # Kill the process
```

**Out of disk space**:

```bash
./scripts/vault infrastructure prune
df -h          # Check disk usage
```

**Services not starting**:

```bash
./scripts/vault logs mcp   # Check MCP logs
./scripts/vault logs vaulty # Check Vault logs
```

---

## Script Internals

### Script Location

```
scripts/
├── vault                           # Main entry point
├── vault.sh                        # Router
├── common.sh                       # Shared utilities
├── build/
│   └── docker-build.sh
├── services/
│   ├── start.sh
│   ├── stop.sh
│   ├── restart.sh
│   ├── status.sh
│   └── logs.sh
├── infrastructure/
│   ├── init.sh
│   ├── clean.sh
│   ├── prune.sh
│   └── verify.sh
└── utilities/
    ├── sync-vault.sh
    ├── verify-vault.sh
    └── tunnel.sh
```

### Common Functions

```bash
# Logging
log_info "Message"
log_success "Success message"
log_warn "Warning message"
log_error "Error message"

# Validation
require_command "podman"
require_dir "/path"
require_file "/path"

# Docker operations
require_running_docker
get_container_ip "container_name"
```

---

## Advanced Usage

### Custom Script Configuration

Create `.env` file in project root:

```bash
# .env
VAULT_PATH=/custom/vault/path
LOCAL_VAULT_PATH=/custom/local/path
LOG_LEVEL=debug
GIT_SYNC_INTERVAL=60
```

Scripts will automatically load `.env` if present.

### Debugging

Enable debug output:

```bash
export LOG_LEVEL=debug
./scripts/vault start
```

Show script execution:

```bash
bash -x scripts/vault.sh start
```

---

## Performance Tips

1. **Use build cache**: `./scripts/vault build` (faster)
2. **Pre-pull images**: `podman pull node:22-alpine`
3. **Monitor resources**: `podman stats`
4. **Clean regularly**: `./scripts/vault infrastructure prune`

---

**Last Updated**: December 21, 2025  
**Phase**: 4 of 4 - Complete ✅
