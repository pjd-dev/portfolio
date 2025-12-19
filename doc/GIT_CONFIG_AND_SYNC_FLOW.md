# Git Configuration and Sync Flow - December 19, 2025

## Problem Statement

The container initialization was failing with git configuration errors:

- `"Git user.name not configured"` - Preventing commits
- `"Sync failed"` - Error during vault synchronization
- Unnecessary local-to-volume sync operations that don't contribute to the vault data flow

## Root Causes

1. **Missing Git Defaults**: Environment variables `GIT_USER_NAME` and `GIT_USER_EMAIL` were required but not provided with defaults
2. **Bidirectional Sync Confusion**: The sync script was attempting both local→volume and volume→local syncs, when only volume→local is needed
3. **Conditional Git Config**: Git identity was only configured if environment variables were explicitly provided

## Solution Implemented

### 1. Git Configuration Defaults (apps/vaulty/src/vault-init.sh)

**Before:**

```bash
GIT_USER_NAME="${GIT_USER_NAME:-}"
GIT_USER_EMAIL="${GIT_USER_EMAIL:-}"

# Only configure if both provided
if [ -n "$GIT_USER_NAME" ] && [ -n "$GIT_USER_EMAIL" ]; then
  git -C /vault config user.name "$GIT_USER_NAME"
  git -C /vault config user.email "$GIT_USER_EMAIL"
  echo "✅ Git identity configured: $GIT_USER_NAME <$GIT_USER_EMAIL>"
else
  echo "⚠️ GIT_USER_NAME/GIT_USER_EMAIL not set; commits may fail"
fi
```

**After:**

```bash
GIT_USER_NAME="${GIT_USER_NAME:-Vault Bot}"
GIT_USER_EMAIL="${GIT_USER_EMAIL:-vault@local}"

# Always configure with defaults
git -C /vault config user.name "$GIT_USER_NAME"
git -C /vault config user.email "$GIT_USER_EMAIL"
echo "✅ Git identity configured: $GIT_USER_NAME <$GIT_USER_EMAIL>"
```

**Benefits:**

- Container always has valid git identity
- Commits never fail due to missing author
- Can override with environment variables if needed
- Defaults are sensible for local development

### 2. Removed Local-to-Volume Sync (apps/vaulty/src/git-sync.sh)

**Before:**

```bash
while true; do
  # Sync local to volume (unnecessary!)
  if [ -n "$LOCAL_VAULT_PATH" ] && [ -d "$LOCAL_VAULT_PATH" ]; then
    echo "📥 Syncing local path to vault volume..."
    podman run --rm -v "$LOCAL_VAULT_PATH":/src:Z -v "$VAULT_DATA_VOLUME":/dst:Z alpine sh -c "cp -a /src/. /dst/" 2>/dev/null || echo "⚠️ Local-to-volume sync failed"
  fi

  # ... git sync ...
  python3 /usr/local/bin/scripts/sync.py

  # Sync volume to local (correct direction)
  if [ -n "$LOCAL_VAULT_PATH" ]; then
    echo "📤 Syncing vault volume to local path..."
  fi
done
```

**After:**

```bash
while true; do
  # Diagnostic: show git status before sync
  if [ -d "$VAULT_PATH/.git" ]; then
    echo "--- pre-sync git status ($VAULT_PATH) ---"
    git -C "$VAULT_PATH" status --short --branch || true
  fi

  # ... git sync ...
  python3 /usr/local/bin/scripts/sync.py

  # Sync volume to local only
  if [ -n "$LOCAL_VAULT_PATH" ]; then
    echo "📤 Syncing vault volume to local path..."
    podman run --rm -v "$VAULT_DATA_VOLUME":/src:Z -v "$LOCAL_VAULT_PATH":/dst:Z alpine sh -c "cp -a /src/. /dst/" 2>/dev/null || echo "⚠️ Volume-to-local sync failed"
  fi
done
```

**Reasoning:**

- **Volume is source of truth**: Git commits happen in /vault volume only
- **No local→volume sync needed**: LocalVAULT_PATH is for output, not input
- **Unidirectional flow**: vault → github → vault → local (never local → vault)
- **Cleaner logs**: Fewer messages, clearer intent

### 3. Updated Tests

#### test: 'should validate LOCAL_VAULT_PATH on startup' (Updated)

- Changed from `[ -d "$LOCAL_VAULT_PATH" ]` to `[ ! -d "$LOCAL_VAULT_PATH" ]`
- Tests the negation logic for directory existence check

#### test: 'should validate LOCAL_VAULT_PATH is optional' (New)

- Verifies LOCAL_VAULT_PATH can be unset
- Confirms graceful fallback with "local-to-volume sync disabled" message

#### test: 'should sync volume to local if LOCAL_VAULT_PATH is set' (Updated)

- Removed expectation of local→volume sync
- Updated to reflect volume→local only
- Verifies proper conditional logic

#### test: 'should handle unidirectional sync' (Updated)

- Changed name from "bidirectional sync"
- Now asserts that local→volume sync is NOT present
- Confirms vault→github→local flow

#### test: 'should configure git identity with defaults' (Updated)

- Now expects default values: `Vault Bot` and `vault@local`
- Verifies git config always runs (not conditional)
- Tests environment variable override capability

## Verification Results

### Container Initialization Log

```
✅ Git identity configured: Vault Bot <vault@local>
🔄 Starting interval-based synchronization...
📁 Creating LOCAL_VAULT_PATH directory: /Users/darry/Desktop/DUMB/vault
✅ Directory created successfully: /Users/darry/Desktop/DUMB/vault
{"timestamp": "2025-12-19T01:10:12.971730", "level": "INFO", "message": "Git configuration validated"}
{"timestamp": "2025-12-19T01:10:13.029574", "level": "INFO", "message": "Committed"}
✅ Git sync succeeded at Fri Dec 19 01:10:13 UTC 2025
📤 Syncing vault volume to local path...
```

**Key Success Indicators:**

- ✅ Git identity configured with defaults
- ✅ Git configuration validated
- ✅ Changes committed successfully (no author errors)
- ✅ Sync succeeded
- ✅ No local→volume sync attempts
- ✅ Volume→local sync proceeds

### Test Results

```
36/36 tests passing
- All sync script tests updated
- All initialization tests updated
- All git configuration tests passing
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Vault Container                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │  /vault (Git Repository)                         │  │
│  │  - vault.json, vault-config.json, content/**      │  │
│  │  - .git/ (git history)                           │  │
│  │  - .vault-seeded (initialization marker)          │  │
│  └──────────────────────────────────────────────────┘  │
│           │                          │                  │
│           │ sync.py (interval)       │                  │
│           │ - git commit changes     │                  │
│           │ - git pull origin        │ (not used)       │
│           ▼                          ▼                  │
│  ┌──────────────────┐      ┌──────────────────────┐    │
│  │ GitHub Remote    │      │ LOCAL_VAULT_PATH     │    │
│  │ (https://...)    │      │ /Users/.../vault     │    │
│  └──────────────────┘      │ (read-only backup)   │    │
│                             └──────────────────────┘    │
│                                    ▲                    │
│                                    │                    │
│                        git-sync.sh volume→local         │
│                        (cp -a /vault/* /local/)         │
└─────────────────────────────────────────────────────────┘
```

## Impact Assessment

| Aspect               | Impact         | Notes                                  |
| -------------------- | -------------- | -------------------------------------- |
| **Git Commits**      | ✅ Fixed       | Now always have valid author           |
| **Sync Performance** | ✅ Improved    | Removed unnecessary local→volume copy  |
| **Initialization**   | ✅ Improved    | Container starts cleanly with defaults |
| **LOCAL_VAULT_PATH** | ✅ Working     | Still syncs volume→local for backup    |
| **Tests**            | ✅ All Passing | 36/36, updated to reflect new flow     |
| **Documentation**    | ✅ Updated     | This file explains new architecture    |

## Migration Notes

### For Users

- No breaking changes
- Can override defaults: `GIT_USER_NAME="My Name" GIT_USER_EMAIL="me@example.com"`
- LOCAL_VAULT_PATH still works for output (read-only backups)

### For Developers

- Git operations now guaranteed to work
- Cleaner commit messages with proper author
- More predictable sync behavior
- Simpler to troubleshoot (one-way data flow)

## Next Steps

- Monitor production containers for git-related issues (should be resolved)
- Consider implementing git signature verification if security is needed
- Plan for proper backup restoration if LOCAL_VAULT_PATH contains important data
