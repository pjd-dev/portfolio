/**
 * Canonical task normalization for COD
 *
 * Maps vault task frontmatter variants into the TaskState shape expected by
 * cod-core validation:
 * - Status enums normalized to spec values
 * - Priority clamped to 0-10 with sensible default
 * - focusCost accepts aliases (focus_cost)
 * - estimatedTimeMin accepts aliases (effortMin/effort_min/estimated_time_min)
 * - goal accepts goalId/goal_id aliases
 *
 * NOTE: This is intentionally conservative; it does not change behavior beyond
 * normalization and defaults to preserve existing outputs.
 */
import { type TaskState } from './validator/types.js';

export type CanonicalTaskInput = Partial<
  TaskState & {
    focus_cost?: number | string;
    goal_id?: string;
    goalId?: string;
    effortMin?: number | string;
    effort_min?: number | string;
    estimated_time_min?: number | string;
  }
>;

const DEFAULT_PRIORITY = 5;
const MIN_PRIORITY = 0;
const MAX_PRIORITY = 10;

const numberFrom = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const stringFrom = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  return undefined;
};

export const normalizeTaskStatus = (value?: string): TaskState['status'] => {
  if (!value) return 'todo';
  const normalized = value.toLowerCase();
  if (normalized === 'backlog') return 'backlog';
  if (normalized === 'todo') return 'todo';
  if (normalized === 'in-progress') return 'in_progress';
  if (normalized === 'in_progress') return 'in_progress';
  if (normalized === 'completed' || normalized === 'done') return 'done';
  if (normalized === 'blocked') return 'blocked';
  if (normalized === 'dropped') return 'dropped';
  return 'todo';
};

export const normalizePriority = (value?: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.min(MAX_PRIORITY, Math.max(MIN_PRIORITY, value));
  }
  return DEFAULT_PRIORITY;
};

const pickNumber = (
  ...candidates: Array<number | undefined>
): number | undefined => {
  for (const candidate of candidates) {
    if (candidate !== undefined && Number.isFinite(candidate)) return candidate;
  }
  return undefined;
};

const pickString = (
  ...candidates: Array<string | undefined>
): string | undefined => {
  for (const candidate of candidates) {
    if (candidate) return candidate;
  }
  return undefined;
};

export const normalizeTaskState = (input: CanonicalTaskInput): TaskState => {
  const status = normalizeTaskStatus(input.status as string | undefined);
  const priority = normalizePriority(
    numberFrom((input as CanonicalTaskInput).priority)
  );
  const focusCost = pickNumber(
    numberFrom((input as CanonicalTaskInput).focusCost),
    numberFrom((input as CanonicalTaskInput).focus_cost)
  );
  const estimatedTimeMin = pickNumber(
    numberFrom((input as CanonicalTaskInput).estimatedTimeMin),
    numberFrom((input as CanonicalTaskInput).effortMin),
    numberFrom((input as CanonicalTaskInput).effort_min),
    numberFrom((input as CanonicalTaskInput).estimated_time_min)
  );
  const goal = pickString(
    stringFrom((input as CanonicalTaskInput).goal),
    stringFrom((input as CanonicalTaskInput).goalId),
    stringFrom((input as CanonicalTaskInput).goal_id)
  );

  return {
    // required
    id: input.id ?? '',
    title: input.title ?? '',
    status,

    // normalized core fields
    priority,
    goal: goal ?? null,
    focusCost,
    estimatedTimeMin,

    // pass-through known optionals
    effort: input.effort,
    effortScore: input.effortScore,
    dependsOn: input.dependsOn,
    blockedBy: input.blockedBy,
    tags: input.tags,
    dueDate: input.dueDate,
    scheduledDate: input.scheduledDate,
    completedAt: input.completedAt,
  };
};
