/**
 * COD Validator Core
 *
 * Pure, deterministic validation engine.
 * - No external dependencies (pure functions only)
 * - No I/O, vault access, or MCP calls
 * - Same input → same output (determinism)
 * - Reusable by MCP adapters and tests
 *
 * Canonical Reference: doc/COD_VALIDATION_SPEC.md
 */

import {
  ValidationState,
  ValidationResult,
  ValidationIssue,
  TaskState,
  SessionState,
  ValidatorOptions,
  FailReasonCode,
} from './types.js';

/**
 * COD Validator
 *
 * Entrypoint for all canonical validation.
 * All methods are static, pure functions with no side effects.
 */
export class CODValidator {
  private static _instance: CODValidator | null = null;

  /**
   * Get singleton instance (for compatibility with MCP tools)
   * The instance just provides access to static methods
   */
  static getInstance(): CODValidator {
    if (!CODValidator._instance) {
      CODValidator._instance = new CODValidator();
    }
    return CODValidator._instance;
  }

  // Instance methods that delegate to static methods for compatibility
  validateTask = (
    data: TaskState,
    context?: {
      goalsMap?: Record<string, boolean>;
      tasksMap?: Record<string, boolean>;
    },
    options?: ValidatorOptions
  ) => CODValidator.validateTask(data, context, options);
  validateSession = (data: SessionState, options?: ValidatorOptions) =>
    CODValidator.validateSession(data, options);
  validateDependencyGraph = (data: unknown) =>
    CODValidator.validateDependencyGraph(
      data as Record<string, Partial<TaskState>>
    );

  // Stub methods for MCP compatibility (return PASS by default)
  validateLinkSuggestion = (data: unknown) =>
    CODValidator.validateLinkSuggestion(data);
  validateOperation = (data: unknown) => CODValidator.validateOperation(data);
  validateMoveOperation = (data: unknown) =>
    CODValidator.validateMoveOperation(data);
  validateMetadataModel = (data: unknown) =>
    CODValidator.validateMetadataModel(data);
  validateSessionStart = (data: unknown) =>
    CODValidator.validateSessionStart(data);
  validateBlockerResolution = (data: unknown) =>
    CODValidator.validateBlockerResolution(data);
  validateChecklistItem = (data: unknown) =>
    CODValidator.validateChecklistItem(data);

  /** Helper to create a PASS result with compatibility fields */
  private static _passResult(): ValidationResult {
    return {
      state: 'PASS',
      valid: true,
      issues: [],
      summary: { total: 0, errors: 0, warnings: 0 },
      status: 'PASS',
      reason: undefined,
      warnings: [],
    };
  }

  /**
   * Stub validators for MCP compatibility - these return PASS by default
   * TODO: Implement actual validation logic as needed
   */
  static validateLinkSuggestion(_data: unknown): ValidationResult {
    return CODValidator._passResult();
  }

  static validateOperation(_data: unknown): ValidationResult {
    return CODValidator._passResult();
  }

  static validateMoveOperation(_data: unknown): ValidationResult {
    return CODValidator._passResult();
  }

  static validateMetadataModel(_data: unknown): ValidationResult {
    return CODValidator._passResult();
  }

  static validateSessionStart(_data: unknown): ValidationResult {
    return CODValidator._passResult();
  }

  static validateBlockerResolution(_data: unknown): ValidationResult {
    return CODValidator._passResult();
  }

  static validateChecklistItem(_data: unknown): ValidationResult {
    return CODValidator._passResult();
  }

  /**
   * Validate a single task against canonical rules
   *
   * Rules:
   * 1. Required fields: id, title, status
   * 2. Status must be valid enum
   * 3. Priority must be 0-10
   * 4. Goal reference must exist in goals map (if provided)
   * 5. No self-dependencies
   * 6. Cannot be blocked by self
   *
   * @param task Task to validate
   * @param context Validation context (goals map, task map for dep checking)
   * @param options Runtime options
   * @returns ValidationResult with PASS/WARN/FAIL verdict
   */
  static validateTask(
    task: Partial<TaskState>,
    context?: {
      goalsMap?: Record<string, boolean>;
      tasksMap?: Record<string, boolean>;
    },
    options: ValidatorOptions = {}
  ): ValidationResult {
    const issues: ValidationIssue[] = [];

    // RULE 1: Required fields
    if (!task.id) {
      issues.push({
        code: 'MISSING_REQUIRED_FIELD',
        severity: 'error',
        message: 'Task requires field: id',
        field: 'id',
        suggestion: 'Provide a unique task identifier',
      });
    }

    if (!task.title) {
      issues.push({
        code: 'MISSING_REQUIRED_FIELD',
        severity: 'error',
        message: 'Task requires field: title',
        field: 'title',
        suggestion: 'Provide a task title',
      });
    }

    if (!task.status) {
      issues.push({
        code: 'MISSING_REQUIRED_FIELD',
        severity: 'error',
        message: 'Task requires field: status',
        field: 'status',
        suggestion:
          'Set status to one of: todo, in-progress, completed, blocked',
      });
    }

    // RULE 2: Status must be valid enum
    if (
      task.status &&
      !['todo', 'in-progress', 'completed', 'blocked'].includes(task.status)
    ) {
      issues.push({
        code: 'INVALID_ENUM_VALUE',
        severity: 'error',
        message: `Task status invalid: ${task.status}`,
        field: 'status',
        value: task.status,
        suggestion: 'Use one of: todo, in-progress, completed, blocked',
      });
    }

    // RULE 3: Priority bounds (0-10)
    if (
      task.priority !== undefined &&
      (task.priority < 0 || task.priority > 10)
    ) {
      issues.push({
        code: 'VALUE_OUT_OF_BOUNDS',
        severity: 'error',
        message: `Priority out of bounds: ${task.priority}`,
        field: 'priority',
        value: task.priority,
        suggestion: 'Priority must be between 0 and 10',
      });
    }

    // RULE 4: Goal reference must exist
    if (task.goal && context?.goalsMap && !context.goalsMap[task.goal]) {
      issues.push({
        code: 'INVALID_GOAL_REFERENCE',
        severity: 'error',
        message: `Goal does not exist: ${task.goal}`,
        field: 'goal',
        value: task.goal,
        suggestion: 'Reference an existing goal ID',
      });
    }

    // RULE 5: No self-dependencies
    if (task.dependsOn?.includes(task.id!)) {
      issues.push({
        code: 'DEPENDENCY_CYCLE',
        severity: 'error',
        message: `Task cannot depend on itself: ${task.id}`,
        field: 'dependsOn',
        value: task.id,
      });
    }

    // RULE 6: Cannot be blocked by self
    if (task.blockedBy?.includes(task.id!)) {
      issues.push({
        code: 'BLOCKED_BY_BLOCKER',
        severity: 'error',
        message: `Task cannot be blocked by itself: ${task.id}`,
        field: 'blockedBy',
        value: task.id,
      });
    }

    // WARNING: High dependency count
    if (task.dependsOn && task.dependsOn.length > 5) {
      issues.push({
        code: 'HIGH_RISK_CONFIGURATION',
        severity: 'warning',
        message: `Task has many dependencies (${task.dependsOn.length}), may be difficult to schedule`,
        field: 'dependsOn',
      });
    }

    // WARNING: Task is blocked but no blockers listed
    if (
      task.status === 'blocked' &&
      task.blockedBy &&
      task.blockedBy.length === 0
    ) {
      issues.push({
        code: 'INVALID_STATUS_TRANSITION',
        severity: 'warning',
        message: 'Task status is "blocked" but no blockers are recorded',
        field: 'status',
        suggestion: 'Add blocker IDs or change status',
      });
    }

    return CODValidator._buildResult(issues, options);
  }

  /**
   * Validate a session plan
   *
   * Rules:
   * 1. Duration must be positive
   * 2. Session must have tasks
   * 3. Total effort must fit in duration (with buffer)
   *
   * @param session Session to validate
   * @param options Runtime options
   * @returns ValidationResult
   */
  static validateSession(
    session: Partial<SessionState>,
    options: ValidatorOptions = {}
  ): ValidationResult {
    const issues: ValidationIssue[] = [];

    // RULE 1: Duration must be positive
    if (!session.duration || session.duration <= 0) {
      issues.push({
        code: 'VALUE_OUT_OF_BOUNDS',
        severity: 'error',
        message: 'Session duration must be positive number (minutes)',
        field: 'duration',
        value: session.duration,
        suggestion: 'Set duration to positive integer (e.g., 45, 90)',
      });
    }

    // RULE 2: Session must have tasks
    if (!session.taskIds || session.taskIds.length === 0) {
      issues.push({
        code: 'INVALID_STATUS_TRANSITION',
        severity: 'warning',
        message: 'Session has no tasks',
        field: 'taskIds',
        suggestion: 'Add task IDs to the session',
      });
    }

    // RULE 3: Capacity check (with 20% buffer for context switching)
    if (
      session.totalEffort !== undefined &&
      session.focusCost !== undefined &&
      session.duration !== undefined &&
      session.duration > 0
    ) {
      const estimatedMin =
        (session.totalEffort * 30 + session.focusCost * 10) * 1.2;
      if (estimatedMin > session.duration) {
        issues.push({
          code: 'HIGH_RISK_CONFIGURATION',
          severity: 'warning',
          message: `Session overbooked: estimated ${Math.round(estimatedMin)}min > available ${session.duration}min`,
          field: 'totalEffort',
          suggestion: 'Remove tasks or increase session duration',
        });
      }
    }

    return CODValidator._buildResult(issues, options);
  }

  /**
   * Validate task dependency graph for cycles
   *
   * Rules:
   * 1. No circular dependencies
   * 2. All dependency references must exist
   *
   * @param tasks Map of task ID → task
   * @param options Runtime options
   * @returns ValidationResult
   */
  static validateDependencyGraph(
    tasks: Record<string, Partial<TaskState>>,
    options: ValidatorOptions = {}
  ): ValidationResult {
    const issues: ValidationIssue[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    /**
     * Cycle detection via DFS
     * Returns cycle path if found, null otherwise
     */
    const findCycle = (
      taskId: string,
      path: string[] = []
    ): string[] | null => {
      if (recursionStack.has(taskId)) {
        return [...path, taskId];
      }
      if (visited.has(taskId)) {
        return null;
      }

      recursionStack.add(taskId);
      const deps = tasks[taskId]?.dependsOn || [];

      for (const dep of deps) {
        const cycle = findCycle(dep, [...path, taskId]);
        if (cycle) {
          return cycle;
        }
      }

      recursionStack.delete(taskId);
      visited.add(taskId);
      return null;
    };

    // RULE 1: Detect cycles
    for (const taskId of Object.keys(tasks)) {
      if (!visited.has(taskId)) {
        const cycle = findCycle(taskId);
        if (cycle) {
          issues.push({
            code: 'DEPENDENCY_CYCLE',
            severity: 'error',
            message: `Cycle in dependency graph: ${cycle.join(' → ')}`,
            field: 'dependsOn',
            value: cycle,
          });
          break; // Report first cycle only
        }
      }
    }

    // RULE 2: Validate all dependency references exist
    for (const [taskId, task] of Object.entries(tasks)) {
      const deps = task.dependsOn || [];
      for (const dep of deps) {
        if (!tasks[dep]) {
          issues.push({
            code: 'MISSING_DEPENDENCY',
            severity: 'warning',
            message: `Task ${taskId} depends on non-existent task ${dep}`,
            field: 'dependsOn',
            value: dep,
          });
        }
      }
    }

    return CODValidator._buildResult(issues, options);
  }

  /**
   * Build final ValidationResult from collected issues
   * @private
   */
  private static _buildResult(
    issues: ValidationIssue[],
    options: ValidatorOptions
  ): ValidationResult {
    // Separate by severity
    const errors = issues.filter((i) => i.severity === 'error');
    const warnings = issues.filter((i) => i.severity === 'warning');

    // In strict mode, warnings become errors
    const effectiveIssues = options.strict ? [...errors, ...warnings] : issues;

    // Determine verdict state
    let state: ValidationState;
    if (errors.length > 0) {
      state = 'FAIL';
    } else if (warnings.length > 0) {
      state = options.strict ? 'FAIL' : 'WARN';
    } else {
      state = 'PASS';
    }

    // Limit issues if requested
    const limitedIssues = options.maxIssues
      ? effectiveIssues.slice(0, options.maxIssues)
      : effectiveIssues;

    return {
      state,
      valid: state === 'PASS',
      issues: limitedIssues,
      summary: {
        total: limitedIssues.length,
        errors: errors.length,
        warnings: warnings.length,
      },
    };
  }
}
