/**
 * COD Validator Types
 *
 * Domain model for deterministic validation.
 * All types are pure data structures (no methods, no side effects).
 *
 * Canonical Reference: doc/COD_VALIDATION_SPEC.md
 */

import type { CodProfile } from '../profile.js';

/** Validation verdict state (spec-mandated three states) */
export type ValidationState = 'PASS' | 'WARN' | 'FAIL';

/** Issue severity level */
export type IssueSeverity = 'error' | 'warning' | 'info';

/** Reason code for FAIL verdict */
export type FailReasonCode =
  | 'MISSING_REQUIRED_FIELD'
  | 'INVALID_ENUM_VALUE'
  | 'VALUE_OUT_OF_BOUNDS'
  | 'DEPENDENCY_CYCLE'
  | 'MISSING_DEPENDENCY'
  | 'BLOCKED_BY_BLOCKER'
  | 'INVALID_STATUS_TRANSITION'
  | 'INVALID_GOAL_REFERENCE'
  | 'HIGH_RISK_CONFIGURATION'
  | 'HARD_STOP_ACTIVE';

/** Single validation issue with diagnostics */
export interface ValidationIssue {
  code: FailReasonCode;
  severity: IssueSeverity;
  message: string;
  field?: string;
  value?: unknown;
  suggestion?: string;
}

/** Task state (normalized before COD validation) */
export interface TaskState {
  // Required fields
  id: string;
  title: string;
  status:
    | 'backlog'
    | 'todo'
    | 'in-progress'
    | 'in_progress'
    | 'completed'
    | 'blocked'
    | 'done'
    | 'dropped'; // 'done' is alias for 'completed', 'in_progress' alias for 'in-progress'
  priority?: number; // 0-10 (optional for compatibility)
  goal?: string | null; // goal ID reference

  // Optional fields
  effort?: number; // 0-10
  focusCost?: number; // 0-10
  effortScore?: number;
  estimatedTimeMin?: number;
  dependsOn?: string[]; // task IDs
  blockedBy?: string[]; // blocker IDs
  tags?: string[];
  dueDate?: string; // ISO 8601
  scheduledDate?: string; // ISO 8601
  completedAt?: string; // ISO 8601

  // Metadata (passed through without validation)
  [key: string]: unknown;
}

/** Session state (normalized before validation) */
export interface SessionState {
  id: string;
  duration: number; // minutes
  taskIds: string[]; // task IDs in session
  totalEffort: number;
  totalReward: number;
  focusCost: number;

  [key: string]: unknown;
}

/** Validation result with verdict and diagnostics */
export interface ValidationResult {
  state: ValidationState;
  valid: boolean; // true if state === 'PASS'
  issues: ValidationIssue[];
  summary: {
    total: number;
    errors: number;
    warnings: number;
  };

  // Compatibility aliases for MCP tools
  status?: ValidationState; // alias for state
  reason?: string; // first error message if any
  warnings?: string[]; // error messages for warnings
}

/** Validator options (runtime behavior) */
export interface ValidatorOptions {
  strict?: boolean; // treat WARN as FAIL
  maxIssues?: number; // stop collecting after N
  skipChecks?: string[]; // skip specific rule codes
  profile?: CodProfile; // runtime profile (default: basic)
}
