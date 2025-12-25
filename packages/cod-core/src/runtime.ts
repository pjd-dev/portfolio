/**
 * Runtime configuration values shared across COD consumers.
 */
export const EFFORT_UNIT_MIN = 15;
const DEFAULT_EFFORT_SCORE = 3;

export type TaskEffortInput = {
  effortScore?: number;
  effort?: number;
  estimatedTimeMin?: number;
};

export type TaskEffortCost = {
  effortScore: number;
  costMin: number;
};

const resolveEffortUnitMin = (effortUnitMin?: number): number => {
  if (Number.isFinite(effortUnitMin) && effortUnitMin && effortUnitMin > 0) {
    return effortUnitMin;
  }

  return EFFORT_UNIT_MIN;
};

export const computeTaskEffortScore = (
  task: TaskEffortInput,
  effortUnitMin: number = EFFORT_UNIT_MIN,
  defaultEffortScore: number = DEFAULT_EFFORT_SCORE
): number => {
  if (typeof task.effortScore === 'number' && task.effortScore > 0) {
    return task.effortScore;
  }

  if (typeof task.effort === 'number' && task.effort > 0) {
    return task.effort;
  }

  const resolvedUnitMin = resolveEffortUnitMin(effortUnitMin);
  if (typeof task.estimatedTimeMin === 'number' && task.estimatedTimeMin > 0) {
    const derived = Math.round(task.estimatedTimeMin / resolvedUnitMin);
    return Math.max(1, derived);
  }

  return defaultEffortScore;
};

export const computeTaskCostMin = (
  task: TaskEffortInput,
  effortUnitMin: number = EFFORT_UNIT_MIN,
  defaultEffortScore: number = DEFAULT_EFFORT_SCORE
): TaskEffortCost => {
  const resolvedUnitMin = resolveEffortUnitMin(effortUnitMin);
  const effortScore = computeTaskEffortScore(
    task,
    resolvedUnitMin,
    defaultEffortScore
  );

  return {
    effortScore,
    costMin: effortScore * resolvedUnitMin,
  };
};
