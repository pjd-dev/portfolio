# Vault Write Lock System

## Overview

The write lock system prevents the sync process from running while MCP or other services are writing to the vault. This ensures data consistency and prevents race conditions between sync and write operations.

## How It Works

1. **Write Lock File**: A JSON file (`.write-lock`) acts as a marker that the vault is locked for writing
2. **Sync Detection**: The sync process checks for this lock before acquiring its own lock
3. **Wait Mechanism**: By default, sync waits for the write lock to be released with a configurable timeout
4. **Automatic Cleanup**: Stale locks are automatically removed after a configurable timeout

## Configuration

### Environment Variables

| Variable                    | Default              | Description                                                     |
| --------------------------- | -------------------- | --------------------------------------------------------------- |
| `WRITE_LOCK_FILE`           | `/vault/.write-lock` | Path to the write lock file                                     |
| `WRITE_LOCK_TIMEOUT`        | `60`                 | Time in seconds before a stale lock is considered expired       |
| `WAIT_FOR_WRITE_LOCK`       | `true`               | Whether to wait for write locks or skip sync                    |
| `WRITE_LOCK_CHECK_INTERVAL` | `2`                  | How often to check if write lock is released (seconds)          |
| `WRITE_LOCK_MAX_WAIT`       | `30`                 | Maximum time to wait for write lock before proceeding (seconds) |

### Example Configuration

```bash
# In your container environment or .env file:
WRITE_LOCK_TIMEOUT=60
WAIT_FOR_WRITE_LOCK=true
WRITE_LOCK_CHECK_INTERVAL=2
WRITE_LOCK_MAX_WAIT=30
```

## Usage in MCP Operations

### Method 1: Using the Helper Script

```bash
#!/bin/bash
source /path/to/write-lock-helper.sh

# Before performing vault writes
acquire_write_lock $$ "MCP: template generation"
trap 'release_write_lock' EXIT  # Ensure release on exit

# Perform your write operations
# The sync process will wait while this lock is active
your_operation_that_writes_to_vault()

# Lock automatically released on script exit via trap
```

### Method 2: Manual Lock Management

```bash
# Acquire lock
cat > /vault/.write-lock <<EOF
{
  "pid": $$,
  "operation": "MCP: custom operation",
  "acquired_at": "$(date -u +'%Y-%m-%dT%H:%M:%SZ')",
  "hostname": "$(hostname)",
  "user": "$(whoami)"
}
EOF

# Perform vault write operations
# ... your operations ...

# Release lock
rm -f /vault/.write-lock
```

### Method 3: Python Integration

```python
import json
import os
from pathlib import Path
from datetime import datetime

VAULT_PATH = os.getenv("VAULT_PATH", "/vault")
WRITE_LOCK_FILE = os.path.join(VAULT_PATH, ".write-lock")

def acquire_write_lock(operation):
    """Acquire write lock for vault operations"""
    lock_data = {
        "pid": os.getpid(),
        "operation": operation,
        "acquired_at": datetime.utcnow().isoformat() + "Z",
        "hostname": os.uname().nodename,
        "user": os.getenv("USER", "unknown")
    }
    with open(WRITE_LOCK_FILE, "w") as f:
        json.dump(lock_data, f, indent=2)
    print(f"Write lock acquired: {WRITE_LOCK_FILE}")

def release_write_lock():
    """Release write lock"""
    if os.path.exists(WRITE_LOCK_FILE):
        os.remove(WRITE_LOCK_FILE)
        print("Write lock released")

# Usage
try:
    acquire_write_lock("MCP: generate embeddings")
    # Perform vault write operations
    # ... your code ...
finally:
    release_write_lock()
```

## Sync Behavior with Write Locks

### When Write Lock is Active

1. **WAIT_FOR_WRITE_LOCK=true** (Default):
   - Sync waits up to `WRITE_LOCK_MAX_WAIT` seconds (default 30s)
   - Logs "Waiting for write lock to be released"
   - Proceeds if timeout is reached
   - Continues normal sync after lock is released

2. **WAIT_FOR_WRITE_LOCK=false**:
   - Sync immediately skips if write lock exists
   - Logs "Skipping sync due to active write lock"
   - Returns with status code 0 (no error)
   - Retries on next sync cycle

### Stale Lock Handling

- Locks older than `WRITE_LOCK_TIMEOUT` (default 60s) are automatically removed
- Prevents deadlocks from crashed processes
- Logs warning when removing stale locks

## Lock File Format

The `.write-lock` file is JSON with metadata about the write operation:

```json
{
  "pid": 12345,
  "operation": "MCP: template generation",
  "acquired_at": "2025-12-19T05:30:45Z",
  "hostname": "vault-container",
  "user": "app"
}
```

## Best Practices

1. **Always Release**: Use try-finally or trap to ensure locks are released

   ```bash
   trap 'release_write_lock' EXIT
   ```

2. **Short Operations**: Keep write operations as short as possible
   - Aim for < 5 seconds
   - Default max wait is 30 seconds

3. **Meaningful Operation Names**: Include context in operation name

   ```
   "MCP: template generation for project X"
   "LLM-Adapter: response caching"
   "Auth: token refresh"
   ```

4. **Monitor Lock Files**: Check for locks in stuck operations

   ```bash
   # Check current write lock
   cat /vault/.write-lock

   # List all lock files
   ls -la /vault/.write-lock /tmp/.write-lock 2>/dev/null || echo "No locks found"
   ```

5. **Logging**: The sync process logs all write lock interactions
   ```
   "Waiting for write lock to be released"
   "Write lock detected, but WAIT_FOR_WRITE_LOCK is disabled"
   "Removing stale write lock file"
   ```

## Troubleshooting

### Sync is Waiting Too Long

**Problem**: Sync process is stuck waiting for a write lock

**Solution**:

1. Check the lock file:

   ```bash
   cat /vault/.write-lock
   ```

2. If the operation is stuck, kill the process:

   ```bash
   kill -9 <pid_from_lock_file>
   ```

3. Remove the stale lock:
   ```bash
   rm -f /vault/.write-lock
   ```

### Lock Timeout Too Short

**Problem**: Legitimate operations timeout before completing

**Solution**:
Increase timeout values:

```bash
# Allow longer write operations
WRITE_LOCK_MAX_WAIT=60  # Wait up to 60 seconds
WRITE_LOCK_TIMEOUT=120  # Stale lock threshold: 2 minutes
```

### Sync Never Acquires Lock

**Problem**: Sync keeps waiting for write lock that never completes

**Solution**:

1. Check if there's a stale lock:

   ```bash
   stat /vault/.write-lock | grep Modify
   ```

2. If older than `WRITE_LOCK_TIMEOUT`, remove it manually

3. Or disable waiting:
   ```bash
   WAIT_FOR_WRITE_LOCK=false
   ```

## Integration with MCP

When using MCP operations that write to the vault:

1. **Add to MCP Container Initialization**:

   ```dockerfile
   RUN chmod +x /path/to/write-lock-helper.sh
   ```

2. **Before Each Write Operation**:

   ```bash
   source write-lock-helper.sh
   acquire_write_lock $$ "MCP: <operation>"
   trap 'release_write_lock' EXIT
   ```

3. **Example MCP Integration**:

   ```python
   # In your MCP handler
   import subprocess
   import json

   def write_to_vault_safely(operation_name, data):
       # Acquire lock
       subprocess.run([
           "bash", "-c",
           f'source write-lock-helper.sh && acquire_write_lock $$ "{operation_name}"'
       ])

       try:
           # Write operation
           with open("/vault/data.json", "w") as f:
               json.dump(data, f)
       finally:
           # Release lock
           subprocess.run(["bash", "-c", 'source write-lock-helper.sh && release_write_lock'])
   ```

## Monitoring

### Check Write Lock Status

```bash
# Manual check
./write-lock-helper.sh check

# Watch for changes
watch -n 1 "cat /vault/.write-lock 2>/dev/null || echo 'No lock'"

# Check logs
podman logs <container> | grep "write lock"
```

### Performance Impact

- Lock checking: < 1ms per sync cycle
- Waiting overhead: Minimal (2-second check interval)
- No impact when no locks exist

## See Also

- [Sync Process Documentation](PIPELINE_ENGINE.md)
- [MCP Integration Guide](../mcp/README.md)
- [Container Configuration](../Dockerfile)
