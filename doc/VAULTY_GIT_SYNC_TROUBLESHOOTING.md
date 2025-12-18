# Vaulty Git Sync Issue - Root Cause & Fix

## Problem Found

**Status**: 🔴 **CRITICAL - Git Repository Corrupted**

### Issues Discovered

1. **Missing Git Remote** ❌
   - `.git` directory existed but had no `origin` remote configured
   - Vaulty couldn't push because there was nowhere to push to
   - Error message: "Network error: Remote not accessible"

2. **Corrupted Git Database** 🔴
   - Pack files corrupted (`.git/objects/pack/*.idx`)
   - Empty object files detected
   - `git fsck --full` shows 100+ corrupt objects
   - Likely caused by interrupted clone or disk I/O issue

3. **Root Cause**
   - Vault was initialized locally but never properly synced with GitHub repo
   - Git sync script ran but couldn't push (missing remote)
   - Multiple sync attempts may have corrupted the database

---

## Solution

### Option 1: Quick Fix (Recommended)

Reset vaulty container with fresh clone:

```bash
# Stop container
podman stop vaulty

# Remove corrupted data
podman volume rm vault

# Restart (will re-clone from GitHub)
pnpm vault:services:start
```

### Option 2: Manual Repair

If you want to keep the vault files but fix git:

```bash
# Inside container:
cd /vault

# Back up the vault files (excluding .git)
mkdir -p /tmp/vault-backup
cp -r --exclude=.git . /tmp/vault-backup/

# Remove corrupted git repo
rm -rf /vault/.git

# Re-initialize from remote
git clone https://pjd-dev:${GIT_TOKEN}@github.com/pjd-dev/obsidianVault.git /vault-clean
mv /vault/.obsidian /tmp/vault-backup/  # Preserve Obsidian config if needed
cd /vault && git init && git remote add origin <URL>
git add . && git commit -m "restore from backup"
```

### Option 3: Full Clean Sync

```bash
# Restart vaulty container completely
pnpm vault:services:stop
pnpm vault:services:start

# Verify sync is working
podman exec vaulty cat /vault/.sync-status.json
```

---

## What I Fixed

**Temporary fix applied**: Added missing git remote to vaulty container:

```bash
git remote add origin "https://pjd-dev:${GIT_TOKEN}@github.com/pjd-dev/obsidianVault.git"
```

**Status After Fix**:

- ✅ Remote is now configured
- ✅ Remote is reachable (verified with `git ls-remote`)
- ❌ Still cannot commit (corrupted database)

---

## Next Steps

1. **Recommended**: Use Option 1 (Quick Fix) - restart vaulty with fresh clone
2. **Monitor**: After restart, check `.sync-status.json` for "healthy" status
3. **Verify**: Run `git log` inside container to confirm syncing works

---

## Prevention for Future

✅ **SCRIPT PATCHED** - `vault-init.sh` now includes:

```bash
# Ensure remote is configured even if .git already exists
if [ -n "$VAULT_REPO_URL" ]; then
  if ! git -C /vault remote get-url origin >/dev/null 2>&1; then
    echo "⚠️  Git remote not configured, adding origin..."
    git -C /vault remote add origin "$VAULT_REPO_URL"
  fi
fi

# Validate git database integrity
if ! git -C /vault fsck --full >/dev/null 2>&1; then
  echo "⚠️  Git database corruption detected, attempting repair..."
  git -C /vault prune && git -C /vault repack -Ad
fi
```

**Changes Made**:

1. ✅ Now configures remote even if `.git` already exists (fixes missing remote issue)
2. ✅ Validates git database on startup (detects corruption early)
3. ✅ Attempts automatic repair (prune + repack)
4. ✅ Clear error messages for debugging

---

**Date**: December 18, 2025  
**Container**: vaulty (ID: 41822bc22c1a)  
**Vault Path**: /vault
