# Podman Container Reference

This directory contains legacy and reference files for container orchestration.

## Quick Links

- **[DEPRECATED.md](DEPRECATED.md)** — Migration guide for legacy scripts
- **[scripts/README.md](../scripts/README.md)** — New centralized script system
- **[scripts/services/](../scripts/services/)** — Service management commands

## What's in This Directory

### Legacy Scripts (DEPRECATED)

- `run-all.sh` — ⚠️ Use `scripts/vault start` instead
- `run-mcp.sh` — ⚠️ Use `scripts/vault start` instead
- `run-vault.sh` — ⚠️ Use `scripts/vault start` instead
- `podman-compose.sh` — ⚠️ Use `scripts/vault start` instead

See [DEPRECATED.md](DEPRECATED.md) for migration details.

### Systemd Service Templates

#### mcp.service

Systemd unit file for running the MCP container as a service.

**Usage:**

```bash
# Copy to systemd user directory
cp mcp.service ~/.config/systemd/user/

# Enable and start
systemctl --user daemon-reload
systemctl --user enable mcp
systemctl --user start mcp

# Monitor
systemctl --user status mcp
journalctl --user -u mcp -f
```

**Note:** Edit the ExecStart line to match your environment (image names, ports, volumes).

#### vault.service

Systemd unit file for running the Vault (vaulty) container as a service.

**Usage:** Same as mcp.service above, but for the vault container.

### Recommended Approach

Instead of systemd service files, we recommend using the centralized scripts:

```bash
# Start services (more reliable, better error handling)
./scripts/vault start

# Check status
./scripts/vault status

# View logs
./scripts/vault logs

# Stop
./scripts/vault stop
```

These commands:

- ✅ Properly load environment variables
- ✅ Handle initialization and cleanup
- ✅ Provide unified logging
- ✅ Work across all platforms (not just systemd)

---

**Last Updated**: December 18, 2025  
**Maintenance Status**: Legacy/Reference (no new development)
