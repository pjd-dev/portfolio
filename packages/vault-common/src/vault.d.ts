/**
 * Vault configuration and root path utilities
 */
/**
 * The root path of the vault directory
 */
export declare const VAULT_ROOT: string;
/**
 * Get the full path for a relative note path
 * @param relativePath - The relative path from VAULT_ROOT
 * @returns The absolute path
 */
export declare function getNotePath(relativePath: string): string;
/**
 * Check if a path is within the vault
 * @param filePath - The file path to check
 * @returns true if the path is within the vault
 */
export declare function isWithinVault(filePath: string): boolean;
/**
 * Get the relative path from VAULT_ROOT
 * @param filePath - The absolute file path
 * @returns The relative path from VAULT_ROOT
 */
export declare function getRelativePath(filePath: string): string;
//# sourceMappingURL=vault.d.ts.map
