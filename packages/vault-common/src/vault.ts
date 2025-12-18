/**
 * Vault configuration and root path utilities
 */

import dotenv from 'dotenv';
import * as z from 'zod';
import path from 'node:path';

// Only load .env when VAULT_PATH is not already set by the environment.
// This prevents a copied .env (from the repo root) from overriding
// container/runtime environment variables such as VAULT_PATH.
if (!process.env.VAULT_PATH) {
  dotenv.config();
}

const envSchema = z.object({
  VAULT_PATH: z.string().min(1, 'VAULT_PATH is required. Set it in your .env'),
});

const env = envSchema.parse(process.env);

/**
 * The root path of the vault directory
 */
export const VAULT_ROOT = path.resolve(env.VAULT_PATH);

/**
 * Get the full path for a relative note path
 * @param relativePath - The relative path from VAULT_ROOT
 * @returns The absolute path
 */
export function getNotePath(relativePath: string): string {
  return path.join(VAULT_ROOT, relativePath);
}

/**
 * Check if a path is within the vault
 * @param filePath - The file path to check
 * @returns true if the path is within the vault
 */
export function isWithinVault(filePath: string): boolean {
  const resolved = path.resolve(filePath);
  const relative = path.relative(VAULT_ROOT, resolved);
  return !relative.startsWith('..');
}

/**
 * Get the relative path from VAULT_ROOT
 * @param filePath - The absolute file path
 * @returns The relative path from VAULT_ROOT
 */
export function getRelativePath(filePath: string): string {
  return path.relative(VAULT_ROOT, path.resolve(filePath));
}
