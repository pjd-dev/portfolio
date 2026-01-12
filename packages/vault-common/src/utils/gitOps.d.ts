/**
 * Git operations for vault changes
 * Allows MCP to directly commit changes to git instead of relying on sync daemon
 */
export interface GitCommitOptions {
  message: string;
  author?: string;
  email?: string;
}
/**
 * Stage a file for git commit
 * Handles both new/modified files and deleted files
 */
export declare function stageFile(relPath: string): void;
/**
 * Commit staged changes to git
 */
export declare function commitChanges(options: GitCommitOptions): string;
/**
 * Push commits to remote
 */
export declare function pushToRemote(branch?: string): string;
/**
 * Perform a complete git operation: stage, commit, push
 * Resilient approach: continues with commit even if staging fails
 */
export declare function gitCommitAndPush(
  fileRelPath: string,
  commitMessage: string,
  options?: Partial<GitCommitOptions>
): {
  commit: string;
  push: string;
};
//# sourceMappingURL=gitOps.d.ts.map
