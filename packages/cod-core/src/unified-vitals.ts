/**
 * Unified Vitals Module
 *
 * Single source of truth for vitals that both COD planning and Avatar gamification consume.
 * Human-State snapshot is the authoritative source; Avatar vitals are derived from it.
 *
 * Design:
 * - Human-State: Real-time state captured via morning/moment checks
 * - Avatar Vitals: Gamification view derived from Human-State + progression data
 * - Sync: Avatar vitals update automatically when Human-State changes
 */

import type {
  HumanStateSnapshot,
  FocusCapacity,
  WorldBand,
} from './human-state.js';

/**
 * Unified vitals that both systems consume
 */
export interface UnifiedVitals {
  /** ISO timestamp of last update */
  asOf: string;

  /** Energy level 0-1 (from Human-State) */
  energy: number;

  /** Stress level 0-1 (from Human-State) */
  stress: number;

  /** Derived health score 0-100 (computed from energy, stress, sleep) */
  health: number;

  /** Focus capacity category */
  focusCapacity: FocusCapacity;

  /** Sleep hours from last night */
  sleepHours: number;

  /** Available work time in minutes */
  timeAvailableMin: number;

  /** World health band (optional) */
  healthBand?: WorldBand;

  /** World runway band (optional) */
  runwayBand?: WorldBand;
}

/**
 * Avatar-specific vitals (gamification layer on top of unified vitals)
 */
export interface AvatarVitalsFromUnified extends UnifiedVitals {
  /** Money/currency (gamification only) */
  money?: number;

  /** Notoriety/reputation (gamification only) */
  notoriety?: number;

  /** Custom needs tracking (gamification only) */
  needs?: Record<string, number>;
}

/**
 * Compute health score from human state factors
 * Formula: weighted average of energy, inverse stress, and sleep quality
 *
 * @param energy - Energy level 0-1
 * @param stress - Stress level 0-1
 * @param sleepHours - Hours of sleep
 * @returns Health score 0-100
 */
export function computeHealthScore(
  energy: number,
  stress: number,
  sleepHours: number
): number {
  // Clamp inputs
  const e = Math.max(0, Math.min(1, energy));
  const s = Math.max(0, Math.min(1, stress));
  const sleep = Math.max(0, Math.min(12, sleepHours));

  // Sleep quality: optimal at 7-8 hours, degrades outside
  const sleepOptimal = 7.5;
  const sleepQuality = Math.max(
    0,
    1 - Math.abs(sleep - sleepOptimal) / sleepOptimal
  );

  // Weighted formula: energy 40%, inverse stress 35%, sleep 25%
  const raw = e * 0.4 + (1 - s) * 0.35 + sleepQuality * 0.25;

  // Scale to 0-100
  return Math.round(raw * 100);
}

/**
 * Derive unified vitals from Human-State snapshot
 * This is the single source of truth derivation function
 */
export function deriveUnifiedVitals(
  snapshot: HumanStateSnapshot
): UnifiedVitals {
  const health = computeHealthScore(
    snapshot.energy,
    snapshot.stress,
    snapshot.sleepHours
  );

  return {
    asOf: snapshot.ts,
    energy: snapshot.energy,
    stress: snapshot.stress,
    health,
    focusCapacity: snapshot.focusCapacity,
    sleepHours: snapshot.sleepHours,
    timeAvailableMin: snapshot.timeAvailableMin,
    healthBand: snapshot.healthBand,
    runwayBand: snapshot.runwayBand,
  };
}

/**
 * Convert unified vitals to Avatar vitals format
 * Adds gamification-specific fields with defaults
 */
export function toAvatarVitals(
  unified: UnifiedVitals,
  gamification?: {
    money?: number;
    notoriety?: number;
    needs?: Record<string, number>;
  }
): AvatarVitalsFromUnified {
  return {
    ...unified,
    money: gamification?.money ?? 0,
    notoriety: gamification?.notoriety ?? 0,
    needs: gamification?.needs,
  };
}

/**
 * Check if Avatar vitals need sync from Human-State
 * Returns true if Human-State is newer than Avatar vitals
 */
export function needsVitalsSync(
  humanStateTs: string,
  avatarVitalsAsOf?: string
): boolean {
  if (!avatarVitalsAsOf) return true;

  const humanDate = new Date(humanStateTs);
  const avatarDate = new Date(avatarVitalsAsOf);

  // If dates invalid, assume sync needed
  if (isNaN(humanDate.getTime()) || isNaN(avatarDate.getTime())) {
    return true;
  }

  return humanDate > avatarDate;
}

/**
 * Merge existing Avatar gamification data with new unified vitals
 */
export function mergeAvatarWithUnifiedVitals(
  existing: Partial<AvatarVitalsFromUnified>,
  unified: UnifiedVitals
): AvatarVitalsFromUnified {
  return {
    // Core vitals from unified (overwrite)
    ...unified,
    // Preserve gamification fields from existing
    money: existing.money ?? 0,
    notoriety: existing.notoriety ?? 0,
    needs: existing.needs,
  };
}
