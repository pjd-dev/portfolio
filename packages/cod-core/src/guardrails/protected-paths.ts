/**
 * Protected Paths Guardrail
 *
 * Enforces path-based access control for vault write operations.
 * Prevents LLM agents from bypassing COD tools and corrupting system state.
 *
 * Key principles:
 * 1. Protected paths require specific tools (not raw write_note)
 * 2. COD-first: structured notes must use COD tools
 * 3. Template enforcement: structured notes require create_from_template
 * 4. Event system for avatar/world state changes
 */

// ===========================================================================
// Protected Path Configuration
// ===========================================================================

export interface ProtectedPath {
  /** Regex pattern to match paths */
  pattern: RegExp;
  /** Tool or tool pattern required for this path */
  requiredTool: string;
  /** Human-readable reason for protection */
  reason: string;
}

/**
 * Paths that require specific tools (not raw write_note)
 */
export const PROTECTED_PATHS: ProtectedPath[] = [
  {
    pattern: /^_state\//,
    requiredTool: 'state-specific',
    reason: 'State must go through COD services',
  },
  {
    pattern: /^core\/avatar/,
    requiredTool: 'avatar_*',
    reason: 'Avatar requires avatar tools',
  },
  {
    pattern: /^core\/world/,
    requiredTool: 'world_*',
    reason: 'World requires world tools',
  },
  {
    pattern: /^core\/cod/,
    requiredTool: 'cod_*',
    reason: 'COD config requires COD tools',
  },
];

/**
 * Invalid filename patterns (always blocked)
 */
export const INVALID_FILENAME_PATTERNS: RegExp[] = [
  /\.json\.md$/, // Double extension (JSON + MD)
  /\.ya?ml\.md$/, // YAML + MD
  /\s{2,}/, // Multiple consecutive spaces
  /^\.+$/, // Only dots
  /[<>:"|?*]/, // Invalid filesystem chars
];

// ===========================================================================
// COD Tool Routing
// ===========================================================================

export interface CodToolRoute {
  /** Path pattern to match */
  pathPattern: RegExp;
  /** Tool required for updates */
  requiredTool: string;
  /** Tool required for creation (usually create_from_template) */
  createTool: string;
  /** Template type for create_from_template */
  templateType?: string;
}

/**
 * COD-first tool routing: structured paths require COD tools
 */
export const COD_TOOL_ROUTES: CodToolRoute[] = [
  {
    pathPattern: /^tasks\//,
    requiredTool: 'update_task',
    createTool: 'create_from_template',
    templateType: 'task',
  },
  {
    pathPattern: /^sessions\//,
    requiredTool: 'session_*',
    createTool: 'create_from_template',
    templateType: 'session',
  },
  {
    pathPattern: /^Goals\//,
    requiredTool: 'goal_*',
    createTool: 'create_from_template',
    templateType: 'goal',
  },
  {
    pathPattern: /^core\/avatar/,
    requiredTool: 'write_human_state|sync_avatar_vitals',
    createTool: 'BLOCKED',
  },
  {
    pathPattern: /^core\/world/,
    requiredTool: 'update_world_state',
    createTool: 'BLOCKED',
  },
];

/**
 * Template-required paths: must use create_from_template for new files
 */
export const TEMPLATE_REQUIRED_PATHS: Array<{
  pattern: RegExp;
  templateType: string;
}> = [
  { pattern: /^tasks\//, templateType: 'task' },
  { pattern: /^sessions\//, templateType: 'session' },
  { pattern: /^Goals\//, templateType: 'goal' },
  { pattern: /^knowledge\//, templateType: 'knowledge' },
  { pattern: /^ideas\//, templateType: 'idea' },
  { pattern: /^daily\//, templateType: 'daily' },
];

/**
 * Free-form paths: allow raw write_note without restrictions
 */
export const FREE_FORM_PATHS: RegExp[] = [
  /^notes\//, // General scratch notes
  /^dump\//, // Scratch/dump area
  /^doc\//, // Documentation
  /^logs\//, // Log files
];

// ===========================================================================
// Caller Scopes
// ===========================================================================

export type CallerScope =
  | 'user' // Default for LLM agents - limited access
  | 'system' // Internal services - full access
  | 'avatar' // Avatar tools only
  | 'world' // World tools only
  | 'cod'; // COD services only

/**
 * Scope capabilities map
 */
export const SCOPE_CAPABILITIES: Record<CallerScope, RegExp[]> = {
  user: [/^tasks\//, /^notes\//, /^dump\//, /^doc\//],
  system: [/.*/], // Everything
  avatar: [/^core\/avatar/],
  world: [/^core\/world/],
  cod: [/^_state\/cod\//, /^core\/cod\//],
};

// ===========================================================================
// Validation Types
// ===========================================================================

export interface PathValidationResult {
  valid: boolean;
  error?: string;
  suggestion?: string;
  suggestedTool?: string;
  suggestedParams?: Record<string, string>;
}

export interface CodToolCheck {
  blocked: boolean;
  error?: string;
  suggestedTool?: string;
  reason?: string;
}

export interface TemplateEnforcementResult {
  blocked: boolean;
  error?: string;
  suggestedTool?: string;
  suggestedParams?: Record<string, string>;
}

// ===========================================================================
// Validation Functions
// ===========================================================================

/**
 * Validate a write path against protected paths and filename rules
 */
export function validateWritePath(
  path: string,
  callerScope: CallerScope = 'user'
): PathValidationResult {
  // Normalize path (remove leading slash)
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

  // Check invalid filenames first
  for (const pattern of INVALID_FILENAME_PATTERNS) {
    if (pattern.test(normalizedPath)) {
      return {
        valid: false,
        error: `Invalid filename pattern: ${normalizedPath}`,
        suggestion: 'Use standard .md extension without double extensions',
      };
    }
  }

  // System scope bypasses all checks
  if (callerScope === 'system') {
    return { valid: true };
  }

  // Check protected paths
  for (const protectedPath of PROTECTED_PATHS) {
    if (protectedPath.pattern.test(normalizedPath)) {
      // Check if caller has required scope
      const scopeCapabilities = SCOPE_CAPABILITIES[callerScope];
      const hasAccess = scopeCapabilities.some((cap) =>
        cap.test(normalizedPath)
      );

      if (!hasAccess) {
        return {
          valid: false,
          error: `Protected path: ${normalizedPath}. ${protectedPath.reason}`,
          suggestion: `Use ${protectedPath.requiredTool} instead`,
          suggestedTool: protectedPath.requiredTool,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Check if a COD tool should be used instead of raw write
 */
export function checkCodToolRequired(
  path: string,
  operation: 'create' | 'update'
): CodToolCheck {
  // Normalize path
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

  // Check if this is a free-form path (no restrictions)
  const isFreeForm = FREE_FORM_PATHS.some((p) => p.test(normalizedPath));
  if (isFreeForm) {
    return { blocked: false };
  }

  // Check COD tool routes
  for (const route of COD_TOOL_ROUTES) {
    if (route.pathPattern.test(normalizedPath)) {
      const tool =
        operation === 'create' ? route.createTool : route.requiredTool;

      if (tool === 'BLOCKED') {
        return {
          blocked: true,
          error: `Cannot ${operation} ${normalizedPath}. This path type does not support ${operation} operations.`,
          reason: 'Path is managed by system events only',
        };
      }

      return {
        blocked: true,
        error: `Use ${tool} instead of raw write for ${normalizedPath}`,
        suggestedTool: tool,
        reason: 'COD-first: structured notes require COD tools',
      };
    }
  }

  return { blocked: false };
}

/**
 * Enforce template usage for new file creation
 */
export function enforceTemplateUsage(
  path: string,
  isNewFile: boolean
): TemplateEnforcementResult {
  if (!isNewFile) {
    return { blocked: false };
  }

  // Normalize path
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

  // Check if this is a free-form path
  const isFreeForm = FREE_FORM_PATHS.some((p) => p.test(normalizedPath));
  if (isFreeForm) {
    return { blocked: false };
  }

  // Check template-required paths
  for (const route of TEMPLATE_REQUIRED_PATHS) {
    if (route.pattern.test(normalizedPath)) {
      return {
        blocked: true,
        error: `Cannot create ${normalizedPath} with raw write. Use create_from_template with templateType="${route.templateType}"`,
        suggestedTool: 'create_from_template',
        suggestedParams: { templateType: route.templateType },
      };
    }
  }

  return { blocked: false };
}

/**
 * Combined validation: check all guardrails at once
 */
export function validateWriteOperation(
  path: string,
  options: {
    callerScope?: CallerScope;
    isNewFile?: boolean;
    operation?: 'create' | 'update';
  } = {}
): PathValidationResult {
  const {
    callerScope = 'user',
    isNewFile = false,
    operation = isNewFile ? 'create' : 'update',
  } = options;

  // 1. Basic path validation
  const pathResult = validateWritePath(path, callerScope);
  if (!pathResult.valid) {
    return pathResult;
  }

  // 2. Template enforcement for new files
  if (isNewFile) {
    const templateResult = enforceTemplateUsage(path, isNewFile);
    if (templateResult.blocked) {
      return {
        valid: false,
        error: templateResult.error,
        suggestedTool: templateResult.suggestedTool,
        suggestedParams: templateResult.suggestedParams,
      };
    }
  }

  // 3. COD tool routing
  const codResult = checkCodToolRequired(path, operation);
  if (codResult.blocked) {
    return {
      valid: false,
      error: codResult.error,
      suggestedTool: codResult.suggestedTool,
      suggestion: codResult.reason,
    };
  }

  return { valid: true };
}
