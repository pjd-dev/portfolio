/**
 * Goal Projections
 *
 * Forecast when goals will complete based on:
 * - Historical task velocity (tasks/day, effort/day)
 * - Remaining effort in goal
 * - Current progress trend
 *
 * Used by: Recommendation engine, deadline planning
 */

export interface GoalProjection {
  /** Goal ID */
  goalId: string;

  /** Current status */
  status: 'on-track' | 'at-risk' | 'blocked' | 'complete';

  /** Estimated completion date (ISO) */
  estimatedCompletion: string;

  /** Confidence in estimate (0-1) */
  confidence: number;

  /** Remaining effort (task count) */
  remainingTasks: number;

  /** Remaining effort points */
  remainingEffort: number;

  /** Current velocity (effort/day) */
  currentVelocity: number;

  /** Days until completion at current velocity */
  daysToCompletion: number;

  /** Historical velocity (effort/day) - baseline */
  historicalVelocity: number;

  /** Is velocity trending up or down? */
  velocityTrend: 'accelerating' | 'stable' | 'decelerating';

  /** Blocking issues */
  blockers?: string[];

  /** Recommended action */
  recommendation?: string;
}

/**
 * Compute goal completion projection
 *
 * Inputs:
 * - Remaining tasks + effort for goal
 * - Recent execution history
 * - Current completion date if known
 */
export function projectGoalCompletion(data: {
  goalId: string;
  remainingTasks: number;
  remainingEffort: number; // total effort points
  targetDate?: string; // ISO
  recentVelocity: number; // effort/day (last 7 days)
  historicalVelocity: number; // effort/day (all time average)
  blockedTaskCount?: number;
  daysSinceStarted: number;
}): GoalProjection {
  const {
    goalId,
    remainingTasks,
    remainingEffort,
    targetDate,
    recentVelocity,
    historicalVelocity,
    blockedTaskCount = 0,
    daysSinceStarted,
  } = data;

  // Use recent velocity with fallback to historical
  const activeVelocity =
    recentVelocity > 0 ? recentVelocity : historicalVelocity;

  // Estimate days to completion
  const daysToCompletion =
    activeVelocity > 0 ? remainingEffort / activeVelocity : 999;

  // Velocity trend: recent vs historical
  let velocityTrend: 'accelerating' | 'stable' | 'decelerating' = 'stable';
  if (recentVelocity > historicalVelocity * 1.2) {
    velocityTrend = 'accelerating';
  } else if (recentVelocity < historicalVelocity * 0.8) {
    velocityTrend = 'decelerating';
  }

  // Estimate completion date
  const now = new Date();
  const estimatedCompletion = new Date(
    now.getTime() + daysToCompletion * 24 * 60 * 60 * 1000
  );

  // Status: on-track, at-risk, blocked, complete
  let status: 'on-track' | 'at-risk' | 'blocked' | 'complete' = 'on-track';

  if (remainingTasks === 0 && remainingEffort === 0) {
    status = 'complete';
  } else if (blockedTaskCount > 0) {
    status = 'blocked';
  } else if (targetDate) {
    const targetTime = new Date(targetDate).getTime();
    const completionTime = estimatedCompletion.getTime();
    if (completionTime > targetTime + 24 * 60 * 60 * 1000) {
      // More than 1 day late
      status = 'at-risk';
    }
  } else if (velocityTrend === 'decelerating') {
    status = 'at-risk';
  }

  // Confidence based on:
  // - How long goal has been active (more history = higher confidence)
  // - Velocity stability (stable = higher confidence)
  // - Recent data points (more = higher confidence)
  let confidence = 0.5;
  if (daysSinceStarted >= 14) confidence += 0.3;
  if (velocityTrend === 'stable') confidence += 0.1;
  confidence = Math.min(1, confidence);

  // Recommendation
  let recommendation: string | undefined;
  if (status === 'blocked') {
    recommendation = `${blockedTaskCount} task(s) blocked - resolve blockers to resume`;
  } else if (status === 'at-risk' && velocityTrend === 'decelerating') {
    recommendation = `Velocity declining - consider reducing scope or removing blockers`;
  } else if (status === 'at-risk' && targetDate && daysToCompletion > 14) {
    recommendation = `Behind schedule - need ${Math.ceil(activeVelocity * 1.5)} effort/day to meet target`;
  }

  return {
    goalId,
    status,
    estimatedCompletion: estimatedCompletion.toISOString(),
    confidence,
    remainingTasks,
    remainingEffort,
    currentVelocity: activeVelocity,
    daysToCompletion,
    historicalVelocity,
    velocityTrend,
    blockers:
      blockedTaskCount > 0
        ? [`${blockedTaskCount} task(s) blocked`]
        : undefined,
    recommendation,
  };
}

/**
 * Analyze goal milestone progress
 *
 * Example: "50% effort done in 30% of allocated time" (ahead of schedule)
 */
export function analyzeMilestoneProgress(data: {
  goalId: string;
  totalEffort: number;
  completedEffort: number;
  targetDays: number;
  elapsedDays: number;
}): {
  effortProgress: number; // 0-1
  timeProgress: number; // 0-1
  status: 'ahead' | 'on-track' | 'behind';
  statusMessage: string;
} {
  const { goalId, totalEffort, completedEffort, targetDays, elapsedDays } =
    data;

  const effortProgress = totalEffort > 0 ? completedEffort / totalEffort : 0;
  const timeProgress = targetDays > 0 ? elapsedDays / targetDays : 0;

  let status: 'ahead' | 'on-track' | 'behind' = 'on-track';
  if (effortProgress > timeProgress + 0.1) {
    status = 'ahead';
  } else if (effortProgress < timeProgress - 0.1) {
    status = 'behind';
  }

  const statusMessage =
    status === 'ahead'
      ? `Ahead of schedule: ${Math.round(effortProgress * 100)}% effort in ${Math.round(timeProgress * 100)}% of time`
      : status === 'behind'
        ? `Behind schedule: ${Math.round(effortProgress * 100)}% effort in ${Math.round(timeProgress * 100)}% of time`
        : `On schedule: ${Math.round(effortProgress * 100)}% effort in ${Math.round(timeProgress * 100)}% of time`;

  return { effortProgress, timeProgress, status, statusMessage };
}
