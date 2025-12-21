/**
 * @vault/cod
 *
 * COD (Canonical Operation Description) validator framework
 *
 * Pure, deterministic validation for tasks and sessions.
 * No I/O, no external dependencies, no side effects.
 * Designed for reuse in MCP adapters and tests.
 *
 * Spec: Projects/COD/05-Validation-Spec.md
 */

export { CODValidator } from './validator/core.js';
export * from './validator/types.js';
