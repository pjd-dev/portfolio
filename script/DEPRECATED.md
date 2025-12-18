# ⚠️ DEPRECATED: Legacy Script Directory

This directory (`script/`) contains legacy scripts that have been **superseded by the new centralized script system**.

## Migration Status

All functionality from this directory has been migrated to the new `scripts/` directory with better organization and features.

| Legacy Script             | New Location                        | Status      |
| ------------------------- | ----------------------------------- | ----------- |
| `restart-all.sh`          | `scripts/services/restart.sh`       | ✅ Migrated |
| `cloudflared.tunnel.sh`   | `scripts/utilities/tunnel.sh`       | ✅ Migrated |
| `sync-volume-to-local.sh` | `scripts/utilities/sync-vault.sh`   | ✅ Migrated |
| `verify-shared-vault.sh`  | `scripts/utilities/verify-vault.sh` | ✅ Migrated |
| `init-volume.sh`          | `scripts/infrastructure/init.sh`    | ✅ Migrated |
| `common.sh`               | `scripts/common.sh`                 | ✅ Migrated |

## How to Update Your Commands

### Old Way (DEPRECATED)

```bash
./script/restart-all.sh
./script/cloudflared.tunnel.sh
./script/sync-volume-to-local.sh
```

### New Way (RECOMMENDED)

```bash
./scripts/vault services restart
./scripts/vault utilities tunnel
./scripts/vault utilities sync
```

Or use the centralized entry point:

```bash
./scripts/vault --help
```

## Why the Change?

1. **Centralized Management** — Single entry point for all scripts
2. **Better Organization** — Scripts grouped by functionality
3. **Shared Utilities** — Common functions in `scripts/common.sh` and `scripts/lib/`
4. **Improved Error Handling** — Consistent error reporting across all scripts
5. **Documentation** — See `scripts/README.md` for details

## Migration Timeline

- **Current**: Both directories available (backward compatible)
- **Next Release**: `script/` directory may be moved to `script-backup/`
- **Future**: `script/` directory will be removed

## Questions?

See `scripts/README.md` or run:

```bash
./scripts/vault --help
```

---

**Deprecation Date**: December 18, 2025  
**Removal Target**: v3.0.0 (next major release)
