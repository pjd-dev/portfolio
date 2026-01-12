/**
 * COD Profiles
 *
 * Profiles allow tuning heuristics without changing existing behavior.
 * Current profiles:
 * - basic: default, baseline heuristics (existing behavior)
 * - adhd: future variant with alternative tuning
 *
 * NOTE: Behavior remains identical for the default profile (basic) until
 * profile-specific logic is introduced.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INVARIANT: PROFILE-AGNOSTIC VALIDATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Validation rules and enforcement behavior MUST be profile-agnostic.
 * Profiles MUST NOT change PASS/WARN/FAIL outcomes.
 *
 * What profiles CAN change:
 * - Heuristic weights (task scoring, ranking)
 * - Session duration recommendations
 * - Break frequency suggestions
 * - UI display preferences
 * - Notification thresholds
 *
 * What profiles CANNOT change:
 * - PASS/WARN/FAIL validation outcomes
 * - Required field validation
 * - Status transition rules
 * - HARD_STOP enforcement
 * - Blocker detection
 * - Dependency validation
 *
 * This invariant ensures:
 * 1. Predictable validation behavior across all profiles
 * 2. Tests work regardless of active profile
 * 3. No "special case" validation for specific profiles
 * 4. Clear separation between validation (immutable) and heuristics (tunable)
 *
 * Enforcement: CODValidator ignores profile for all validate* methods.
 * Profile is only used in predictions, recommendations, and scoring.
 * ═══════════════════════════════════════════════════════════════════════════
 */
export type CodProfile = 'basic' | 'adhd';

export const DEFAULT_COD_PROFILE: CodProfile = 'basic';

/**
 * Profile-specific tuning parameters.
 * These affect heuristics ONLY, never validation outcomes.
 */
export interface ProfileTuning {
  /** Session duration suggestions (minutes) */
  sessionDurationSuggestions: {
    min: number;
    ideal: number;
    max: number;
  };

  /** Break frequency (minutes between breaks) */
  breakInterval: number;

  /** Task scoring weights */
  scoringWeights: {
    priority: number;
    effort: number;
    focusCost: number;
    goalAlignment: number;
  };

  /** Energy thresholds for recommendations */
  energyThresholds: {
    low: number; // Below this = suggest break
    high: number; // Above this = can tackle hard tasks
  };
}

/**
 * Default tuning for 'basic' profile
 */
export const BASIC_PROFILE_TUNING: ProfileTuning = {
  sessionDurationSuggestions: { min: 25, ideal: 50, max: 90 },
  breakInterval: 50,
  scoringWeights: {
    priority: 1.0,
    effort: 0.8,
    focusCost: 0.7,
    goalAlignment: 0.9,
  },
  energyThresholds: { low: 0.3, high: 0.7 },
};

/**
 * Tuning for 'adhd' profile (shorter sessions, more frequent breaks)
 */
export const ADHD_PROFILE_TUNING: ProfileTuning = {
  sessionDurationSuggestions: { min: 15, ideal: 25, max: 45 },
  breakInterval: 25,
  scoringWeights: {
    priority: 1.0,
    effort: 1.0,
    focusCost: 1.2,
    goalAlignment: 0.8,
  },
  energyThresholds: { low: 0.4, high: 0.6 },
};

/**
 * Get tuning parameters for a profile.
 * Returns tuning that affects heuristics, NOT validation.
 */
export function getProfileTuning(profile: CodProfile): ProfileTuning {
  switch (profile) {
    case 'adhd':
      return ADHD_PROFILE_TUNING;
    case 'basic':
    default:
      return BASIC_PROFILE_TUNING;
  }
}
