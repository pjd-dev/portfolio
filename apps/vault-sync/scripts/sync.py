#!/usr/bin/env python3
"""
Enhanced Vault Sync Script with Git integration
Features:
- Merge conflict detection and reporting
- Better error handling with retry logic
- Event-based triggers
- Detailed logging
"""

import os
import sys
import subprocess
import json
import time
from datetime import datetime
from pathlib import Path

VAULT_PATH = os.getenv("VAULT_PATH", "/vault")
GIT_REMOTE = os.getenv("GIT_REMOTE", "origin")
GIT_BRANCH = os.getenv("GIT_BRANCH", "main")
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))
RETRY_DELAY = int(os.getenv("RETRY_DELAY", "5"))


class SyncError(Exception):
    """Custom exception for sync errors"""

    pass


class MergeConflictError(SyncError):
    """Exception for merge conflicts"""

    pass


def log(level, message):
    """Structured logging"""
    timestamp = datetime.now().isoformat()
    log_entry = {"timestamp": timestamp, "level": level, "message": message}
    print(json.dumps(log_entry))


def run_git_command(cmd, cwd=VAULT_PATH, check=True):
    """Run git command with error handling"""
    try:
        result = subprocess.run(
            cmd, cwd=cwd, capture_output=True, text=True, check=check
        )
        return result.stdout.strip(), result.stderr.strip(), result.returncode
    except subprocess.CalledProcessError as e:
        raise SyncError(f"Git command failed: {e.stderr}")


def check_merge_conflicts():
    """Detect merge conflicts"""
    stdout, _, _ = run_git_command(["git", "diff", "--name-only", "--diff-filter=U"])
    if stdout:
        conflicts = stdout.split("\n")
        log("ERROR", f"Merge conflicts detected in: {conflicts}")
        raise MergeConflictError(f"Conflicts in files: {', '.join(conflicts)}")
    return []


def get_git_status():
    """Get detailed git status"""
    stdout, _, _ = run_git_command(["git", "status", "--porcelain"])
    changes = []
    for line in stdout.split("\n"):
        if line:
            status = line[:2]
            file_path = line[3:]
            changes.append({"status": status, "file": file_path})
    return changes


def pull_with_retry(max_retries=MAX_RETRIES):
    """Pull with retry logic and conflict detection"""
    for attempt in range(max_retries):
        try:
            log("INFO", f"Pull attempt {attempt + 1}/{max_retries}")

            # Fetch first
            stdout, stderr, code = run_git_command(
                ["git", "fetch", GIT_REMOTE, GIT_BRANCH]
            )
            if code != 0:
                raise SyncError(f"Fetch failed: {stderr}")

            # Check for divergence
            stdout, _, _ = run_git_command(
                [
                    "git",
                    "rev-list",
                    "--left-right",
                    "--count",
                    f"HEAD...{GIT_REMOTE}/{GIT_BRANCH}",
                ]
            )
            ahead, behind = map(int, stdout.split())

            log("INFO", f"Repository status: {ahead} ahead, {behind} behind")

            if behind == 0:
                log("INFO", "Already up to date")
                return True

            # Pull with rebase
            stdout, stderr, code = run_git_command(
                ["git", "pull", "--rebase", GIT_REMOTE, GIT_BRANCH], check=False
            )

            if code != 0:
                # Check for conflicts
                if "CONFLICT" in stderr or "conflict" in stderr.lower():
                    check_merge_conflicts()
                raise SyncError(f"Pull failed: {stderr}")

            log("INFO", "Pull successful")
            return True

        except MergeConflictError:
            raise
        except SyncError as e:
            log("WARNING", f"Pull attempt {attempt + 1} failed: {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(RETRY_DELAY)
            else:
                raise

    return False


def push_with_retry(max_retries=MAX_RETRIES):
    """Push with retry logic"""
    for attempt in range(max_retries):
        try:
            log("INFO", f"Push attempt {attempt + 1}/{max_retries}")

            stdout, stderr, code = run_git_command(
                ["git", "push", GIT_REMOTE, GIT_BRANCH], check=False
            )

            if code != 0:
                # Check if rejected due to non-fast-forward
                if "rejected" in stderr or "non-fast-forward" in stderr:
                    log("WARNING", "Push rejected, pulling first...")
                    pull_with_retry()
                    continue
                raise SyncError(f"Push failed: {stderr}")

            log("INFO", "Push successful")
            return True

        except SyncError as e:
            log("WARNING", f"Push attempt {attempt + 1} failed: {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(RETRY_DELAY)
            else:
                raise

    return False


def commit_changes():
    """Commit all changes"""
    changes = get_git_status()

    if not changes:
        log("INFO", "No changes to commit")
        return False

    log("INFO", f"Committing {len(changes)} changes")

    # Stage all changes
    run_git_command(["git", "add", "-A"])

    # Commit
    commit_msg = f"Auto-sync: {len(changes)} changes at {datetime.now().isoformat()}"
    run_git_command(["git", "commit", "-m", commit_msg])

    log("INFO", f"Committed: {commit_msg}")
    return True


def sync_vault():
    """Main sync function"""
    log("INFO", "Starting vault sync")

    try:
        # Check if git repo exists
        if not os.path.exists(os.path.join(VAULT_PATH, ".git")):
            log("ERROR", "Not a git repository")
            sys.exit(1)

        # Pull latest changes
        pull_with_retry()

        # Commit local changes
        has_changes = commit_changes()

        # Push if there were changes
        if has_changes:
            push_with_retry()

        log("INFO", "Vault sync completed successfully")
        return 0

    except MergeConflictError as e:
        log("ERROR", f"Merge conflict: {str(e)}")
        log("ERROR", "Manual intervention required")
        return 2

    except SyncError as e:
        log("ERROR", f"Sync failed: {str(e)}")
        return 1

    except Exception as e:
        log("ERROR", f"Unexpected error: {str(e)}")
        return 1


if __name__ == "__main__":
    sys.exit(sync_vault())
