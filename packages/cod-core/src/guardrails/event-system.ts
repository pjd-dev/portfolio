/**
 * Event System for Avatar/World State Changes
 *
 * All state changes to Avatar and World MUST go through the event system.
 * This ensures:
 * 1. No raw writes to state files
 * 2. All changes are auditable
 * 3. Consistent impact calculation across LLM providers
 * 4. Support for both known events and surprise events
 */

// ===========================================================================
// Event Types
// ===========================================================================

export type EventAffects = 'avatar' | 'world' | 'both';

export interface KnownEvent {
  type: string;
  affects: EventAffects;
  handler: string;
}

export interface AvatarImpact {
  energy?: number; // -10 to +10
  stress?: number; // -10 to +10
  xp?: number; // 0 to +100
  hp?: number; // -100 to +100
}

export interface WorldImpact {
  disrupted?: boolean;
  disruptedUntil?: string; // ISO timestamp
  availabilityChange?: 'increased' | 'decreased' | 'unchanged';
  locationChange?: string;
}

export interface EventResult {
  success: boolean;
  eventType: string;
  timestamp: string;
  impact?: {
    avatar?: AvatarImpact;
    world?: WorldImpact;
  };
  error?: string;
}

export interface SurpriseEvent {
  type: 'surprise';
  category: 'positive' | 'negative' | 'neutral';
  description: string;
  affects: EventAffects;
  suggestedImpact?: {
    avatar?: AvatarImpact;
    world?: WorldImpact;
  };
}

// ===========================================================================
// Known Events Registry
// ===========================================================================

/**
 * Registry of known events with their handlers
 */
export const KNOWN_EVENTS: KnownEvent[] = [
  // Avatar vitals
  { type: 'task_completed', affects: 'avatar', handler: 'applyTaskReward' },
  { type: 'task_skipped', affects: 'avatar', handler: 'applySkipPenalty' },
  { type: 'session_ended', affects: 'avatar', handler: 'applySessionOutcome' },
  { type: 'streak_broken', affects: 'avatar', handler: 'applyStreakPenalty' },
  { type: 'streak_milestone', affects: 'avatar', handler: 'applyStreakBonus' },
  {
    type: 'blocker_resolved',
    affects: 'avatar',
    handler: 'applyBlockerResolvedBonus',
  },
  { type: 'goal_achieved', affects: 'avatar', handler: 'applyGoalReward' },

  // World state
  { type: 'location_changed', affects: 'world', handler: 'updateLocation' },
  {
    type: 'availability_changed',
    affects: 'world',
    handler: 'updateAvailability',
  },
  {
    type: 'disruption_started',
    affects: 'world',
    handler: 'setDisruptionFlag',
  },
  {
    type: 'disruption_ended',
    affects: 'world',
    handler: 'clearDisruptionFlag',
  },

  // Both
  { type: 'day_started', affects: 'both', handler: 'morningReset' },
  { type: 'day_ended', affects: 'both', handler: 'eveningReconcile' },
];

// ===========================================================================
// Surprise Event Defaults
// ===========================================================================

/**
 * Default impacts for surprise events by category
 */
export const SURPRISE_EVENT_DEFAULTS: Record<
  'positive' | 'negative' | 'neutral',
  { avatar?: AvatarImpact; world?: WorldImpact }
> = {
  positive: {
    avatar: { energy: 3, stress: -2, xp: 1 },
  },
  negative: {
    avatar: { energy: -5, stress: 5 },
    world: { disrupted: true },
  },
  neutral: {
    // Log only, no impact
  },
};

// ===========================================================================
// Event Log Entry
// ===========================================================================

export interface EventLogEntry {
  ts: string;
  type: string;
  taskId?: string;
  sessionId?: string;
  category?: 'positive' | 'negative' | 'neutral';
  description?: string;
  impact: {
    avatar?: AvatarImpact;
    world?: WorldImpact;
  };
  source?: 'system' | 'user' | 'llm';
}

// ===========================================================================
// Event Processing Functions
// ===========================================================================

/**
 * Find a known event by type
 */
export function findKnownEvent(eventType: string): KnownEvent | undefined {
  return KNOWN_EVENTS.find((e) => e.type === eventType);
}

/**
 * Check if an event type is known
 */
export function isKnownEventType(eventType: string): boolean {
  return KNOWN_EVENTS.some((e) => e.type === eventType);
}

/**
 * Get default impact for a surprise event
 */
export function getSurpriseEventDefaults(
  category: 'positive' | 'negative' | 'neutral'
): { avatar?: AvatarImpact; world?: WorldImpact } {
  return SURPRISE_EVENT_DEFAULTS[category];
}

/**
 * Validate a surprise event structure
 */
export function validateSurpriseEvent(event: unknown): {
  valid: boolean;
  error?: string;
  event?: SurpriseEvent;
} {
  if (!event || typeof event !== 'object') {
    return { valid: false, error: 'Event must be an object' };
  }

  const e = event as Record<string, unknown>;

  if (e.type !== 'surprise') {
    return { valid: false, error: 'Surprise event must have type="surprise"' };
  }

  if (!['positive', 'negative', 'neutral'].includes(e.category as string)) {
    return {
      valid: false,
      error: 'Surprise event category must be positive, negative, or neutral',
    };
  }

  if (!e.description || typeof e.description !== 'string') {
    return { valid: false, error: 'Surprise event must have a description' };
  }

  if (!['avatar', 'world', 'both'].includes(e.affects as string)) {
    return {
      valid: false,
      error: 'Surprise event affects must be avatar, world, or both',
    };
  }

  return {
    valid: true,
    event: {
      type: 'surprise',
      category: e.category as 'positive' | 'negative' | 'neutral',
      description: e.description as string,
      affects: e.affects as EventAffects,
      suggestedImpact: e.suggestedImpact as SurpriseEvent['suggestedImpact'],
    },
  };
}

/**
 * Create an event log entry
 */
export function createEventLogEntry(
  eventType: string,
  impact: { avatar?: AvatarImpact; world?: WorldImpact },
  data?: {
    taskId?: string;
    sessionId?: string;
    category?: 'positive' | 'negative' | 'neutral';
    description?: string;
    source?: 'system' | 'user' | 'llm';
  }
): EventLogEntry {
  return {
    ts: new Date().toISOString(),
    type: eventType,
    ...data,
    impact,
  };
}

/**
 * Calculate combined impact from event
 */
export function calculateEventImpact(
  eventType: string,
  data?: Record<string, unknown>
): { avatar?: AvatarImpact; world?: WorldImpact } {
  // For surprise events, use defaults or suggested impact
  if (eventType === 'surprise' && data) {
    const category = data.category as 'positive' | 'negative' | 'neutral';
    const defaults = SURPRISE_EVENT_DEFAULTS[category];
    const suggested = data.suggestedImpact as
      | {
          avatar?: AvatarImpact;
          world?: WorldImpact;
        }
      | undefined;

    // Merge defaults with suggested, suggested takes precedence
    return {
      avatar: { ...defaults.avatar, ...suggested?.avatar },
      world: { ...defaults.world, ...suggested?.world },
    };
  }

  // For known events, return placeholder (actual handlers will calculate)
  const known = findKnownEvent(eventType);
  if (known) {
    // Return empty - actual calculation done by handlers
    return {};
  }

  return {};
}

/**
 * Process an event and return result
 * (Pure function - actual state mutation happens in handlers)
 */
export function processEvent(
  eventType: string,
  data?: Record<string, unknown>
): EventResult {
  const timestamp = new Date().toISOString();

  // Check for known event
  const known = findKnownEvent(eventType);
  if (known) {
    return {
      success: true,
      eventType,
      timestamp,
      impact: calculateEventImpact(eventType, data),
    };
  }

  // Check for surprise event
  if (eventType === 'surprise') {
    const validation = validateSurpriseEvent(data);
    if (!validation.valid) {
      return {
        success: false,
        eventType,
        timestamp,
        error: validation.error,
      };
    }

    return {
      success: true,
      eventType,
      timestamp,
      impact: calculateEventImpact(eventType, data),
    };
  }

  // Unknown event type
  return {
    success: false,
    eventType,
    timestamp,
    error: `Unknown event type: ${eventType}. Use 'surprise' for unexpected events.`,
  };
}

/**
 * Get all event types (for documentation/tooling)
 */
export function getAllEventTypes(): string[] {
  return [...KNOWN_EVENTS.map((e) => e.type), 'surprise'];
}

/**
 * Get events that affect a specific target
 */
export function getEventsAffecting(target: 'avatar' | 'world'): KnownEvent[] {
  return KNOWN_EVENTS.filter(
    (e) => e.affects === target || e.affects === 'both'
  );
}
