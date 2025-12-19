# Git Pull --autostash Enhancement

**Date**: December 18, 2025  
**Issue**: Pull failures when uncommitted changes exist during rebase  
**Solution**: Enhanced `git pull --rebase` with `--autostash` flag  
**Status**: ✅ IMPLEMENTED

---

## Problem

When the vaulty sync script attempts to pull changes from the remote, it may fail if:

1. There are uncommitted changes in the working directory
2. The rebase process needs to move working directory changes
3. The stash and unstash process has edge cases

The previous implementation relied on manual stashing before pull, but this could fail in certain scenarios.

---

## Solution

Enhanced the git pull command in [apps/vaulty/src/scripts/sync.py](../apps/vaulty/src/scripts/sync.py) to use `--autostash`:

**Before** (Line 615):

```python
run_git(["git", "pull", "--rebase", GIT_REMOTE, GIT_BRANCH])
```

**After** (Line 620):

```python
# Use --rebase with --autostash for cleaner history and automatic stash handling
run_git(["git", "pull", "--rebase", "--autostash", GIT_REMOTE, GIT_BRANCH])
```

### What `--autostash` Does

The `--autostash` flag (Git 2.37+) automatically:

1. Stashes any uncommitted changes before rebasing
2. Applies them back after the rebase completes
3. Handles stash conflicts gracefully
4. Prevents rebase failures due to dirty working directory

This is equivalent to:

```bash
git stash
git pull --rebase <remote> <branch>
git stash pop
```

But with better error handling and conflict resolution.

---

## Key Benefits

| Benefit                        | Impact                                      |
| ------------------------------ | ------------------------------------------- |
| **Automatic stash management** | No need for separate stash/unstash calls    |
| **Cleaner git history**        | Rebase happens with clean state             |
| **Better conflict handling**   | Git handles stash conflicts more gracefully |
| **Fewer pull failures**        | Reduces edge cases where stashing fails     |
| **Modern git practice**        | Follows current Git best practices          |

---

## Requirements

- Git 2.37+ (released July 2022)
- Alpine 3.20 (used in vaulty Dockerfile) includes Git ≥ 2.41

The Alpine base image in the Dockerfile already includes a compatible Git version.

---

## Integration with Existing Code

The sync script already has multiple safety measures:

1. **Stash uncommitted changes** (line 958):

   ```python
   stash_uncommitted_changes()
   ```

   This provides a fallback for older Git versions.

2. **Rebase recovery** (line 962):

   ```python
   if rebase_in_progress():
       abort_rebase()
   ```

   This handles interrupted rebases.

3. **Merge conflict detection** (line 974):
   ```python
   check_merge_conflicts()
   ```
   This detects and reports any conflicts after pull.

The `--autostash` flag complements these measures and makes the process more robust.

---

## Testing

### Before Deployment

1. Verify Git version in container: `git --version`
2. Test with uncommitted changes in vault directory
3. Verify rebase completes successfully
4. Check that stashed changes are reapplied

### After Deployment

1. Monitor sync logs for "Pull successful" messages
2. Check for any stash conflict warnings
3. Verify that rebases complete cleanly
4. Monitor git status file for health

---

## Potential Issues & Mitigations

| Issue                            | Mitigation                                      |
| -------------------------------- | ----------------------------------------------- |
| Stash conflicts during autostash | Manual intervention required (logged in errors) |
| Git version < 2.37               | Fallback to manual stash still works            |
| Large uncommitted changes        | AUTO_STASH setting controls this behavior       |
| Merge conflicts during rebase    | check_merge_conflicts() will detect and report  |

---

## Code Location

- **File**: [apps/vaulty/src/scripts/sync.py](../apps/vaulty/src/scripts/sync.py)
- **Function**: `pull()` (line 585)
- **Change**: Line 620 - Added `--autostash` flag
- **Context**: Git pull with exponential backoff retry logic

---

## Related Configuration

### Environment Variables

```bash
# Control stashing behavior (still works with --autostash)
AUTO_STASH=true|false   # Default: true

# Control rebase retry behavior
MAX_RETRIES=3           # Default: 3
RETRY_DELAY=5           # Default: 5 seconds (with exponential backoff)
```

### How They Interact

1. `AUTO_STASH=true` enables manual stashing before sync
2. `git pull --rebase --autostash` provides automatic stashing during pull
3. If `--autostash` fails, retry logic kicks in with exponential backoff
4. Manual stash is still attempted if pull fails

---

## Deployment Steps

1. ✅ Code change applied to sync.py
2. 🔨 Rebuild container: `podman build -t localhost/vault:latest -f apps/vaulty/Dockerfile apps/vaulty`
3. 🔄 Restart vaulty container with new image
4. 📊 Monitor logs for pull operations
5. ✨ Verify sync continues successfully

---

## Rollback (if needed)

If issues occur, revert to the previous version:

```bash
# Remove --autostash flag
git pull --rebase GIT_REMOTE GIT_BRANCH
```

However, this is not recommended as `--autostash` is more robust than manual stashing.

---

## Git Version Compatibility

| Git Version | Support    | Notes                                      |
| ----------- | ---------- | ------------------------------------------ |
| < 2.37      | ⚠️ Partial | `--autostash` not supported, uses fallback |
| ≥ 2.37      | ✅ Full    | All features supported                     |
| ≥ 2.41      | ✅ Full    | Alpine 3.20 default                        |

---

## References

- [Git pull --autostash documentation](https://git-scm.com/docs/git-pull)
- [Git rebase --autostash](https://git-scm.com/docs/git-rebase)
- [Git 2.37 release notes](https://github.com/git/git/blob/master/Documentation/RelNotes/2.37.0.txt)

---

## Summary

The vaulty sync script now uses `git pull --rebase --autostash` for more robust pull operations with automatic uncommitted change handling. This reduces pull failures and provides a cleaner git history.

**Status**: ✅ Ready for deployment
