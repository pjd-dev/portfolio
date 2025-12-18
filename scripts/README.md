# Scripts Directory

Centralized script management for the Vault Platform Full project.

## Structure

```text
scripts/
├── vault                    # Main entry point (central orchestrator)
├── common.sh               # Shared utilities and functions
├── README.md               # This file
├── services/               # Service management scripts
│   ├── start.sh           # Start all services
│   ├── stop.sh            # Stop all services
│   ├── restart.sh         # Restart all services
│   ├── status.sh          # Check service status
│   └── logs.sh            # View service logs
├── build/                 # Container build scripts
│   ├── docker-build.sh    # Build all container images
│   └── Dockerfile.*       # Dockerfile references
├── infrastructure/        # Platform infrastructure scripts
│   ├── init.sh            # Initialize volumes and networks
│   ├── clean.sh           # Clean up resources
│   └── prune.sh           # Prune unused resources
├── utilities/            # Utility scripts
│   ├── sync-vault.sh     # Sync vault to local filesystem
│   ├── verify-vault.sh   # Verify vault integrity
│   └── tunnel.sh         # Start Cloudflared tunnel
└── lib/                  # Shared libraries
    └── colors.sh         # Color codes and formatting
```

## Quick Start

### Start the Platform

```bash
./scripts/vault start
```

### View Logs

```bash
./scripts/vault logs
./scripts/vault logs mcp
./scripts/vault logs vault
```

### Stop the Platform

```bash
./scripts/vault stop
```

### Rebuild Everything

```bash
./scripts/vault rebuild
```

## Commands

### Service Management

- `scripts/vault start` - Start all services (MCP, Vault)
- `scripts/vault stop` - Stop all services
- `scripts/vault restart` - Restart all services
- `scripts/vault status` - Check service status
- `scripts/vault logs [service]` - View service logs

### Development

- `scripts/vault build` - Build container images
- `scripts/vault rebuild` - Rebuild without cache

### Infrastructure

- `scripts/vault init` - Initialize platform (volumes, networks)
- `scripts/vault clean` - Clean up containers and volumes
- `scripts/vault prune` - Remove unused Docker resources

### Utilities

- `scripts/vault sync-vault` - Sync vault to local filesystem
- `scripts/vault verify-vault` - Verify vault integrity
- `scripts/vault tunnel` - Start Cloudflared tunnel

## Environment Variables

```bash
# Path to Obsidian vault
export VAULT_PATH=~/.obsidian/vault

# Docker configuration
export DOCKER_HOST=unix:///run/user/1000/podman/podman.sock

# Logging
export LOG_LEVEL=info
```

## Legacy Script Mapping

This consolidation replaces the following locations:

| Old Location                       | New Location                  | Purpose                |
| ---------------------------------- | ----------------------------- | ---------------------- |
| `./script/restart-all.sh`          | `scripts/vault restart`       | Restart all services   |
| `./apps/mcp/restart-mcp.sh`        | `scripts/vault restart`       | Restart MCP service    |
| `./apps/vaulty/restart-vaulty.sh`  | `scripts/vault restart`       | Restart Vaulty service |
| `./podman/run-all.sh`              | `scripts/vault start`         | Start all services     |
| `./podman/run-mcp.sh`              | `scripts/vault start` (mcp)   | Start MCP service      |
| `./podman/run-vault.sh`            | `scripts/vault start` (vault) | Start Vault service    |
| `./podman/podman-compose.sh`       | `scripts/vault` (build)       | Compose services       |
| `./script/common.sh`               | `scripts/common.sh`           | Shared utilities       |
| `./script/init-volume.sh`          | `scripts/vault init`          | Initialize volumes     |
| `./script/sync-volume-to-local.sh` | `scripts/vault sync-vault`    | Sync vault             |
| `./script/verify-shared-vault.sh`  | `scripts/vault verify-vault`  | Verify vault           |
| `./script/cloudflared.tunnel.sh`   | `scripts/vault tunnel`        | Start tunnel           |

## Script Development

### Adding New Scripts

1. Create script in appropriate subdirectory:

   ```bash
   mkdir -p scripts/services
   cat > scripts/services/new-command.sh << 'EOF'
   #!/usr/bin/env bash
   # ... your script ...
   EOF
   chmod +x scripts/services/new-command.sh
   ```

2. Update the main `scripts/vault` router to handle the new command

3. Update this README with the new command

### Shared Utilities

Common functions are available in `scripts/common.sh`:

```bash
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

# Use utility functions
log_info "Information message"
log_success "Success message"
log_error "Error message"
log_warn "Warning message"

# Use environment variables
echo "$PROJECT_ROOT"
echo "$SCRIPT_DIR"
```

## Testing

Verify scripts work correctly:

```bash
# Test the main entry point
./scripts/vault help
./scripts/vault version

# Test service commands
./scripts/vault status

# Test utilities
./scripts/vault sync-vault
```

## Debugging

Enable debug logging:

```bash
# Set debug level
LOG_LEVEL=debug ./scripts/vault start

# Or enable bash debug mode
bash -x ./scripts/vault start
```

## See Also

- [TESTING_CHECKLIST.md](../TESTING_CHECKLIST.md) - Testing procedures
- [doc/SCRIPTS.md](../doc/SCRIPTS.md) - Detailed script documentation
- [podman/](../podman/) - Container orchestration configuration
