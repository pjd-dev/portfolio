/**
 * Core Vault types and interfaces
 */

export interface VaultConfig {
  rootPath: string;
  syncEnabled: boolean;
  autoCommit: boolean;
  gitRemote?: string;
}

export interface VaultFile {
  path: string;
  content: string;
  frontmatter?: Record<string, any>;
  lastModified?: number;
  created?: number;
}

export interface VaultDirectory {
  path: string;
  files: VaultFile[];
  subdirectories: VaultDirectory[];
}

export interface VaultMetadata {
  version: string;
  lastSync?: number;
  commitHash?: string;
  fileCount: number;
  directoryCount: number;
}

export interface VaultEntry {
  id: string;
  path: string;
  type: 'file' | 'directory';
  created: number;
  modified: number;
  size?: number;
}
