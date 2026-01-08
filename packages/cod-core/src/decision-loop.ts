/**
 * COD Decision Loop State Machine
 *
 * Formalizes the COD decision loop as an explicit finite state machine.
 * Tracks the current state of the human-AI work cycle and enforces
 * valid transitions between states.
 *
 * States:
 * - idle: No active session, ready to plan
 * - planning: Actively planning a session (selecting tasks, setting duration)
 * - executing: Session in progress, working on tasks
 * - reviewing: Session ended, reviewing outcomes
 *
 * Transitions are gated by guards that check preconditions.
 */

/**
 * Decision loop states
 */
export type DecisionLoopState = 'idle' | 'planning' | 'executing' | 'reviewing';

/**
 * Transition triggers
 */
export type TransitionTrigger =
  | 'start_planning' // idle → planning
  | 'confirm_plan' // planning → executing
  | 'cancel_plan' // planning → idle
  | 'complete_session' // executing → reviewing
  | 'abort_session' // executing → reviewing
  | 'pause_session' // executing → idle (temporary)
  | 'complete_review' // reviewing → idle
  | 'skip_review' // reviewing → idle (with penalty)
  | 'start_new_session'; // reviewing → planning (shortcut)

/**
 * Guard check result
 */
export interface GuardResult {
  allowed: boolean;
  reason?: string;
  warnings?: string[];
}

/**
 * Transition definition
 */
export interface Transition {
  from: DecisionLoopState;
  to: DecisionLoopState;
  trigger: TransitionTrigger;
  /** Human or AI can trigger */
  allowedActors: ('human' | 'agent' | 'system')[];
  /** Whether this transition is automatic (no explicit trigger needed) */
  automatic?: boolean;
  /** Guard function name */
  guard?: string;
}

/**
 * Decision loop context for guards
 */
export interface DecisionLoopContext {
  /** Current session ID if any */
  sessionId?: string;

  /** Human state freshness (hours since last check) */
  humanStateAgeHours?: number;

  /** Whether last session was reviewed */
  lastSessionReviewed?: boolean;

  /** Current HARD_STOP status */
  hardStopActive?: boolean;

  /** Caller authority */
  callerAuthority?: 'human' | 'agent' | 'system';

  /** Session start time */
  sessionStartedAt?: string;

  /** Planned session duration */
  plannedDurationMin?: number;

  /** Tasks in current session */
  taskCount?: number;

  /** Review skip count (for warnings) */
  reviewSkipCount?: number;
}

/**
 * State machine snapshot
 */
export interface DecisionLoopSnapshot {
  state: DecisionLoopState;
  enteredAt: string;
  context: DecisionLoopContext;
  history: Array<{
    from: DecisionLoopState;
    to: DecisionLoopState;
    trigger: TransitionTrigger;
    at: string;
    actor: 'human' | 'agent' | 'system';
  }>;
}

/**
 * All valid transitions
 */
const TRANSITIONS: Transition[] = [
  // From IDLE
  {
    from: 'idle',
    to: 'planning',
    trigger: 'start_planning',
    allowedActors: ['human', 'agent', 'system'],
    guard: 'canStartPlanning',
  },

  // From PLANNING
  {
    from: 'planning',
    to: 'executing',
    trigger: 'confirm_plan',
    allowedActors: ['human', 'agent'],
    guard: 'canConfirmPlan',
  },
  {
    from: 'planning',
    to: 'idle',
    trigger: 'cancel_plan',
    allowedActors: ['human', 'agent', 'system'],
  },

  // From EXECUTING
  {
    from: 'executing',
    to: 'reviewing',
    trigger: 'complete_session',
    allowedActors: ['human', 'agent', 'system'],
    guard: 'canCompleteSession',
  },
  {
    from: 'executing',
    to: 'reviewing',
    trigger: 'abort_session',
    allowedActors: ['human', 'system'],
  },
  {
    from: 'executing',
    to: 'idle',
    trigger: 'pause_session',
    allowedActors: ['human'],
    guard: 'canPauseSession',
  },

  // From REVIEWING
  {
    from: 'reviewing',
    to: 'idle',
    trigger: 'complete_review',
    allowedActors: ['human', 'agent'],
    guard: 'canCompleteReview',
  },
  {
    from: 'reviewing',
    to: 'idle',
    trigger: 'skip_review',
    allowedActors: ['human'],
    guard: 'canSkipReview',
  },
  {
    from: 'reviewing',
    to: 'planning',
    trigger: 'start_new_session',
    allowedActors: ['human', 'agent'],
    guard: 'canStartNewSession',
  },
];

/**
 * Guard functions
 */
const GUARDS: Record<string, (ctx: DecisionLoopContext) => GuardResult> = {
  canStartPlanning: (ctx) => {
    const warnings: string[] = [];

    // HARD_STOP check
    if (ctx.hardStopActive) {
      return {
        allowed: false,
        reason:
          'HARD_STOP is active. Cannot start planning during restricted hours.',
      };
    }

    // Human state freshness
    if (ctx.humanStateAgeHours !== undefined && ctx.humanStateAgeHours > 4) {
      warnings.push(
        `Human state is ${ctx.humanStateAgeHours.toFixed(1)}h old. Consider updating before planning.`
      );
    }

    // Last session review
    if (ctx.lastSessionReviewed === false) {
      return {
        allowed: false,
        reason:
          'Previous session not reviewed. Complete review before planning new session.',
      };
    }

    return {
      allowed: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  },

  canConfirmPlan: (ctx) => {
    if (!ctx.taskCount || ctx.taskCount === 0) {
      return {
        allowed: false,
        reason: 'Cannot confirm plan with no tasks selected.',
      };
    }

    if (!ctx.plannedDurationMin || ctx.plannedDurationMin <= 0) {
      return {
        allowed: false,
        reason: 'Invalid session duration.',
      };
    }

    return { allowed: true };
  },

  canCompleteSession: (ctx) => {
    if (!ctx.sessionId) {
      return {
        allowed: false,
        reason: 'No active session to complete.',
      };
    }

    return { allowed: true };
  },

  canPauseSession: (ctx) => {
    // Only humans can pause - already enforced by allowedActors
    if (!ctx.sessionId) {
      return {
        allowed: false,
        reason: 'No active session to pause.',
      };
    }

    return {
      allowed: true,
      warnings: ['Session paused. Remember to resume or end it later.'],
    };
  },

  canCompleteReview: (ctx) => {
    // Review must have meaningful content (enforced at MCP layer)
    return { allowed: true };
  },

  canSkipReview: (ctx) => {
    const warnings: string[] = [];

    if (ctx.reviewSkipCount !== undefined && ctx.reviewSkipCount >= 2) {
      warnings.push(
        `You've skipped ${ctx.reviewSkipCount} reviews. Reflection is important for improvement.`
      );
    }

    return {
      allowed: true,
      warnings: [
        'Skipping review reduces learning from session outcomes.',
        ...warnings,
      ],
    };
  },

  canStartNewSession: (ctx) => {
    // Shortcut from review → planning
    // Requires completing review first implicitly
    if (ctx.hardStopActive) {
      return {
        allowed: false,
        reason: 'HARD_STOP is active. Cannot start new session.',
      };
    }

    return { allowed: true };
  },
};

/**
 * Get allowed transitions from current state
 */
export function getAllowedTransitions(
  currentState: DecisionLoopState,
  actor: 'human' | 'agent' | 'system'
): Transition[] {
  return TRANSITIONS.filter(
    (t) => t.from === currentState && t.allowedActors.includes(actor)
  );
}

/**
 * Check if a transition is valid
 */
export function canTransition(
  currentState: DecisionLoopState,
  trigger: TransitionTrigger,
  actor: 'human' | 'agent' | 'system',
  context: DecisionLoopContext = {}
): GuardResult {
  // Find matching transition
  const transition = TRANSITIONS.find(
    (t) =>
      t.from === currentState &&
      t.trigger === trigger &&
      t.allowedActors.includes(actor)
  );

  if (!transition) {
    return {
      allowed: false,
      reason: `Invalid transition: ${trigger} from ${currentState} by ${actor}`,
    };
  }

  // Check guard if present
  if (transition.guard) {
    const guardFn = GUARDS[transition.guard];
    if (guardFn) {
      return guardFn(context);
    }
  }

  return { allowed: true };
}

/**
 * Execute a transition (pure function - returns new snapshot)
 */
export function executeTransition(
  snapshot: DecisionLoopSnapshot,
  trigger: TransitionTrigger,
  actor: 'human' | 'agent' | 'system',
  contextUpdate?: Partial<DecisionLoopContext>
): {
  success: boolean;
  snapshot?: DecisionLoopSnapshot;
  error?: string;
  warnings?: string[];
} {
  const canResult = canTransition(snapshot.state, trigger, actor, {
    ...snapshot.context,
    ...contextUpdate,
  });

  if (!canResult.allowed) {
    return {
      success: false,
      error: canResult.reason,
    };
  }

  const transition = TRANSITIONS.find(
    (t) =>
      t.from === snapshot.state &&
      t.trigger === trigger &&
      t.allowedActors.includes(actor)
  );

  if (!transition) {
    return {
      success: false,
      error: 'Transition not found',
    };
  }

  const now = new Date().toISOString();

  const newSnapshot: DecisionLoopSnapshot = {
    state: transition.to,
    enteredAt: now,
    context: {
      ...snapshot.context,
      ...contextUpdate,
      // Clear session-specific context when transitioning to idle
      ...(transition.to === 'idle'
        ? {
            sessionId: undefined,
            sessionStartedAt: undefined,
            plannedDurationMin: undefined,
            taskCount: undefined,
          }
        : {}),
    },
    history: [
      ...snapshot.history.slice(-19), // Keep last 20 transitions
      {
        from: snapshot.state,
        to: transition.to,
        trigger,
        at: now,
        actor,
      },
    ],
  };

  return {
    success: true,
    snapshot: newSnapshot,
    warnings: canResult.warnings,
  };
}

/**
 * Create initial snapshot
 */
export function createInitialSnapshot(
  initialContext?: Partial<DecisionLoopContext>
): DecisionLoopSnapshot {
  return {
    state: 'idle',
    enteredAt: new Date().toISOString(),
    context: initialContext ?? {},
    history: [],
  };
}

/**
 * Get state info for display
 */
export function getStateInfo(state: DecisionLoopState): {
  name: string;
  description: string;
  emoji: string;
  allowedActions: string[];
} {
  switch (state) {
    case 'idle':
      return {
        name: 'Idle',
        description: 'No active session. Ready to plan new work.',
        emoji: '💤',
        allowedActions: ['Start planning a new session'],
      };
    case 'planning':
      return {
        name: 'Planning',
        description: 'Selecting tasks and configuring session parameters.',
        emoji: '📋',
        allowedActions: [
          'Confirm plan to start session',
          'Cancel and return to idle',
        ],
      };
    case 'executing':
      return {
        name: 'Executing',
        description: 'Session in progress. Working on planned tasks.',
        emoji: '⚡',
        allowedActions: [
          'Complete session and start review',
          'Abort session',
          'Pause session (human only)',
        ],
      };
    case 'reviewing':
      return {
        name: 'Reviewing',
        description:
          'Session ended. Reviewing outcomes and capturing learnings.',
        emoji: '🔍',
        allowedActions: [
          'Complete review',
          'Skip review (not recommended)',
          'Start planning new session',
        ],
      };
  }
}

/**
 * Format snapshot for display
 */
export function formatSnapshotDisplay(snapshot: DecisionLoopSnapshot): string {
  const info = getStateInfo(snapshot.state);
  const lines: string[] = [];

  lines.push(`# Decision Loop State\n`);
  lines.push(`## Current State: ${info.emoji} ${info.name}\n`);
  lines.push(`${info.description}\n`);
  lines.push(`**Entered at:** ${snapshot.enteredAt}\n`);

  if (snapshot.context.sessionId) {
    lines.push(`\n## Active Session\n`);
    lines.push(`- **ID:** ${snapshot.context.sessionId}`);
    if (snapshot.context.sessionStartedAt) {
      lines.push(`- **Started:** ${snapshot.context.sessionStartedAt}`);
    }
    if (snapshot.context.taskCount) {
      lines.push(`- **Tasks:** ${snapshot.context.taskCount}`);
    }
    if (snapshot.context.plannedDurationMin) {
      lines.push(
        `- **Planned duration:** ${snapshot.context.plannedDurationMin} min`
      );
    }
  }

  lines.push(`\n## Allowed Actions\n`);
  for (const action of info.allowedActions) {
    lines.push(`- ${action}`);
  }

  if (snapshot.history.length > 0) {
    lines.push(`\n## Recent History\n`);
    const recent = snapshot.history.slice(-5);
    for (const h of recent) {
      lines.push(`- ${h.from} → ${h.to} (${h.trigger}) by ${h.actor}`);
    }
  }

  return lines.join('\n');
}

/**
 * Get transition graph as mermaid diagram
 */
export function getTransitionDiagram(): string {
  const lines = ['```mermaid', 'stateDiagram-v2', '    [*] --> idle', ''];

  for (const t of TRANSITIONS) {
    const label = t.trigger.replace(/_/g, ' ');
    lines.push(`    ${t.from} --> ${t.to}: ${label}`);
  }

  lines.push('```');
  return lines.join('\n');
}
