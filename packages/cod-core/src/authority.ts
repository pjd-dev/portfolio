/**
 * Authority Enforcement: Control delegation gates for task execution
 *
 * Implements authority rules from COD spec:
 * - human-only: Task requires human execution, AI cannot process
 * - agent: AI can execute autonomously
 * - agent+review: AI can execute but requires human review
 * - agent-limited: AI can execute with token/time budget constraints
 *
 * Used by MCP handlers to gate task operations based on caller authority.
 */

/**
 * Delegation modes for tasks
 */
export type DelegationMode =
  | 'human-only' // Must be done by human
  | 'agent' // AI can execute autonomously
  | 'agent+review' // AI can execute, human reviews output
  | 'agent-limited'; // AI can execute within constraints

/**
 * Authority level of the caller
 */
export type CallerAuthority =
  | 'human' // Human operator (full access)
  | 'agent' // AI agent (respects delegation rules)
  | 'system'; // System process (respects delegation rules)

/**
 * Risk level for actions
 */
export type ActionRisk = 'low' | 'medium' | 'high' | 'critical';

/**
 * Task authority configuration (from frontmatter)
 */
export interface TaskAuthorityConfig {
  /** Delegation mode for this task */
  delegationMode?: DelegationMode;

  /** Legacy field: delegatable (maps to 'agent' if true) */
  delegatable?: boolean;

  /** Whether task is explicitly human-only */
  humanOnly?: boolean;

  /** Token budget for AI execution (if agent-limited) */
  aiTokenBudget?: number;

  /** Time budget in minutes for AI execution */
  aiTimeBudgetMin?: number;

  /** Tags that may indicate authority (e.g., 'agent-ok', 'human-only') */
  tags?: string[];
}

/**
 * Authority check result
 */
export interface AuthorityCheckResult {
  /** Whether the action is allowed */
  allowed: boolean;

  /** If not allowed, the reason */
  reason?: string;

  /** Effective delegation mode after normalization */
  effectiveMode: DelegationMode;

  /** Whether human review is required after execution */
  requiresReview: boolean;

  /** Budget constraints (if agent-limited) */
  budget?: {
    tokenLimit?: number;
    timeLimitMin?: number;
  };

  /** Risk level of the task */
  riskLevel: ActionRisk;
}

/**
 * Action types that can be authorized
 */
export type AuthorizedAction =
  | 'read' // Read task details
  | 'execute' // Execute/work on task
  | 'update' // Update task status/progress
  | 'complete' // Mark task as completed
  | 'delete'; // Delete/drop task

/**
 * Default delegation mode when not specified
 */
const DEFAULT_DELEGATION_MODE: DelegationMode = 'agent+review';

/**
 * Risk assessment rules based on task properties
 */
const CRITICAL_TAGS = new Set([
  'security',
  'financial',
  'production',
  'data-deletion',
]);
const HIGH_RISK_TAGS = new Set([
  'deployment',
  'migration',
  'infrastructure',
  'auth',
]);
const MEDIUM_RISK_TAGS = new Set([
  'refactor',
  'breaking-change',
  'external-api',
]);

/**
 * Normalize delegation mode from various frontmatter representations
 */
export function normalizeDelegationMode(
  config: TaskAuthorityConfig
): DelegationMode {
  // Explicit human-only takes precedence
  if (config.humanOnly === true) {
    return 'human-only';
  }

  // Check tags for human-only indicator
  const tags = (config.tags ?? []).map((t) => t.toLowerCase());
  if (tags.includes('human-only') || tags.includes('humanonly')) {
    return 'human-only';
  }

  // Check explicit delegation_mode
  if (config.delegationMode) {
    const mode = config.delegationMode.toLowerCase();
    if (
      ['human-only', 'agent', 'agent+review', 'agent-limited'].includes(mode)
    ) {
      return mode as DelegationMode;
    }
    // Handle common variations
    if (mode === 'agent-review' || mode === 'agent_with_review') {
      return 'agent+review';
    }
  }

  // Check budget constraints → agent-limited
  if (
    config.aiTokenBudget !== undefined ||
    config.aiTimeBudgetMin !== undefined
  ) {
    return 'agent-limited';
  }

  // Check legacy delegatable field
  if (
    config.delegatable === true ||
    tags.includes('delegatable') ||
    tags.includes('agent-ok')
  ) {
    return 'agent';
  }

  // Default: require review
  return DEFAULT_DELEGATION_MODE;
}

/**
 * Assess risk level based on task properties
 */
export function assessRiskLevel(config: TaskAuthorityConfig): ActionRisk {
  const tags = (config.tags ?? []).map((t) => t.toLowerCase());

  for (const tag of tags) {
    if (CRITICAL_TAGS.has(tag)) return 'critical';
  }
  for (const tag of tags) {
    if (HIGH_RISK_TAGS.has(tag)) return 'high';
  }
  for (const tag of tags) {
    if (MEDIUM_RISK_TAGS.has(tag)) return 'medium';
  }

  return 'low';
}

/**
 * Check if a caller has authority to perform an action on a task
 */
export function checkAuthority(
  caller: CallerAuthority,
  action: AuthorizedAction,
  config: TaskAuthorityConfig
): AuthorityCheckResult {
  const effectiveMode = normalizeDelegationMode(config);
  const riskLevel = assessRiskLevel(config);

  // Human callers always have full authority
  if (caller === 'human') {
    return {
      allowed: true,
      effectiveMode,
      requiresReview: false,
      riskLevel,
    };
  }

  // Read actions are always allowed
  if (action === 'read') {
    return {
      allowed: true,
      effectiveMode,
      requiresReview: false,
      riskLevel,
    };
  }

  // Human-only tasks block non-human callers for write actions
  if (effectiveMode === 'human-only') {
    return {
      allowed: false,
      reason: 'Task is human-only. AI/system callers cannot execute or modify.',
      effectiveMode,
      requiresReview: false,
      riskLevel,
    };
  }

  // Critical risk tasks require human approval
  if (
    riskLevel === 'critical' &&
    (action === 'execute' || action === 'complete')
  ) {
    return {
      allowed: false,
      reason: `Critical-risk task requires human approval for ${action} action.`,
      effectiveMode,
      requiresReview: true,
      riskLevel,
    };
  }

  // Agent mode: full delegation
  if (effectiveMode === 'agent') {
    return {
      allowed: true,
      effectiveMode,
      requiresReview: false,
      riskLevel,
    };
  }

  // Agent+review: allowed but requires human review
  if (effectiveMode === 'agent+review') {
    return {
      allowed: true,
      effectiveMode,
      requiresReview: true,
      riskLevel,
    };
  }

  // Agent-limited: check budget constraints
  if (effectiveMode === 'agent-limited') {
    return {
      allowed: true,
      effectiveMode,
      requiresReview: true,
      budget: {
        tokenLimit: config.aiTokenBudget,
        timeLimitMin: config.aiTimeBudgetMin,
      },
      riskLevel,
    };
  }

  // Fallback: deny with reason
  return {
    allowed: false,
    reason: `Unknown delegation mode: ${effectiveMode}`,
    effectiveMode,
    requiresReview: true,
    riskLevel,
  };
}

/**
 * Check if a task can be included in an AI-planned session
 */
export function canIncludeInAgentSession(config: TaskAuthorityConfig): {
  includable: boolean;
  reason?: string;
  requiresReview: boolean;
} {
  const effectiveMode = normalizeDelegationMode(config);
  const riskLevel = assessRiskLevel(config);

  if (effectiveMode === 'human-only') {
    return {
      includable: false,
      reason: 'Task is human-only',
      requiresReview: false,
    };
  }

  if (riskLevel === 'critical') {
    return {
      includable: false,
      reason: 'Critical-risk task excluded from agent sessions',
      requiresReview: true,
    };
  }

  return {
    includable: true,
    requiresReview:
      effectiveMode === 'agent+review' || effectiveMode === 'agent-limited',
  };
}

/**
 * Extract authority config from task frontmatter
 */
export function extractAuthorityConfig(
  frontmatter: Record<string, unknown>
): TaskAuthorityConfig {
  const tags = Array.isArray(frontmatter.tags)
    ? frontmatter.tags.map((t: unknown) => String(t))
    : [];

  return {
    delegationMode: frontmatter.delegation_mode as DelegationMode | undefined,
    delegatable: frontmatter.delegatable as boolean | undefined,
    humanOnly: frontmatter.human_only as boolean | undefined,
    aiTokenBudget: frontmatter.ai_token_budget as number | undefined,
    aiTimeBudgetMin: frontmatter.ai_time_budget_min as number | undefined,
    tags,
  };
}

/**
 * Format authority check result for display
 */
export function formatAuthorityResult(result: AuthorityCheckResult): string {
  const lines: string[] = [];

  if (result.allowed) {
    lines.push(`✅ Action allowed (mode: ${result.effectiveMode})`);
    if (result.requiresReview) {
      lines.push(`⚠️ Human review required after execution`);
    }
    if (result.budget) {
      if (result.budget.tokenLimit) {
        lines.push(`📊 Token budget: ${result.budget.tokenLimit}`);
      }
      if (result.budget.timeLimitMin) {
        lines.push(`⏱️ Time budget: ${result.budget.timeLimitMin} minutes`);
      }
    }
  } else {
    lines.push(`❌ Action blocked: ${result.reason}`);
  }

  lines.push(`Risk level: ${result.riskLevel}`);

  return lines.join('\n');
}
