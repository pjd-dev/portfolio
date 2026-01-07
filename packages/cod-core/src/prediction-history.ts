/**
 * COD Prediction Engine - Data Collection & History
 *
 * Foundation for prediction layer. Collects task execution history, outcomes,
 * human state time series, and productivity patterns for ML model training.
 *
 * Architecture:
 * - history.ts: Record task execution + outcomes (this file)
 * - human-state-series.ts: Time series of energy/stress/focus
 * - goal-projections.ts: Forecast completion dates based on velocity
 * - pattern-detection.ts: Find recurring patterns in work habits
 * - context-costs.ts: Measure time cost of context switching
 * - predictions.ts: Main prediction engine combining all signals
 *
 * Used by: ML layer (matrix operations, Markov chains)
 */

/**
 * Single task execution record
 *
 * Captured when:
 * - Task starts (planned_*)
 * - Task completes (actual_*)
 * - Session ends (session context)
 */
export interface TaskExecutionRecord {
  /** Unique task ID */
  taskId: string;

  /** When was execution recorded (ISO) */
  recordedAt: string;

  // Planning phase
  /** Effort estimate (1-10) */
  plannedEffort: number;

  /** Duration estimate (minutes) */
  plannedDuration: number;

  /** Priority at planning time (0-10) */
  plannedPriority: number;

  /** Goal this task was supposed to achieve */
  plannedGoalId?: string;

  // Execution phase
  /** Human state at task start */
  startHumanState?: {
    energy: number; // 0-1
    stress: number; // 0-1
    focus: number; // 0-1
  };

  /** Actual effort perceived (1-10) - only if completed */
  actualEffort?: number;

  /** Actual duration in minutes - only if completed */
  actualDuration?: number;

  /** Did task complete? */
  completed: boolean;

  /** If not completed, why? */
  incompletionReason?: 'blocked' | 'deprioritized' | 'context-switch' | 'other';

  // Session context
  /** Which session was task part of? */
  sessionId?: string;

  /** Position in session (0, 1, 2...) */
  sessionPosition?: number;

  /** Human state at task end */
  endHumanState?: {
    energy: number;
    stress: number;
    focus: number;
  };

  /** Did context-switch happen during task? (task changed) */
  hadContextSwitch?: boolean;

  /** Did external interrupt happen? (notification, ping) */
  hadInterrupt?: boolean;

  // Outcome metadata
  /** Quality rating (1-5) - provided by user in review */
  qualityRating?: number;

  /** Learnings from task (from review) */
  learnings?: string;

  /** Follow-up tasks spawned by this task */
  followUpTaskIds?: string[];
}

/**
 * Task execution statistics over time
 *
 * Used for:
 * - Duration prediction (linear regression on ~50 recent tasks)
 * - Effort accuracy (do estimates match reality?)
 * - Completion rates (what % of tasks finish?)
 * - Context switch impact (how much does it slow us down?)
 */
export interface TaskExecutionStats {
  taskId: string;

  // Basic metrics
  totalAttempts: number;
  completions: number;
  completionRate: number; // 0-1

  // Duration insights
  avgEstimatedDuration: number; // minutes
  avgActualDuration: number; // minutes
  durationAccuracy: number; // actual/estimated ratio (1.0 = perfect)
  durationVariance: number; // std dev of actuals

  // Effort insights
  avgEstimatedEffort: number; // 1-10
  avgActualEffort: number; // 1-10
  effortAccuracy: number; // actual/estimated

  // Quality
  avgQualityRating?: number; // 1-5

  // Context impact
  avgDurationWithSwitch?: number;
  avgDurationWithoutSwitch?: number;
  contextSwitchCost?: number; // additional minutes

  // Timing patterns
  successfulStartHours?: number[]; // hours of day when task usually succeeds (0-23)
  failedStartHours?: number[];

  // Learning curve
  recentAccuracy?: number; // accuracy of last 5 attempts
  overallTrend?: 'improving' | 'stable' | 'declining';

  // Time series
  lastCompletedAt?: string; // ISO
  consecutiveFailures: number;
}

/**
 * Collect execution data after task completes/fails
 */
export function recordTaskExecution(
  taskId: string,
  data: {
    planned: {
      effort: number;
      duration: number;
      priority: number;
      goalId?: string;
    };
    execution: {
      started: string; // ISO
      ended: string; // ISO
      completed: boolean;
      incompletionReason?: string;
    };
    humanState?: {
      start?: { energy: number; stress: number; focus: number };
      end?: { energy: number; stress: number; focus: number };
    };
    session?: {
      sessionId: string;
      position: number;
    };
    outcome?: {
      effort?: number;
      quality?: number;
      learnings?: string;
    };
    disruptions?: {
      contextSwitch: boolean;
      interrupt: boolean;
    };
  }
): TaskExecutionRecord {
  const planned = new Date(data.execution.started);
  const actual = Math.ceil(
    (new Date(data.execution.ended).getTime() - planned.getTime()) / 60000
  );

  return {
    taskId,
    recordedAt: new Date().toISOString(),
    plannedEffort: data.planned.effort,
    plannedDuration: data.planned.duration,
    plannedPriority: data.planned.priority,
    plannedGoalId: data.planned.goalId,
    actualEffort: data.outcome?.effort,
    actualDuration: actual,
    completed: data.execution.completed,
    incompletionReason: (data.execution.incompletionReason as any) || undefined,
    sessionId: data.session?.sessionId,
    sessionPosition: data.session?.position,
    startHumanState: data.humanState?.start,
    endHumanState: data.humanState?.end,
    hadContextSwitch: data.disruptions?.contextSwitch,
    hadInterrupt: data.disruptions?.interrupt,
    qualityRating: data.outcome?.quality,
    learnings: data.outcome?.learnings,
  };
}

/**
 * Session execution record for ML training
 */
export interface SessionExecutionRecord {
  /** Session ID */
  sessionId: string;

  /** When was session recorded (ISO) */
  recordedAt: string;

  /** Session start time */
  startedAt: string;

  /** Session end time */
  endedAt: string;

  /** Actual duration (minutes) */
  actualDuration: number;

  /** Did session complete as planned? */
  completed: boolean;

  /** Completion status */
  status: 'completed' | 'aborted';

  // Planning phase
  /** Planned task count */
  plannedTasks: number;

  /** Planned effort total */
  plannedEffort: number;

  /** Planned reward total */
  plannedReward: number;

  // Outcome
  /** Tasks completed */
  completedTasks: number;

  /** Actual effort total */
  actualEffort: number;

  /** Actual reward total */
  actualReward: number;

  /** Completion rate (0-1) */
  completionRate: number;

  /** Human state at session start */
  startHumanState?: {
    energy: number;
    stress: number;
    focus: number;
  };

  /** Human state at session end */
  endHumanState?: {
    energy: number;
    stress: number;
    focus: number;
  };
}

/**
 * Record session execution data after session ends
 */
export function recordSessionOutcome(
  sessionId: string,
  data: {
    startedAt: string;
    endedAt: string;
    status: 'completed' | 'aborted';
    planned: {
      tasks: number;
      effort: number;
      reward: number;
    };
    actual: {
      tasks: number;
      effort: number;
      reward: number;
    };
    humanState?: {
      start?: { energy: number; stress: number; focus: number };
      end?: { energy: number; stress: number; focus: number };
    };
  }
): SessionExecutionRecord {
  const started = new Date(data.startedAt);
  const ended = new Date(data.endedAt);
  const actualDuration = Math.ceil(
    (ended.getTime() - started.getTime()) / 60000
  );

  return {
    sessionId,
    recordedAt: new Date().toISOString(),
    startedAt: data.startedAt,
    endedAt: data.endedAt,
    actualDuration,
    completed: data.status === 'completed',
    status: data.status,
    plannedTasks: data.planned.tasks,
    plannedEffort: data.planned.effort,
    plannedReward: data.planned.reward,
    completedTasks: data.actual.tasks,
    actualEffort: data.actual.effort,
    actualReward: data.actual.reward,
    completionRate:
      data.planned.tasks > 0 ? data.actual.tasks / data.planned.tasks : 0,
    startHumanState: data.humanState?.start,
    endHumanState: data.humanState?.end,
  };
}

/**
 * Compute statistics from execution history
 *
 * Input: Array of execution records for same task
 * Output: Summary statistics for prediction model training
 */
export function computeTaskStats(
  executions: TaskExecutionRecord[]
): TaskExecutionStats {
  if (executions.length === 0) {
    throw new Error('No execution records provided');
  }

  const taskId = executions[0].taskId;
  const completed = executions.filter((e) => e.completed);

  // Duration stats
  const actualDurations = completed
    .filter((e) => e.actualDuration !== undefined)
    .map((e) => e.actualDuration!);

  const estimatedDurations = executions.map((e) => e.plannedDuration);

  const avgEstimate =
    estimatedDurations.reduce((a, b) => a + b, 0) / estimatedDurations.length;
  const avgActual =
    actualDurations.length > 0
      ? actualDurations.reduce((a, b) => a + b, 0) / actualDurations.length
      : 0;

  // Completion rate
  const completionRate = completed.length / executions.length;

  // Quality rating
  const ratings = completed
    .filter((e) => e.qualityRating !== undefined)
    .map((e) => e.qualityRating!);

  // Context switch cost
  const withSwitch = completed.filter((e) => e.hadContextSwitch);
  const withoutSwitch = completed.filter((e) => !e.hadContextSwitch);

  const avgWithSwitch =
    withSwitch.length > 0
      ? withSwitch
          .map((e) => e.actualDuration || 0)
          .reduce((a, b) => a + b, 0) / withSwitch.length
      : undefined;

  const avgWithoutSwitch =
    withoutSwitch.length > 0
      ? withoutSwitch
          .map((e) => e.actualDuration || 0)
          .reduce((a, b) => a + b, 0) / withoutSwitch.length
      : undefined;

  return {
    taskId,
    totalAttempts: executions.length,
    completions: completed.length,
    completionRate,
    avgEstimatedDuration: avgEstimate,
    avgActualDuration: avgActual,
    durationAccuracy: avgEstimate > 0 ? avgActual / avgEstimate : 0,
    durationVariance:
      actualDurations.length > 1
        ? Math.sqrt(
            actualDurations.reduce(
              (sum, d) => sum + Math.pow(d - avgActual, 2),
              0
            ) / actualDurations.length
          )
        : 0,
    avgEstimatedEffort:
      executions.reduce((sum, e) => sum + e.plannedEffort, 0) /
      executions.length,
    avgActualEffort:
      completed.length > 0
        ? completed.reduce((sum, e) => sum + (e.actualEffort || 0), 0) /
          completed.length
        : 0,
    effortAccuracy:
      completed.length > 0
        ? completed.reduce((sum, e) => sum + (e.actualEffort || 0), 0) /
          completed.length /
          (executions.reduce((sum, e) => sum + e.plannedEffort, 0) /
            executions.length)
        : 0,
    avgQualityRating:
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : undefined,
    avgDurationWithSwitch: avgWithSwitch,
    avgDurationWithoutSwitch: avgWithoutSwitch,
    contextSwitchCost:
      avgWithSwitch && avgWithoutSwitch ? avgWithSwitch - avgWithoutSwitch : 0,
    consecutiveFailures: executions.reverse().findIndex((e) => e.completed),
  };
}
