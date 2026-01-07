export type TimeSensitivityInput = {
  dueDate?: string | Date | number | null;
  scheduledDate?: string | Date | number | null;
  nextRun?: string | Date | number | null;
  now?: Date | string | number;
  horizonDays?: number;
  maxBoost?: number;
  scheduledPenalty?: number;
};

export type TimeSensitivityResult = {
  factor: number;
  flags: string[];
  dueInDays?: number;
  scheduledInDays?: number;
  target?: 'dueDate' | 'nextRun';
  horizonDays: number;
};

const DEFAULT_HORIZON_DAYS = 14;
const DEFAULT_MAX_BOOST = 0.5;
const DEFAULT_SCHEDULED_PENALTY = 0.6;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const parseDate = (value?: string | Date | number | null): Date | undefined => {
  if (value === undefined || value === null) return undefined;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }
  if (typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split('-').map(Number);
      const parsed = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
      return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    }
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
};

const diffDays = (target: Date, now: Date): number =>
  (target.getTime() - now.getTime()) / MS_PER_DAY;

const pickNextTarget = (
  dueDate?: Date,
  nextRun?: Date
): { target?: 'dueDate' | 'nextRun'; date?: Date } => {
  if (dueDate && nextRun) {
    if (dueDate.getTime() <= nextRun.getTime()) {
      return { target: 'dueDate', date: dueDate };
    }
    return { target: 'nextRun', date: nextRun };
  }
  if (dueDate) return { target: 'dueDate', date: dueDate };
  if (nextRun) return { target: 'nextRun', date: nextRun };
  return {};
};

export const computeTimeSensitivity = (
  input: TimeSensitivityInput = {}
): TimeSensitivityResult => {
  const now = parseDate(input.now) ?? new Date();
  const dueDate = parseDate(input.dueDate);
  const nextRun = parseDate(input.nextRun);
  const scheduledDate = parseDate(input.scheduledDate);
  const horizonDays = input.horizonDays ?? DEFAULT_HORIZON_DAYS;
  const maxBoost = input.maxBoost ?? DEFAULT_MAX_BOOST;
  const scheduledPenalty = input.scheduledPenalty ?? DEFAULT_SCHEDULED_PENALTY;

  const { target, date: targetDate } = pickNextTarget(dueDate, nextRun);
  const flags: string[] = [];
  let factor = 1;
  let dueInDays: number | undefined;
  let scheduledInDays: number | undefined;

  if (targetDate) {
    dueInDays = diffDays(targetDate, now);
    const urgencyRaw = (horizonDays - dueInDays) / horizonDays;
    const urgency = clamp(urgencyRaw, 0, 2);
    factor *= 1 + urgency * maxBoost;

    if (dueInDays <= 0) {
      flags.push('overdue');
    } else if (dueInDays <= horizonDays) {
      flags.push('due_soon');
    }
  }

  if (scheduledDate) {
    scheduledInDays = diffDays(scheduledDate, now);
    if (scheduledInDays > 0) {
      factor *= scheduledPenalty;
      flags.push('scheduled_future');
    }
  }

  return {
    factor,
    flags,
    dueInDays,
    scheduledInDays,
    target,
    horizonDays,
  };
};

export const applyTimeSensitivity = (
  score: number,
  input: TimeSensitivityInput = {}
): { score: number; sensitivity: TimeSensitivityResult } => {
  const sensitivity = computeTimeSensitivity(input);
  return {
    score: score * sensitivity.factor,
    sensitivity,
  };
};
