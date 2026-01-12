import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { VAULT_ROOT } from './index.js';
/**
 * Ensure git safe.directory is configured for /vault
 * This allows git operations on repos with different ownership
 */
function ensureGitSafeDirectory() {
  try {
    // Check if safe.directory is already configured to avoid duplicates
    try {
      const existing = execSync(
        `git config --global --get-all safe.directory`,
        {
          stdio: 'pipe',
          encoding: 'utf-8',
        }
      );
      if (!existing.includes(VAULT_ROOT)) {
        execSync(`git config --global --add safe.directory "${VAULT_ROOT}"`, {
          stdio: 'pipe',
        });
      }
    } catch {
      // Not configured yet, add it
      execSync(`git config --global --add safe.directory "${VAULT_ROOT}"`, {
        stdio: 'pipe',
      });
    }
    // Also configure git for cross-user access by using shared object database
    execSync(`git config --global core.sharedRepository group`, {
      stdio: 'pipe',
    });
  } catch {
    // Ignore errors, config may already be set
  }
}
/**
 * Stage a file for git commit
 * Handles both new/modified files and deleted files
 */
export function stageFile(relPath) {
  try {
    // Ensure safe.directory is set before git operations
    ensureGitSafeDirectory();
    const filePath = `${VAULT_ROOT}/${relPath}`;
    const fileExists = existsSync(filePath);
    if (fileExists) {
      // File exists: stage normally
      execSync(`git add "${relPath}"`, {
        cwd: VAULT_ROOT,
        stdio: 'pipe',
      });
    } else {
      // File deleted: use git rm
      try {
        execSync(`git rm "${relPath}"`, {
          cwd: VAULT_ROOT,
          stdio: 'pipe',
        });
      } catch {
        // If git rm fails, try just staging with git add (git 2.0+)
        execSync(`git add "${relPath}"`, {
          cwd: VAULT_ROOT,
          stdio: 'pipe',
        });
      }
    }
  } catch (err) {
    throw new Error(`Failed to stage file: ${err.message}`);
  }
}
/**
 * Commit staged changes to git
 */
export function commitChanges(options) {
  const { message, author = 'MCP Bot', email = 'mcp@vault.local' } = options;
  try {
    // Ensure safe.directory is set before git operations
    ensureGitSafeDirectory();
    // Ensure git config is set
    try {
      execSync(`git config user.name "${author}"`, {
        cwd: VAULT_ROOT,
        stdio: 'pipe',
      });
      execSync(`git config user.email "${email}"`, {
        cwd: VAULT_ROOT,
        stdio: 'pipe',
      });
    } catch {
      // Ignore config errors
    }
    // Commit the changes
    const result = execSync(`git commit -m "${message}"`, {
      cwd: VAULT_ROOT,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    return result.trim();
  } catch (err) {
    // No changes to commit is not an error
    if (err.message.includes('nothing to commit')) {
      return 'No changes to commit';
    }
    throw new Error(`Failed to commit changes: ${err.message}`);
  }
}
/**
 * Push commits to remote
 */
export function pushToRemote(branch = 'main') {
  try {
    // Ensure safe.directory is set before git operations
    ensureGitSafeDirectory();
    const result = execSync(`git push origin ${branch}`, {
      cwd: VAULT_ROOT,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    return result.trim();
  } catch (err) {
    throw new Error(`Failed to push to remote: ${err.message}`);
  }
}
/**
 * Perform a complete git operation: stage, commit, push
 * Resilient approach: continues with commit even if staging fails
 */
export function gitCommitAndPush(fileRelPath, commitMessage, options) {
  try {
    // Ensure safe.directory is set before git operations
    ensureGitSafeDirectory();
    // Attempt to stage all changes (including deletions, new files, etc)
    // But don't fail the entire operation if staging fails
    try {
      execSync(`git add -A`, {
        cwd: VAULT_ROOT,
        stdio: 'pipe',
      });
    } catch (stagingErr) {
      // Log warning but continue - might have something already staged
      console.warn('Warning: git add failed:', stagingErr.message);
      // Continue to commit anyway
    }
    // Commit - critical operation that must be attempted
    // This ensures git history is updated even if staging had issues
    let commit;
    try {
      commit = commitChanges({
        message: commitMessage,
        ...options,
      });
    } catch (commitErr) {
      // If commit fails, try with --allow-empty to at least record the intent
      try {
        commit = execSync(`git commit --allow-empty -m "${commitMessage}"`, {
          cwd: VAULT_ROOT,
          stdio: 'pipe',
          encoding: 'utf-8',
        }).trim();
      } catch {
        // If even allow-empty fails, throw the original error
        throw commitErr;
      }
    }
    // Push committed changes
    let push;
    try {
      push = pushToRemote();
    } catch (pushErr) {
      // Push failure is less critical - commit already happened
      console.warn('Warning: git push failed:', pushErr.message);
      push = `Push failed: ${pushErr.message}`;
    }
    return { commit, push };
  } catch (err) {
    throw new Error(`Git operation failed at commit stage: ${err.message}`);
  }
}
//# sourceMappingURL=gitOps.js.map
