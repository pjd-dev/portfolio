export type GoalStatus = 'active' | 'inactive' | 'completed' | 'archived';

export type GoalInput = {
  id?: string;
  title?: string;
  active?: boolean;
  status?: string;
  weight?: number;
  priority?: number;
  tags?: string[] | string;
  horizon?: string;
  sourcePath?: string;
};

export type GoalRecord = {
  id: string;
  title: string;
  status: GoalStatus;
  active: boolean;
  weight: number;
  tags: string[];
  horizon?: string;
  sourcePath?: string;
};

export type GoalIndex = {
  goals: GoalRecord[];
  goalsById: Record<string, GoalRecord>;
  activeGoalIds: string[];
  primaryGoalId?: string;
};

export type ContextTolerance = 'low' | 'med' | 'high';

export type TaskGoalContext = {
  goal?: string | null;
  tags?: string[];
};

export type GoalScoreOptions = {
  contextTolerance?: ContextTolerance;
  tagBoost?: number;
  maxTagBoost?: number;
  weightScale?: number;
  inactiveGoalPenalty?: number;
  contextPenalty?: number;
  multiTagPenalty?: number;
};

export type GoalScoreBreakdown = {
  baseScore: number;
  goalWeightFactor: number;
  tagBoostFactor: number;
  contextPenaltyFactor: number;
  finalScore: number;
  timeFactor?: number;
  timeFlags?: string[];
  timeDueInDays?: number;
  timeScheduledInDays?: number;
  timeTarget?: 'dueDate' | 'nextRun';
};

const DEFAULT_WEIGHT = 0.5;
const DEFAULT_WEIGHT_SCALE = 0.5;
const DEFAULT_TAG_BOOST = 0.05;
const DEFAULT_MAX_TAG_BOOST = 0.15;
const DEFAULT_INACTIVE_PENALTY = 0.75;
const DEFAULT_CONTEXT_PENALTY = 0.85;
const DEFAULT_MULTI_TAG_PENALTY = 0.95;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const normalizeTags = (value?: string[] | string): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter(
      (tag) => typeof tag === 'string' && tag.trim().length > 0
    );
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return [value.trim()];
  }
  return [];
};

export const normalizeGoalWeight = (input?: number): number => {
  if (!Number.isFinite(input)) {
    return DEFAULT_WEIGHT;
  }

  if (input !== undefined && input > 1) {
    if (input <= 10) {
      return clamp(input / 10, 0, 1);
    }
    return 1;
  }

  return clamp(input ?? DEFAULT_WEIGHT, 0, 1);
};

export const normalizeGoalStatus = (
  status?: string,
  active?: boolean
): GoalStatus => {
  if (typeof active === 'boolean') {
    return active ? 'active' : 'inactive';
  }

  const normalized = status?.toLowerCase();
  if (normalized === 'active') return 'active';
  if (normalized === 'inactive' || normalized === 'paused') return 'inactive';
  if (normalized === 'completed' || normalized === 'complete')
    return 'completed';
  if (normalized === 'archived') return 'archived';

  return 'active';
};

export const normalizeGoal = (goal: GoalInput): GoalRecord | null => {
  if (!goal.id || !goal.title) return null;

  const status = normalizeGoalStatus(goal.status, goal.active);
  const weight = normalizeGoalWeight(goal.weight ?? goal.priority);
  const tags = normalizeTags(goal.tags);

  return {
    id: goal.id,
    title: goal.title,
    status,
    active: status === 'active',
    weight,
    tags,
    horizon: goal.horizon,
    sourcePath: goal.sourcePath,
  };
};

const selectPrimaryGoal = (goals: GoalRecord[]): string | undefined => {
  const activeGoals = goals.filter((goal) => goal.status === 'active');
  if (activeGoals.length === 0) return undefined;

  const sorted = [...activeGoals].sort((a, b) => {
    if (b.weight !== a.weight) return b.weight - a.weight;
    return a.id.localeCompare(b.id);
  });

  return sorted[0]?.id;
};

export const buildGoalIndex = (
  inputs: Array<GoalInput | GoalRecord>
): GoalIndex => {
  const goals: GoalRecord[] = [];
  const goalsById: Record<string, GoalRecord> = {};

  for (const input of inputs) {
    const normalized = normalizeGoal(input);
    if (!normalized) continue;
    if (goalsById[normalized.id]) continue;

    goals.push(normalized);
    goalsById[normalized.id] = normalized;
  }

  const activeGoalIds = goals
    .filter((goal) => goal.status === 'active')
    .map((goal) => goal.id);

  return {
    goals,
    goalsById,
    activeGoalIds,
    primaryGoalId: selectPrimaryGoal(goals),
  };
};

const countTagMatches = (taskTags: string[], goalTags: string[]): number => {
  if (taskTags.length === 0 || goalTags.length === 0) return 0;

  const goalSet = new Set(goalTags);
  let matches = 0;
  for (const tag of taskTags) {
    if (goalSet.has(tag)) matches += 1;
  }

  return matches;
};

export const scoreTaskWithGoals = (
  baseScore: number,
  task: TaskGoalContext,
  goalIndex?: GoalIndex,
  options: GoalScoreOptions = {}
): { score: number; breakdown: GoalScoreBreakdown } => {
  const breakdown: GoalScoreBreakdown = {
    baseScore,
    goalWeightFactor: 1,
    tagBoostFactor: 1,
    contextPenaltyFactor: 1,
    finalScore: baseScore,
  };

  if (!goalIndex || goalIndex.goals.length === 0) {
    return { score: baseScore, breakdown };
  }

  const goalId = task.goal ?? undefined;
  const goal = goalId ? goalIndex.goalsById[goalId] : undefined;

  if (goal) {
    if (goal.status === 'active') {
      const weightScale = options.weightScale ?? DEFAULT_WEIGHT_SCALE;
      breakdown.goalWeightFactor = 1 + goal.weight * weightScale;
    } else {
      breakdown.goalWeightFactor =
        options.inactiveGoalPenalty ?? DEFAULT_INACTIVE_PENALTY;
    }
  }

  if (goal?.tags?.length) {
    const taskTags = normalizeTags(task.tags);
    const matches = countTagMatches(taskTags, goal.tags);
    if (matches > 0) {
      const tagBoost = options.tagBoost ?? DEFAULT_TAG_BOOST;
      const maxTagBoost = options.maxTagBoost ?? DEFAULT_MAX_TAG_BOOST;
      const boost = Math.min(matches * tagBoost, maxTagBoost);
      breakdown.tagBoostFactor = 1 + boost;
    }
  }

  const contextTolerance = options.contextTolerance ?? 'med';
  if (contextTolerance === 'low') {
    const primaryGoalId = goalIndex.primaryGoalId;
    const contextPenalty = options.contextPenalty ?? DEFAULT_CONTEXT_PENALTY;
    if (primaryGoalId && goalId !== primaryGoalId) {
      breakdown.contextPenaltyFactor *= contextPenalty;
    }

    const taskTags = normalizeTags(task.tags);
    if (taskTags.length > 1) {
      breakdown.contextPenaltyFactor *=
        options.multiTagPenalty ?? DEFAULT_MULTI_TAG_PENALTY;
    }
  }

  breakdown.finalScore =
    baseScore *
    breakdown.goalWeightFactor *
    breakdown.tagBoostFactor *
    breakdown.contextPenaltyFactor;

  return { score: breakdown.finalScore, breakdown };
};
