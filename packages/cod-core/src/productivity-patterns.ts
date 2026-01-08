/**
 * Productivity Patterns
 *
 * Learn productivity patterns by time-of-day and day-of-week.
 * Track task completion rate by hour and day.
 * Enable suggesting optimal work windows and avoiding low-productivity slots.
 *
 * Spec: projects/COD/19-Productivity-Patterns-Spec.md
 *
 * Storage:
 * - _log/cod/productivity.ndjson - Raw productivity entries
 * - _state/cod/productivity-patterns.json - Computed patterns
 */

// ============================================================================
// Types (from spec)
// ============================================================================

/**
 * Raw productivity entry recorded after each session
 */
export interface ProductivityEntry {
  /** ISO timestamp when session ended */
  ts: string;

  /** Hour of day (0-23) when session started */
  hourOfDay: number;

  /** Day of week (0-6, Sun=0) when session started */
  dayOfWeek: number;

  // Metrics
  /** Number of tasks completed in session */
  tasksCompleted: number;

  /** Total effort completed */
  effortCompleted: number;

  /** Session duration in minutes */
  sessionDurationMin: number;

  /** Completion rate: completed / planned (0-1) */
  completionRate: number;

  // Context
  /** Session ID for traceability */
  sessionId: string;

  /** Human state energy at session start (optional) */
  humanStateEnergy?: number;

  /** Human state focus capacity at session start (optional) */
  humanStateFocus?: string;
}

/**
 * Aggregated stats for a specific hour
 */
export interface HourPattern {
  /** Hour (0-23) */
  hour: number;

  /** Average completion rate across all sessions starting at this hour */
  avgCompletionRate: number;

  /** Average tasks completed per session */
  avgTasksCompleted: number;

  /** Number of data points (sessions) */
  dataPoints: number;

  /** Quality classification based on completion rate */
  quality: 'high' | 'medium' | 'low';
}

/**
 * Aggregated stats for a specific day of week
 */
export interface DayPattern {
  /** Day of week (0-6, Sun=0) */
  day: number;

  /** Day name */
  dayName: string;

  /** Average completion rate */
  avgCompletionRate: number;

  /** Average tasks completed */
  avgTasksCompleted: number;

  /** Number of data points */
  dataPoints: number;

  /** Quality classification */
  quality: 'high' | 'medium' | 'low';
}

/**
 * Computed productivity patterns
 */
export interface ProductivityPatterns {
  /** ISO timestamp when patterns were computed */
  asOf: string;

  /** Total number of data points used */
  totalDataPoints: number;

  /** Patterns by hour (0-23) */
  byHour: HourPattern[];

  /** Patterns by day of week (0-6) */
  byDay: DayPattern[];

  // Recommendations
  /** Best 3 hours (by completion rate) */
  peakHours: number[];

  /** Worst 3 hours (by completion rate) */
  avoidHours: number[];

  /** Best 2 days (by completion rate) */
  peakDays: number[];

  /** Worst 2 days (by completion rate) */
  avoidDays: number[];

  // Summary
  /** Human-readable best time slot, e.g. "Monday-Wednesday 9:00-11:00" */
  bestTimeSlot?: string;

  /** Human-readable worst time slot */
  worstTimeSlot?: string;
}

// ============================================================================
// Storage paths
// ============================================================================

/** NDJSON log of productivity entries */
export const PRODUCTIVITY_LOG_PATH = '_log/cod/productivity.ndjson';

/** JSON file with computed patterns */
export const PRODUCTIVITY_PATTERNS_PATH =
  '_state/cod/productivity-patterns.json';

// ============================================================================
// Constants
// ============================================================================

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

// ============================================================================
// Session type for recording (minimal interface)
// ============================================================================

/**
 * Minimal session interface for productivity recording
 */
export interface SessionForProductivity {
  /** Session ID */
  id: string;

  /** ISO timestamp when session started */
  startedAt: string;

  /** ISO timestamp when session ended */
  endedAt: string;

  /** Tasks in the session */
  tasks: Array<{
    status: 'pending' | 'in-progress' | 'done' | 'blocked' | 'deferred';
    effortScore?: number;
  }>;
}

/**
 * Minimal human state snapshot for productivity recording
 */
export interface ProductivityHumanState {
  energy?: number;
  focusCapacity?: string;
}

// ============================================================================
// Helper functions
// ============================================================================

/**
 * Calculate minutes between two ISO timestamps
 */
function diffMinutes(endIso: string, startIso: string): number {
  const end = new Date(endIso).getTime();
  const start = new Date(startIso).getTime();
  return Math.round((end - start) / 60000);
}

/**
 * Calculate mean of numbers
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Classify quality based on completion rate
 */
function classifyQuality(avgCompletionRate: number): 'high' | 'medium' | 'low' {
  if (avgCompletionRate > 0.8) return 'high';
  if (avgCompletionRate > 0.5) return 'medium';
  return 'low';
}

/**
 * Group array by key function
 */
function groupBy<T>(items: T[], keyFn: (item: T) => number): Map<number, T[]> {
  const map = new Map<number, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const group = map.get(key) ?? [];
    group.push(item);
    map.set(key, group);
  }
  return map;
}

// ============================================================================
// Core functions (from spec)
// ============================================================================

/**
 * Create a ProductivityEntry from session data
 *
 * Call this when a session ends to record productivity metrics.
 */
export function createProductivityEntry(
  session: SessionForProductivity,
  humanState?: ProductivityHumanState
): ProductivityEntry {
  const startTime = new Date(session.startedAt);
  const completed = session.tasks.filter((t) => t.status === 'done');
  const planned = session.tasks.length;

  const entry: ProductivityEntry = {
    ts: session.endedAt,
    hourOfDay: startTime.getHours(),
    dayOfWeek: startTime.getDay(),
    tasksCompleted: completed.length,
    effortCompleted: completed.reduce(
      (sum, t) => sum + (t.effortScore ?? 3),
      0
    ),
    sessionDurationMin: diffMinutes(session.endedAt, session.startedAt),
    completionRate: planned > 0 ? completed.length / planned : 0,
    sessionId: session.id,
    humanStateEnergy: humanState?.energy,
    humanStateFocus: humanState?.focusCapacity,
  };

  return entry;
}

/**
 * Compute productivity patterns from entries
 *
 * Call this after recording new entries to update the aggregated patterns.
 */
export function computeProductivityPatterns(
  entries: ProductivityEntry[]
): ProductivityPatterns {
  if (entries.length === 0) {
    return {
      asOf: new Date().toISOString(),
      totalDataPoints: 0,
      byHour: [],
      byDay: [],
      peakHours: [],
      avoidHours: [],
      peakDays: [],
      avoidDays: [],
    };
  }

  // Group by hour
  const byHourGroups = groupBy(entries, (e) => e.hourOfDay);
  const byHour: HourPattern[] = [];

  for (let h = 0; h < 24; h++) {
    const group = byHourGroups.get(h) ?? [];
    if (group.length === 0) continue;

    const avgRate = mean(group.map((e) => e.completionRate));
    byHour.push({
      hour: h,
      avgCompletionRate: avgRate,
      avgTasksCompleted: mean(group.map((e) => e.tasksCompleted)),
      dataPoints: group.length,
      quality: classifyQuality(avgRate),
    });
  }

  // Group by day
  const byDayGroups = groupBy(entries, (e) => e.dayOfWeek);
  const byDay: DayPattern[] = [];

  for (let d = 0; d < 7; d++) {
    const group = byDayGroups.get(d) ?? [];
    if (group.length === 0) continue;

    const avgRate = mean(group.map((e) => e.completionRate));
    byDay.push({
      day: d,
      dayName: DAY_NAMES[d],
      avgCompletionRate: avgRate,
      avgTasksCompleted: mean(group.map((e) => e.tasksCompleted)),
      dataPoints: group.length,
      quality: classifyQuality(avgRate),
    });
  }

  // Find peaks and valleys
  const sortedHours = [...byHour].sort(
    (a, b) => b.avgCompletionRate - a.avgCompletionRate
  );
  const sortedDays = [...byDay].sort(
    (a, b) => b.avgCompletionRate - a.avgCompletionRate
  );

  const peakHours = sortedHours.slice(0, 3).map((h) => h.hour);
  const avoidHours = sortedHours.slice(-3).map((h) => h.hour);
  const peakDays = sortedDays.slice(0, 2).map((d) => d.day);
  const avoidDays = sortedDays.slice(-2).map((d) => d.day);

  // Generate summary
  let bestTimeSlot: string | undefined;
  let worstTimeSlot: string | undefined;

  if (peakHours.length > 0 && peakDays.length > 0) {
    const peakDayNames = peakDays.map((d) => DAY_NAMES[d]).join('-');
    const peakHourRange = `${peakHours[0]}:00-${peakHours[0] + 2}:00`;
    bestTimeSlot = `${peakDayNames} ${peakHourRange}`;
  }

  if (avoidHours.length > 0 && avoidDays.length > 0) {
    const avoidDayNames = avoidDays.map((d) => DAY_NAMES[d]).join('-');
    const avoidHourRange = `${avoidHours[0]}:00-${avoidHours[0] + 2}:00`;
    worstTimeSlot = `${avoidDayNames} ${avoidHourRange}`;
  }

  return {
    asOf: new Date().toISOString(),
    totalDataPoints: entries.length,
    byHour,
    byDay,
    peakHours,
    avoidHours,
    peakDays,
    avoidDays,
    bestTimeSlot,
    worstTimeSlot,
  };
}

/**
 * Get a productivity warning for a planned time
 *
 * Returns a warning message if the planned time falls in a low-productivity slot.
 */
export function getProductivityWarning(
  plannedTime: Date,
  patterns: ProductivityPatterns
): string | undefined {
  const hour = plannedTime.getHours();
  const day = plannedTime.getDay();

  // Check avoid hours
  if (patterns.avoidHours.includes(hour)) {
    const hourPattern = patterns.byHour.find((h) => h.hour === hour);
    const avgRate = hourPattern?.avgCompletionRate ?? 0;
    return `Hour ${hour}:00 has ${Math.round(avgRate * 100)}% completion rate — consider rescheduling`;
  }

  // Check avoid days
  if (patterns.avoidDays.includes(day)) {
    const dayPattern = patterns.byDay.find((d) => d.day === day);
    const dayName = DAY_NAMES[day];
    const avgRate = dayPattern?.avgCompletionRate ?? 0;
    return `${dayName} has ${Math.round(avgRate * 100)}% completion rate — lighter session recommended`;
  }

  return undefined;
}

// ============================================================================
// Utility functions for display
// ============================================================================

/**
 * Format patterns for human-readable display
 */
export function formatProductivityPatterns(
  patterns: ProductivityPatterns
): string {
  const lines: string[] = [];

  lines.push('# Productivity Patterns\n');
  lines.push(`**Last updated:** ${new Date(patterns.asOf).toLocaleString()}`);
  lines.push(`**Data points:** ${patterns.totalDataPoints}\n`);

  // Summary
  if (patterns.bestTimeSlot) {
    lines.push(`✅ **Best time slot:** ${patterns.bestTimeSlot}`);
  }
  if (patterns.worstTimeSlot) {
    lines.push(`⚠️ **Avoid:** ${patterns.worstTimeSlot}`);
  }
  lines.push('');

  // Peak/Avoid recommendations
  if (patterns.peakHours.length > 0) {
    lines.push(
      `**Peak hours:** ${patterns.peakHours.map((h) => `${h}:00`).join(', ')}`
    );
  }
  if (patterns.avoidHours.length > 0) {
    lines.push(
      `**Low hours:** ${patterns.avoidHours.map((h) => `${h}:00`).join(', ')}`
    );
  }
  if (patterns.peakDays.length > 0) {
    lines.push(
      `**Peak days:** ${patterns.peakDays.map((d) => DAY_NAMES[d]).join(', ')}`
    );
  }
  if (patterns.avoidDays.length > 0) {
    lines.push(
      `**Low days:** ${patterns.avoidDays.map((d) => DAY_NAMES[d]).join(', ')}`
    );
  }
  lines.push('');

  // Hourly breakdown
  if (patterns.byHour.length > 0) {
    lines.push('## By Hour\n');
    lines.push('| Hour | Completion | Tasks | Data | Quality |');
    lines.push('|------|------------|-------|------|---------|');
    for (const h of patterns.byHour.sort((a, b) => a.hour - b.hour)) {
      lines.push(
        `| ${h.hour}:00 | ${Math.round(h.avgCompletionRate * 100)}% | ${h.avgTasksCompleted.toFixed(1)} | ${h.dataPoints} | ${h.quality} |`
      );
    }
    lines.push('');
  }

  // Daily breakdown
  if (patterns.byDay.length > 0) {
    lines.push('## By Day\n');
    lines.push('| Day | Completion | Tasks | Data | Quality |');
    lines.push('|-----|------------|-------|------|---------|');
    for (const d of patterns.byDay.sort((a, b) => a.day - b.day)) {
      lines.push(
        `| ${d.dayName} | ${Math.round(d.avgCompletionRate * 100)}% | ${d.avgTasksCompleted.toFixed(1)} | ${d.dataPoints} | ${d.quality} |`
      );
    }
  }

  return lines.join('\n');
}

/**
 * Get scheduling recommendation based on patterns
 */
export function getSchedulingRecommendation(
  patterns: ProductivityPatterns,
  plannedTime?: Date
): {
  recommended: boolean;
  warning?: string;
  suggestion?: string;
} {
  if (patterns.totalDataPoints < 5) {
    return {
      recommended: true,
      suggestion:
        'Not enough data yet — record more sessions to get personalized recommendations',
    };
  }

  if (plannedTime) {
    const warning = getProductivityWarning(plannedTime, patterns);
    if (warning) {
      return {
        recommended: false,
        warning,
        suggestion: patterns.bestTimeSlot
          ? `Consider scheduling during ${patterns.bestTimeSlot} instead`
          : undefined,
      };
    }
  }

  return {
    recommended: true,
    suggestion: patterns.bestTimeSlot
      ? `Optimal time: ${patterns.bestTimeSlot}`
      : undefined,
  };
}
