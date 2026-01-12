import type { CodProfile } from './profile.js';
import { DEFAULT_COD_PROFILE } from './profile.js';

/**
 * HARD_STOP Guardrail: Prevent work during high-risk times (late night)
 *
 * Protects against:
 * - Late-night work (diminishing returns, sleep debt)
 * - Session continuation despite degraded state
 * - Productivity spirals into burnout
 *
 * Configuration:
 * - windowStart: Hour when HARD_STOP begins (default: 23, i.e., 11 PM)
 * - windowEnd: Hour when window ends (default: 7, i.e., 7 AM)
 * - allowOverride: Can user explicitly override? (default: true, with warning)
 */

export interface HardStopConfig {
  windowStart: number; // 0-23
  windowEnd: number; // 0-23
  allowOverride: boolean;
}

export interface HardStopCheckResult {
  blocked: boolean;
  reason?: string;
  window?: { start: string; end: string };
  timeUntilResume?: string;
  overridable: boolean;
}

const DEFAULT_CONFIG: HardStopConfig = {
  windowStart: 23, // 11 PM
  windowEnd: 7, // 7 AM
  allowOverride: true,
};

/**
 * Check if current time is within HARD_STOP window
 */
export function isHardStopActive(
  now: Date = new Date(),
  config: Partial<HardStopConfig> = {},
  _profile: CodProfile = DEFAULT_COD_PROFILE
): boolean {
  const { windowStart, windowEnd } = { ...DEFAULT_CONFIG, ...config };

  const hour = now.getHours();

  // Window wraps midnight (e.g., 23:00 to 07:00)
  if (windowStart > windowEnd) {
    return hour >= windowStart || hour < windowEnd;
  }

  // Window doesn't wrap
  return hour >= windowStart && hour < windowEnd;
}

/**
 * Get time until HARD_STOP window ends (when work resumes)
 */
export function timeUntilHardStopEnd(
  now: Date = new Date(),
  config: Partial<HardStopConfig> = {},
  _profile: CodProfile = DEFAULT_COD_PROFILE
): number {
  const { windowEnd } = { ...DEFAULT_CONFIG, ...config };

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentSeconds = now.getSeconds();

  // Convert to minutes since midnight
  const currentMinutes = currentHour * 60 + currentMinute;
  const endMinutes = windowEnd * 60;

  if (currentMinutes < endMinutes) {
    // Window hasn't wrapped yet today
    return endMinutes - currentMinutes;
  } else {
    // Window wraps to tomorrow morning
    const minutesUntilMidnight = 24 * 60 - currentMinutes;
    return minutesUntilMidnight + endMinutes;
  }
}

/**
 * Format window times as HH:MM strings
 */
function formatTime(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

/**
 * Format minutes into readable duration
 */
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Check HARD_STOP and return result with reason
 */
export function checkHardStop(
  now: Date = new Date(),
  config: Partial<HardStopConfig> = {},
  profile: CodProfile = DEFAULT_COD_PROFILE
): HardStopCheckResult {
  const merged = { ...DEFAULT_CONFIG, ...config };
  // profile reserved for future heuristics; current behavior is profile-agnostic
  const blocked = isHardStopActive(now, merged, profile);

  if (!blocked) {
    return {
      blocked: false,
      overridable: false,
    };
  }

  const minutesUntilResume = timeUntilHardStopEnd(now, merged, profile);
  const duration = formatDuration(minutesUntilResume);

  return {
    blocked: true,
    reason: `HARD_STOP active (${formatTime(merged.windowStart)} - ${formatTime(merged.windowEnd)}). Work blocked for ${duration}.`,
    window: {
      start: formatTime(merged.windowStart),
      end: formatTime(merged.windowEnd),
    },
    timeUntilResume: duration,
    overridable: merged.allowOverride,
  };
}

/**
 * Integration: Return HARD_STOP blocker for COD validation
 */
export function toValidationBlocker(
  result: HardStopCheckResult
): { blocking: boolean; reason: string } | null {
  if (!result.blocked) return null;

  return {
    blocking: result.overridable ? false : true, // Hard fail if not overridable
    reason:
      result.reason ||
      'HARD_STOP active - work blocked during late-night window',
  };
}
