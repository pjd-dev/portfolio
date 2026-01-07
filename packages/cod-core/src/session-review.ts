/**
 * SESSION_REVIEW Guardrail Module
 *
 * Prevents starting new sessions without completing review of the previous session.
 * Enforces reflection pattern: Every work session must be followed by a review session.
 *
 * Purpose: Build self-awareness and improve task planning accuracy
 * - Ensures reflection on what worked/didn't work
 * - Prevents burnout from endless work without pause
 * - Captures outcome data for prediction model training
 */

export interface SessionReviewConfig {
  /** Require review session after every regular session (default: true) */
  enforceReview: boolean;

  /** Minutes required for review (minimum, default: 10) */
  reviewMinDuration: number;

  /** Allow skipping review (default: false) */
  allowSkip: boolean;

  /** Skip reason categories allowed when allowSkip=true */
  skipReasons?: ('time-pressure' | 'emergency' | 'auto-session')[];
}

export interface SessionReviewState {
  /** Last session ID that was completed */
  lastSessionId: string;

  /** Whether the last session was reviewed (if false, review needed) */
  lastSessionReviewed: boolean;

  /** ISO timestamp when last session ended */
  lastSessionEndedAt: string;

  /** Current session about to start (ID) */
  currentSessionId: string;
}

export interface SessionReviewCheckResult {
  /** Is review required before starting new session? */
  reviewNeeded: boolean;

  /** Minutes since last session ended */
  minutesSinceEnd?: number;

  /** Required review duration */
  reviewRequired?: number;

  /** Why review is needed (for user message) */
  reason?: string;

  /** Can user skip review? */
  skipAllowed: boolean;

  /** Previous session info for review prompt */
  previousSession?: {
    sessionId: string;
    endedAt: string;
  };
}

/**
 * Check if a session review is required before starting a new session
 *
 * Rules:
 * - If last session exists AND wasn't reviewed → review needed
 * - If enforceReview=false → no review needed
 * - If allowSkip=true → review optional (but still recommended)
 */
export function checkSessionReviewNeeded(
  state: Partial<SessionReviewState>,
  config: Partial<SessionReviewConfig> = {}
): SessionReviewCheckResult {
  const {
    enforceReview = true,
    reviewMinDuration = 10,
    allowSkip = false,
  } = config;

  // No previous session → no review needed
  if (!state.lastSessionId) {
    return {
      reviewNeeded: false,
      skipAllowed: false,
    };
  }

  // Last session already reviewed → no review needed
  if (state.lastSessionReviewed) {
    return {
      reviewNeeded: false,
      skipAllowed: false,
    };
  }

  // Enforce mode: review required
  if (enforceReview && !allowSkip) {
    const endedAt = new Date(state.lastSessionEndedAt || new Date());
    const now = new Date();
    const minutesSince = Math.floor(
      (now.getTime() - endedAt.getTime()) / (1000 * 60)
    );

    return {
      reviewNeeded: true,
      minutesSinceEnd: minutesSince,
      reviewRequired: reviewMinDuration,
      reason: `Session review required: Reflect on session ${state.lastSessionId} before starting new work`,
      skipAllowed: false,
      previousSession: {
        sessionId: state.lastSessionId,
        endedAt: state.lastSessionEndedAt || new Date().toISOString(),
      },
    };
  }

  // Soft mode: review recommended but optional
  if (enforceReview && allowSkip) {
    return {
      reviewNeeded: true,
      reviewRequired: reviewMinDuration,
      reason: `Review recommended: Consider reflecting on session ${state.lastSessionId}`,
      skipAllowed: true,
      previousSession: {
        sessionId: state.lastSessionId,
        endedAt: state.lastSessionEndedAt || new Date().toISOString(),
      },
    };
  }

  // Not enforcing review
  return {
    reviewNeeded: false,
    skipAllowed: true,
  };
}

/**
 * Get validation blocker for COD system integration
 *
 * Returns:
 * - null: No blocker, can proceed
 * - { blocking: true, ... }: Hard block (fail validation)
 * - { blocking: false, ... }: Soft block (warning only)
 */
export function toValidationBlocker(result: SessionReviewCheckResult): {
  blocking: boolean;
  reason: string;
} | null {
  if (!result.reviewNeeded) {
    return null;
  }

  return {
    blocking: !result.skipAllowed, // Hard block if skip not allowed
    reason: result.reason || 'Session review needed',
  };
}

/**
 * Record that a session review has been completed
 *
 * Used by MCP tool handlers to mark review as done
 */
export interface SessionReviewInput {
  /** Which session was reviewed */
  sessionId: string;

  /** What worked well */
  whatWorked?: string[];

  /** What didn't work */
  whatDidntWork?: string[];

  /** Key insight from session */
  insight?: string;

  /** Recommendations for next session */
  recommendations?: string[];
}

/**
 * Format session review for display
 */
export function formatSessionReviewPrompt(
  previousSession: { sessionId: string; endedAt: string },
  reviewRequired: number
): string {
  const endedAt = new Date(previousSession.endedAt);
  return `Session ${previousSession.sessionId} ended at ${endedAt.toLocaleTimeString()}
Please spend ${reviewRequired} minutes reviewing:
1. What worked well?
2. What could improve?
3. Key insight?
4. Recommendations for next session?`;
}
