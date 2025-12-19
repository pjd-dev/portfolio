# Write Lock Quick Reference

## What Is It?

A file-based locking mechanism that prevents vault sync while MCP or other services write to the vault.

## Files Created

| File                                           | Purpose                        |
| ---------------------------------------------- | ------------------------------ |
| `apps/vaulty/src/scripts/write-lock-helper.sh` | Bash helper for managing locks |
| `doc/WRITE_LOCK_SYSTEM.md`                     | Complete system documentation  |
| `doc/WRITE_LOCK_IMPLEMENTATION.md`             | Implementation details         |

## Files Modified

| File                              | Changes                                    |
| --------------------------------- | ------------------------------------------ |
| `apps/vaulty/src/scripts/sync.py` | Added write lock functions and integration |

## Quick Start - For MCP Operations

### Bash

```bash
#!/bin/bash
source /path/to/write-lock-helper.sh

# Acquire lock
acquire_write_lock $$ "MCP: my operation"
trap 'release_write_lock' EXIT  # Auto-release on exit

# Write to vault safely
echo "data" > /vault/myfile.txt
# Lock auto-released when script exits
```

### Python

```python
import os
import json
from pathlib import Path

VAULT_PATH = os.getenv("VAULT_PATH", "/vault")

# Acquire
with open(f"{VAULT_PATH}/.write-lock", "w") as f:
    json.dump({"pid": os.getpid(), "operation": "My Op"}, f)

try:
    # Write to vault
    pass
finally:
    # Release
    os.remove(f"{VAULT_PATH}/.write-lock")
```

## Environment Variables

```bash
WRITE_LOCK_TIMEOUT=60           # Stale lock age (seconds)
WAIT_FOR_WRITE_LOCK=true        # Wait for locks (default)
WRITE_LOCK_CHECK_INTERVAL=2     # Check frequency (seconds)
WRITE_LOCK_MAX_WAIT=30          # Max wait time (seconds)
```

## Helper Script Commands

```bash
# Acquire lock
./write-lock-helper.sh acquire "Operation name"

# Release lock
./write-lock-helper.sh release

# Check if locked
./write-lock-helper.sh check

# Wait for lock to release (timeout in seconds)
./write-lock-helper.sh wait 30
```

## How Sync Behaves

### Default: WAIT_FOR_WRITE_LOCK=true

```
1. Sync checks for .write-lock file
2. If exists: Waits up to 30 seconds (configurable)
3. Log: "Waiting for write lock to be released"
4. After timeout or lock release: Continues sync
```

### Alternative: WAIT_FOR_WRITE_LOCK=false

```
1. Sync checks for .write-lock file
2. If exists: Skips sync, returns early
3. Log: "Skipping sync due to active write lock"
4. Retries on next sync cycle
```

## Stale Lock Cleanup

- Locks older than 60 seconds (configurable) auto-removed
- Prevents deadlocks from crashed processes
- Logged with warning

## Lock File Location

**Primary**: `/vault/.write-lock`
**Fallback**: Can use `/tmp/.write-lock` if vault not writable

## Lock File Format

```json
{
  "pid": 12345,
  "operation": "MCP: template generation",
  "acquired_at": "2025-12-19T05:30:45Z",
  "hostname": "vault-container",
  "user": "app"
}
```

## Testing the Lock

```bash
# Check current lock status
cat /vault/.write-lock

# Test acquiring lock
source write-lock-helper.sh
acquire_write_lock $$ "Test"
cat /vault/.write-lock
release_write_lock
test -f /vault/.write-lock || echo "✓ Lock released"
```

## Troubleshooting

### Sync Waiting Too Long?

```bash
# Check the lock
cat /vault/.write-lock

# If it's stale, remove it
rm /vault/.write-lock
```

### Sync Always Skipping?

```bash
# Check if WAIT_FOR_WRITE_LOCK is false
echo $WAIT_FOR_WRITE_LOCK

# Set to true to enable waiting
export WAIT_FOR_WRITE_LOCK=true
```

### Lock Never Released?

```bash
# Check process is still running
ps -p <pid_from_lock_file>

# If stuck, kill it and remove lock
kill -9 <pid>
rm /vault/.write-lock
```

## Configuration Examples

### Fast Operations (< 5 seconds)

```bash
WRITE_LOCK_MAX_WAIT=10
WRITE_LOCK_CHECK_INTERVAL=1
```

### Slow Operations (up to 2 minutes)

```bash
WRITE_LOCK_MAX_WAIT=120
WRITE_LOCK_TIMEOUT=180
WRITE_LOCK_CHECK_INTERVAL=5
```

### Disable Waiting (Skip if Locked)

```bash
WAIT_FOR_WRITE_LOCK=false
```

## Performance

- Lock checking: < 1ms per sync cycle
- Waiting interval: Configurable (default 2 seconds)
- No overhead when no locks exist
- Memory usage: Negligible

## Integration Checklist

- [ ] Copy `write-lock-helper.sh` to MCP container
- [ ] Source helper before vault write operations
- [ ] Acquire lock with meaningful operation name
- [ ] Use trap/finally to ensure release
- [ ] Test lock acquire/release cycle
- [ ] Monitor logs for lock messages
- [ ] Set WRITE_LOCK_TIMEOUT appropriately
- [ ] Document operation names used

## See Full Documentation

- [WRITE_LOCK_SYSTEM.md](WRITE_LOCK_SYSTEM.md) - Complete guide
- [WRITE_LOCK_IMPLEMENTATION.md](WRITE_LOCK_IMPLEMENTATION.md) - Implementation details
