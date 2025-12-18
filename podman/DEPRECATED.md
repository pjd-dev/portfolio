# ⚠️ DEPRECATED: Podman Scripts Directory

This directory contains **legacy container orchestration scripts** that have been replaced by the new centralized `scripts/` system.

## Migration Status

| Legacy Script       | New Location                | Status      | Notes                                |
| ------------------- | --------------------------- | ----------- | ------------------------------------ |
| `run-all.sh`        | `scripts/services/start.sh` | ✅ Migrated | Use `./scripts/vault start`          |
| `run-mcp.sh`        | `scripts/services/start.sh` | ✅ Migrated | Individual service starts deprecated |
| `run-vault.sh`      | `scripts/services/start.sh` | ✅ Migrated | Individual service starts deprecated |
| `podman-compose.sh` | `scripts/services/start.sh` | ✅ Migrated | Full orchestration moved to scripts  |

## How to Migrate

### Old Way (DEPRECATED)

```bash
./podman/run-all.sh
./podman/run-mcp.sh
./podman/run-vault.sh
./podman/podman-compose.sh
```

### New Way (RECOMMENDED)

```bash
# Start all services
./scripts/vault start
pnpm vault:services:start

# Stop all services
./scripts/vault stop
pnpm vault:services:stop

# Check status
./scripts/vault status
pnpm vault:services:status

# View logs
./scripts/vault logs
pnpm vault:services:logs
```

## Systemd Service Files

The `*.service` files (`mcp.service`, `vault.service`) are **templates for systemd integration**:

- **mcp.service** — Systemd unit for MCP container
- **vault.service** — Systemd unit for Vault container

These are **documentation/reference only**. To use them:

```bash
# Copy to systemd directory
sudo cp mcp.service /etc/systemd/user/
sudo systemctl --user daemon-reload
sudo systemctl --user start mcp
```

However, **we recommend using the scripts** for better integration and debugging:

```bash
./scripts/vault start      # More reliable
./scripts/vault logs       # Better logging
./scripts/vault status     # Real-time status
```

## Why the Change?

1. **Centralized Management** — All scripts in one place (`scripts/`)
2. **Better Error Handling** — Unified logging and debugging
3. **Environment Consistency** — Proper .env file loading
4. **Service Orchestration** — Start/stop/restart multiple containers atomically
5. **Status Monitoring** — Check health across all services

## Timeline

- **Current**: Both podman/ and scripts/ work (backward compatible)
- **Next Release**: podman/ scripts moved to podman-legacy/
- **Future**: podman/ directory remains as reference/templates only

## Questions?

See:

- `scripts/README.md` — New script system documentation
- `scripts/services/start.sh` — Service start logic
- `./scripts/vault --help` — Available commands

---

**Deprecation Date**: December 18, 2025  
**Removal Target**: v3.0.0 (next major release)
