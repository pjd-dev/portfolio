/**
 * @vault/cod
 *
 * COD (Cognitive Organizer & Operator) core library.
 *
 * Deterministic validation for tasks/sessions plus shared effort/cost helpers.
 * Pure utilities only: no I/O, no external dependencies, no side effects.
 * Designed for reuse in MCP adapters and tests.
 *
 * Spec: doc/COD_VALIDATION_SPEC.md
 */

export { CODValidator } from './validator/core.js';
export * from './validator/types.js';
export {
  EFFORT_UNIT_MIN,
  computeTaskEffortScore,
  computeTaskCostMin,
} from './runtime.js';

export * from './goals.js';
export * from './human-state.js';
export * from './time-sensitivity.js';
