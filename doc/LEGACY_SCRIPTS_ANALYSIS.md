# Phase 4 - Task 1.1: Legacy Scripts Analysis

**Date:** December 18, 2025  
**Status:** 🔄 In Progress  
**Task:** Analyze all legacy scripts to identify migration requirements

---

## Summary

Found **26 legacy scripts** across 4 directories that need analysis for Phase 4 migration:

```
./script/          6 scripts
./podman/          4 scripts
./apps/mcp/        5 scripts (in script/ subdirectory)
./apps/vaulty/     7 scripts (in script/ and src/ subdirectories)
```

**New scripts already in place:** 14 scripts in `./scripts/` (created in Phase 3)

---

## Detailed Analysis

### 1. ROOT-LEVEL SCRIPTS (`./script/`)

#### `./script/common.sh` (82 lines)

**Status:** ⚠️ Partially Redundant - Some utility functions useful

**Functions:**

- `load_env_files()` - Loads .env files
- `resolve_path()` - Python-based path resolver
- `info()` - Info logging
- `warn()` - Warning logging
- `fail()` - Error logging and exit

**Action:** Extract useful functions to `scripts/common.sh` (already has similar)

**Migration Status:**

- `load_env_files()` - Already in `scripts/common.sh`
- Logging functions - Already in `scripts/common.sh` with colors
- `resolve_path()` - Using Python, not needed (bash alternatives exist)

**Recommendation:** ✅ Can remove, functionality exists in Phase 3

---

#### `./script/restart-all.sh`

**Status:** 📋 Template for new migration

**Current Action:**

- Sources `common.sh`
- Runs app scripts

**What it does:**

```bash
# Likely restarts both mcp and vaulty
# Needs to call podman restart or similar
```

**Migration:** Use `./scripts/vault restart` which combines functionality

**Recommendation:** ✅ Replace with `scripts/vault restart`

---

#### `./script/init-volume.sh` (62 lines)

**Status:** 🔄 Needs Migration - Important functionality

**Functions:**

- Creates podman volume by name
- Creates local directory
- Copies contents from local to volume
- Handles path expansion (~, relative)
- Handles SELinux labels (:Z)

**Key Logic:**

```bash
# Volume creation
podman volume create "$VOLUME_NAME"

# Path handling
LOCAL_PATH="$(resolve_path "$LOCAL_PATH")"

# Copy from local to volume
podman run --rm -v "$LOCAL_PATH":/src:Z -v "$VOLUME_NAME":/dst alpine sh -c "cp -a /src/. /dst/"
```

**Migration:** Update `scripts/infrastructure/init.sh` with this logic

**Recommendation:** ✅ Migrate volume and directory creation logic

---

#### `./script/sync-volume-to-local.sh` (62 lines)

**Status:** 🔄 Needs Migration - Important functionality

**Functions:**

- Syncs podman volume to local filesystem
- Configurable sync interval
- Validates volume exists
- Creates local directory

**Key Logic:**

```bash
# Volume validation
podman volume exists "$VOLUME_NAME"

# Sync operation (rsync-like)
# Uses podman to copy from volume to local
```

**Migration:** Update `scripts/utilities/sync-vault.sh` with this logic

**Recommendation:** ✅ Migrate sync logic

---

#### `./script/verify-shared-vault.sh`

**Status:** 🔄 Needs Analysis - Located in different file

**Action:** Check if this exists or renamed

**Recommendation:** Check and migrate verification logic

---

#### `./script/cloudflared.tunnel.sh`

**Status:** 🔄 Needs Migration - Utility function

**Purpose:** Start Cloudflared tunnel

**Migration:** Already placeholder in `scripts/utilities/tunnel.sh`

**Recommendation:** ✅ Extract and migrate tunnel logic

---

### 2. PODMAN SCRIPTS (`./podman/`)

#### `./podman/run-mcp.sh` (68 lines) ⭐ **IMPORTANT**

**Status:** 🔄 Critical - Must migrate

**Functions:**

- Loads .env files (root + app level)
- Builds MCP image
- Creates pod if needed
- Handles user/group mapping
- Mounts vault volume
- Sets environment variables
- Runs MCP container

**Key Logic:**

```bash
# Load environment
load_env_files()

# Build image
podman build -t mcp -f "$REPO_ROOT/apps/mcp/Dockerfile" "$REPO_ROOT"

# Determine volume source
VOLUME_SOURCE="${LOCAL_VAULT_PATH:-${VAULT_DATA_VOLUME:-vault}}"

# Expand paths
if [ "${VOLUME_SOURCE#~}" != "$VOLUME_SOURCE" ]; then
  VOLUME_SOURCE="$(eval echo "$VOLUME_SOURCE")"
fi

# Run container
podman run -d --rm --name "$MCP_CONTAINER" --pod "$POD_NAME" \
  --volume "$VOLUME_SOURCE":/vault:Z \
  "${ENV_FILES[@]}" \
  "${USER_FLAG[@]}" \
  mcp
```

**Critical Variables:**

- `POD_NAME` - Container pod (default: "vaulty-pod")
- `MCP_CONTAINER` - Container name (default: "mcp-server-dev")
- `VOLUME_SOURCE` - Vault volume/path
- `LOCAL_VAULT_PATH` - Local vault path override
- `VAULT_DATA_VOLUME` - Named volume (default: "vault")
- `CONTAINER_USER` - User/group (default: current user)

**Migration:** ✅ Move entire logic to `scripts/services/start.sh`

---

#### `./podman/run-vault.sh` (76 lines) ⭐ **IMPORTANT**

**Status:** 🔄 Critical - Must migrate

**Functions:**

- Similar to run-mcp.sh but for Vault (Vaulty)
- Creates pod with port binding
- Builds Vault image
- Runs Vault container

**Key Logic:**

```bash
# Create pod with port binding
podman pod create --name "$POD_NAME" -p "${MCP_PORT:-4000}":4000 || true

# Build image
podman build -t vault -f "$REPO_ROOT/apps/vaulty/Dockerfile" "$REPO_ROOT/apps/vaulty"

# Run container (similar to MCP)
```

**Critical Variables:**

- `POD_NAME` - Same pod (default: "vaulty-pod")
- `VAULT_CONTAINER` - Container name (default: "vaulty")
- `MCP_PORT` - MCP port (default: 4000)
- Same volume/path handling as MCP

**Migration:** ✅ Move entire logic to `scripts/services/start.sh`

---

#### `./podman/run-all.sh`

**Status:** 📋 Orchestrator - Already being replaced

**Purpose:** Runs both MCP and Vault

**Migration:** `./scripts/vault start` combines functionality

**Recommendation:** ✅ No migration needed - covered by Phase 3

---

#### `./podman/podman-compose.sh`

**Status:** 📋 Build orchestrator

**Purpose:** Likely builds all images

**Migration:** `./scripts/vault build` covers this

**Recommendation:** Check and verify, otherwise use Phase 3 build

---

### 3. MCP APP SCRIPTS (`./apps/mcp/script/`)

#### Summary

- `build.sh` - Build script for MCP
- `common.sh` - Common functions for MCP
- `healthcheck.sh` - Health check for MCP
- `pod.sh` - Pod management for MCP
- `prepare.sh` - Preparation script for MCP
- `run.sh` - Run script for MCP

**Status:** These are app-specific and mostly for docker/pod setup

**Recommendation:** Keep in app directory - not part of root-level consolidation

---

### 4. VAULTY APP SCRIPTS (`./apps/vaulty/script/` and `./apps/vaulty/src/`)

#### `./apps/vaulty/src/git-sync.sh`

**Status:** App-specific - Keep in place

**Recommendation:** Keep in app directory

---

#### `./apps/vaulty/src/vault-init.sh`

**Status:** App-specific - Keep in place

**Recommendation:** Keep in app directory

---

#### App `script/` directory

- Similar to MCP app scripts
- Build, health, pod management

**Recommendation:** Keep in app directories

---

## Migration Plan Summary

### ✅ NO MIGRATION NEEDED (Already in Phase 3)

- `./script/restart-all.sh` → Use `./scripts/vault restart`
- `./podman/run-all.sh` → Use `./scripts/vault start`
- `./podman/podman-compose.sh` → Use `./scripts/vault build`

### 🔄 MUST MIGRATE (Critical functionality)

#### Task 1.2: Service Scripts

1. **`./podman/run-mcp.sh`** → Integrate into `scripts/services/start.sh`
   - MCP startup logic
   - Environment loading
   - Volume mounting
   - Container running
   - User/group handling

2. **`./podman/run-vault.sh`** → Integrate into `scripts/services/start.sh`
   - Vault startup logic
   - Pod creation
   - Port binding
   - Container running

3. **Stop/Restart logic** → `scripts/services/stop.sh` & `restart.sh`
   - Container stopping
   - Pod cleanup
   - Graceful shutdown

#### Task 1.3: Infrastructure Scripts

1. **`./script/init-volume.sh`** → `scripts/infrastructure/init.sh`
   - Volume creation
   - Directory creation
   - Path expansion
   - Content copying

2. **Environment setup** → `scripts/infrastructure/init.sh`
   - Network creation
   - Permission setup
   - Initialization sequences

#### Task 1.4: Utility Scripts

1. **`./script/sync-volume-to-local.sh`** → `scripts/utilities/sync-vault.sh`
   - Sync logic
   - Interval handling
   - Volume to local copy

2. **`./script/verify-shared-vault.sh`** → `scripts/utilities/verify-vault.sh`
   - Vault verification
   - Structure validation
   - Issue detection

3. **`./script/cloudflared.tunnel.sh`** → `scripts/utilities/tunnel.sh`
   - Tunnel startup
   - URL reporting
   - Error handling

#### Task 1.5: Deprecation

- Move all migrated scripts to `./legacy/` directory
- Keep as reference during Phase 4
- Remove after 3-month transition period

---

## Critical Environment Variables to Preserve

**From `./podman/run-*.sh`:**

- `POD_NAME` - Pod name (default: "vaulty-pod")
- `MCP_CONTAINER` / `MCP_CONTAINER_NAME` - MCP container name
- `VAULT_CONTAINER` / `VAULT_CONTAINER_NAME` - Vault container name
- `LOCAL_VAULT_PATH` - Local vault path override
- `VAULT_DATA_VOLUME` - Named volume name (default: "vault")
- `MCP_PORT` - MCP port (default: 4000)
- `CONTAINER_USER` - User/group mapping (default: current user)

**From `./script/*`:**

- `VOLUME_NAME` - Volume name
- `LOCAL_PATH` - Local path
- `SYNC_INTERVAL` - Sync interval (default: 60s)

**All from `.env` files:**

- Both root `.env` and app-level `.env` loaded in order

---

## Next Steps

1. ✅ **Task 1.1 Complete:** Analysis done
2. 🔄 **Task 1.2 Next:** Migrate service scripts
   - Update `scripts/services/start.sh` with MCP + Vault logic
   - Update `scripts/services/stop.sh` with shutdown logic
   - Test each command

---

## Files to Migrate From

```
./podman/run-mcp.sh      → Migrate startup logic
./podman/run-vault.sh    → Migrate startup logic
./script/common.sh       → Extract if needed
./script/init-volume.sh  → Migrate init logic
./script/sync-volume-to-local.sh → Migrate sync logic
./script/verify-shared-vault.sh  → Migrate verify logic
./script/cloudflared.tunnel.sh   → Migrate tunnel logic
```

## Files to Deprecate

```
./script/                → Move to ./legacy/script/
./podman/                → Move to ./legacy/podman/
./apps/*/restart-*.sh    → Move to ./legacy/apps/
./apps/*/script/         → Move to ./legacy/apps/ (reference)
```

## Files to Keep

```
./scripts/               → Keep and update with migrated logic
./apps/*/src/*.sh        → Keep in place (app-specific)
```

---

**Status:** ✅ Task 1.1 COMPLETE - Analysis Documented

**Next Task:** Task 1.2 - Migrate Service Scripts (start.sh)

**Estimated Time:** 1 hour
