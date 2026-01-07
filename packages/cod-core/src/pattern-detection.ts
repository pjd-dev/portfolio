/**
 * Pattern Detection
 *
 * Find recurring patterns in work habits:
 * - Best times of day for different task types
 * - Which tasks often spawn follow-ups
 * - Context switch patterns
 * - Procrastination indicators
 *
 * Used by: Session planning, task recommendations
 */

export interface TaskTypePattern {
  /** Task type/tag */
  taskType: string;

  /** How often does this appear in execution history? */
  frequency: number; // 0-1 (percentage of all tasks)

  /** Average duration when completed (minutes) */
  avgDuration: number;

  /** Completion rate (0-1) */
  completionRate: number;

  /** Most successful start hours (0-23) */
  bestHours: number[];

  /** Most failed start hours */
  worstHours: number[];

  /** Does this task type spawn follow-ups? */
  spawnsFollowUps: boolean;

  /** Follow-up rate (0-1) */
  followUpRate?: number;

  /** Common follow-up task types */
  commonFollowUps?: string[];

  /** Human state when task performs best */
  optimalState?: {
    energy?: [number, number];
    stress?: [number, number];
    focus?: [number, number];
  };
}

export interface WorkHabitPattern {
  /** Pattern name */
  name: string;

  /** Pattern description */
  description: string;

  /** How consistently does this occur? (0-1) */
  consistency: number;

  /** When was pattern first observed */
  firstObserved: string; // ISO

  /** How long has pattern persisted */
  ageInDays: number;

  /** Type of pattern */
  type:
    | 'context-switch'
    | 'procrastination'
    | 'energy-crash'
    | 'focus-loss'
    | 'momentum-build'
    | 'other';
}

/**
 * Detect task type patterns from execution history
 */
export function analyzeTaskTypePattern(data: {
  taskType: string;
  totalCount: number;
  completedCount: number;
  avgDuration: number;
  executionsByHour: Record<number, { count: number; completed: number }>; // hour -> stats
  followUpTasks: { type: string; count: number }[];
  allTasksCount: number;
}): TaskTypePattern {
  const {
    taskType,
    totalCount,
    completedCount,
    avgDuration,
    executionsByHour,
    followUpTasks,
    allTasksCount,
  } = data;

  // Find best and worst hours
  const hours = Object.entries(executionsByHour).map(([hour, stats]) => ({
    hour: parseInt(hour),
    successRate: stats.count > 0 ? stats.completed / stats.count : 0,
  }));

  hours.sort((a, b) => b.successRate - a.successRate);

  const bestHours = hours
    .slice(0, Math.ceil(hours.length / 3))
    .map((h) => h.hour)
    .sort((a, b) => a - b);

  const worstHours = hours
    .slice(-Math.ceil(hours.length / 3))
    .map((h) => h.hour)
    .sort((a, b) => a - b);

  // Follow-up analysis
  const spawnsFollowUps = followUpTasks.length > 0;
  const totalFollowUps = followUpTasks.reduce((sum, f) => sum + f.count, 0);
  const followUpRate = completedCount > 0 ? totalFollowUps / completedCount : 0;

  const commonFollowUps = followUpTasks
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((f) => f.type);

  return {
    taskType,
    frequency: totalCount / allTasksCount,
    avgDuration,
    completionRate: totalCount > 0 ? completedCount / totalCount : 0,
    bestHours,
    worstHours,
    spawnsFollowUps,
    followUpRate: spawnsFollowUps ? followUpRate : undefined,
    commonFollowUps: spawnsFollowUps ? commonFollowUps : undefined,
  };
}

/**
 * Detect work habit patterns (procrastination, energy crashes, etc)
 */
export function detectWorkHabitPatterns(data: {
  recentExecutions: Array<{
    taskId: string;
    plannedDuration: number;
    actualDuration: number;
    completed: boolean;
    startedAt: string; // ISO
    qualityRating?: number;
  }>;
  humanStateHistory: Array<{
    timestamp: string; // ISO
    energy: number;
    stress: number;
    focus: number;
  }>;
  baselineDate: string; // ISO, when to start counting age
}): WorkHabitPattern[] {
  const patterns: WorkHabitPattern[] = [];
  const { recentExecutions, humanStateHistory, baselineDate } = data;

  // Pattern 1: Context Switching
  const contextSwitches = recentExecutions.filter(
    (e) => e.actualDuration < e.plannedDuration * 0.5
  );
  if (contextSwitches.length > recentExecutions.length * 0.3) {
    patterns.push({
      name: 'Frequent Context Switching',
      description: `${Math.round((contextSwitches.length / recentExecutions.length) * 100)}% of tasks end early (context switch suspected)`,
      consistency: contextSwitches.length / recentExecutions.length,
      firstObserved: contextSwitches[0]?.startedAt || new Date().toISOString(),
      ageInDays: Math.floor(
        (new Date().getTime() - new Date(baselineDate).getTime()) /
          (24 * 60 * 60 * 1000)
      ),
      type: 'context-switch',
    });
  }

  // Pattern 2: Procrastination (tasks take 2x longer than planned)
  const overruns = recentExecutions.filter(
    (e) => e.actualDuration > e.plannedDuration * 2
  );
  if (overruns.length > recentExecutions.length * 0.3) {
    patterns.push({
      name: 'Procrastination Pattern',
      description: `${Math.round((overruns.length / recentExecutions.length) * 100)}% of tasks take 2x longer than planned`,
      consistency: overruns.length / recentExecutions.length,
      firstObserved: overruns[0]?.startedAt || new Date().toISOString(),
      ageInDays: Math.floor(
        (new Date().getTime() - new Date(baselineDate).getTime()) /
          (24 * 60 * 60 * 1000)
      ),
      type: 'procrastination',
    });
  }

  // Pattern 3: Energy Crash (declining energy in afternoon)
  const morningEnergy = humanStateHistory
    .filter((h) => new Date(h.timestamp).getHours() < 12)
    .map((h) => h.energy);
  const afternoonEnergy = humanStateHistory
    .filter((h) => new Date(h.timestamp).getHours() >= 12)
    .map((h) => h.energy);

  const morningAvg =
    morningEnergy.length > 0
      ? morningEnergy.reduce((a, b) => a + b, 0) / morningEnergy.length
      : 0.5;
  const afternoonAvg =
    afternoonEnergy.length > 0
      ? afternoonEnergy.reduce((a, b) => a + b, 0) / afternoonEnergy.length
      : 0.5;

  if (morningAvg - afternoonAvg > 0.2) {
    patterns.push({
      name: 'Afternoon Energy Crash',
      description: `Morning energy ${Math.round(morningAvg * 100)}% vs afternoon ${Math.round(afternoonAvg * 100)}% (20%+ decline)`,
      consistency: Math.min(1, (morningAvg - afternoonAvg) / 0.4),
      firstObserved: new Date().toISOString(),
      ageInDays: Math.max(
        1,
        Math.floor(
          (new Date().getTime() - new Date(baselineDate).getTime()) /
            (24 * 60 * 60 * 1000)
        )
      ),
      type: 'energy-crash',
    });
  }

  // Pattern 4: Focus Loss (high stress correlates with low task quality)
  const lowQualityHighStress = recentExecutions
    .filter((e) => e.qualityRating && e.qualityRating <= 2)
    .filter((e) => {
      const state = humanStateHistory.find(
        (h) =>
          new Date(h.timestamp).getTime() >= new Date(e.startedAt).getTime()
      );
      return state && state.stress > 0.6;
    });

  if (
    lowQualityHighStress.length >
    recentExecutions.filter((e) => e.qualityRating).length * 0.2
  ) {
    patterns.push({
      name: 'Focus Loss Under Stress',
      description: `${Math.round((lowQualityHighStress.length / recentExecutions.length) * 100)}% of low-quality tasks occur during high stress`,
      consistency: lowQualityHighStress.length / recentExecutions.length,
      firstObserved:
        lowQualityHighStress[0]?.startedAt || new Date().toISOString(),
      ageInDays: Math.floor(
        (new Date().getTime() - new Date(baselineDate).getTime()) /
          (24 * 60 * 60 * 1000)
      ),
      type: 'focus-loss',
    });
  }

  return patterns;
}
