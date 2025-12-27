import type { ContextTolerance } from './goals.js';

export type FocusCapacity = 'low' | 'med' | 'high';
export type HumanStateSource =
  | 'morning-check'
  | 'moment-check'
  | 'manual'
  | 'import'
  | 'unknown';
export type RecommendedMode = 'conservative' | 'normal' | 'focused';

export type HumanStateSnapshot = {
  ts: string;
  source: HumanStateSource;
  energy: number;
  focusCapacity: FocusCapacity;
  stress: number;
  sleepDebt: number;
  timeAvailableMin: number;
  contextTolerance?: ContextTolerance;
};

export type HumanStateEvaluation = {
  status: 'ok' | 'missing' | 'invalid' | 'stale';
  warnings: string[];
  snapshot: HumanStateSnapshot;
  ageHours?: number;
  recommendedMode: RecommendedMode;
  durationCapMin: number;
  maxFocusCost: number;
};

export const HUMAN_STATE_MAX_STALE_HOURS = 18;
export const DEFAULT_CONTEXT_TOLERANCE: ContextTolerance = 'med';

const DEFAULT_UNKNOWN_ENERGY = 0.4;
const DEFAULT_UNKNOWN_STRESS = 0.5;
const DEFAULT_UNKNOWN_SLEEP_DEBT = 0.5;
const DEFAULT_UNKNOWN_TIME_AVAILABLE_MIN = 25;

const ALLOWED_SOURCES = new Set<HumanStateSource>([
  'morning-check',
  'moment-check',
  'manual',
  'import',
]);
const ALLOWED_FOCUS_CAPACITY = new Set<FocusCapacity>(['low', 'med', 'high']);
const ALLOWED_CONTEXT_TOLERANCE = new Set<ContextTolerance>([
  'low',
  'med',
  'high',
]);

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const toDate = (value?: Date | string | number): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const makeUnknownSnapshot = (now: Date): HumanStateSnapshot => ({
  ts: now.toISOString(),
  source: 'unknown',
  energy: DEFAULT_UNKNOWN_ENERGY,
  focusCapacity: 'low',
  stress: DEFAULT_UNKNOWN_STRESS,
  sleepDebt: DEFAULT_UNKNOWN_SLEEP_DEBT,
  timeAvailableMin: DEFAULT_UNKNOWN_TIME_AVAILABLE_MIN,
  contextTolerance: DEFAULT_CONTEXT_TOLERANCE,
});

export const getFocusCostCap = (focusCapacity: FocusCapacity): number => {
  if (focusCapacity === 'low') return 1;
  if (focusCapacity === 'med') return 2;
  return 3;
};

export const normalizeFocusCost = (
  focusCost?: number | string | null
): number => {
  if (focusCost === undefined || focusCost === null) return 1;
  if (typeof focusCost === 'string') {
    const normalized = focusCost.trim().toLowerCase();
    if (normalized === 'light' || normalized === 'low') return 1;
    if (normalized === 'medium' || normalized === 'med') return 2;
    if (normalized === 'deep' || normalized === 'high') return 3;
    const numeric = Number(normalized);
    if (!Number.isNaN(numeric)) {
      return normalizeFocusCost(numeric);
    }
    return 3;
  }

  if (focusCost <= 1) return 1;
  if (focusCost <= 2) return 2;
  return 3;
};

export const isFocusEligible = (
  focusCost: number | string | undefined,
  focusCapacity: FocusCapacity
): boolean => {
  const normalized = normalizeFocusCost(focusCost);
  return normalized <= getFocusCostCap(focusCapacity);
};

export const adjustScoreForRecommendedMode = (
  score: number,
  task: { effort?: number; focusCost?: number },
  mode: RecommendedMode
): number => {
  if (mode !== 'conservative') return score;
  const effort = task.effort ?? 1;
  const focusCost = task.focusCost ?? 1;
  const effortPenalty = Math.max(0, effort - 1) * 0.1;
  const focusPenalty = Math.max(0, focusCost - 1) * 0.15;
  const penaltyFactor = clamp(1 - effortPenalty - focusPenalty, 0.5, 1);
  return score * penaltyFactor;
};

const computeRecommendedMode = (
  snapshot: HumanStateSnapshot,
  status: HumanStateEvaluation['status']
): RecommendedMode => {
  if (status !== 'ok') return 'conservative';
  if (
    snapshot.energy < 0.4 ||
    snapshot.stress > 0.7 ||
    snapshot.sleepDebt > 0.6
  ) {
    return 'conservative';
  }
  if (
    snapshot.energy >= 0.7 &&
    snapshot.stress <= 0.4 &&
    snapshot.focusCapacity === 'high'
  ) {
    return 'focused';
  }
  return 'normal';
};

const computeDurationCap = (
  snapshot: HumanStateSnapshot,
  status: HumanStateEvaluation['status']
): number => {
  const timeAvailableMin = clamp(snapshot.timeAvailableMin, 0, 1440);

  if (status !== 'ok') {
    return Math.min(DEFAULT_UNKNOWN_TIME_AVAILABLE_MIN, timeAvailableMin);
  }

  let cap = Math.min(90, timeAvailableMin);
  if (snapshot.energy < 0.4) {
    cap = Math.min(cap, 45, timeAvailableMin);
  }
  if (snapshot.energy < 0.25) {
    cap = Math.min(cap, 25, timeAvailableMin);
  }
  if (snapshot.stress > 0.7) {
    cap = Math.min(cap, 25, timeAvailableMin);
  }
  if (snapshot.sleepDebt > 0.6) {
    cap = Math.min(cap, 45, timeAvailableMin);
  }

  return cap;
};

export const evaluateHumanStateSnapshot = (
  input?: Partial<HumanStateSnapshot> | null,
  options: { now?: Date | string | number; maxStaleHours?: number } = {}
): HumanStateEvaluation => {
  const now = toDate(options.now);
  const maxStaleHours = options.maxStaleHours ?? HUMAN_STATE_MAX_STALE_HOURS;
  const warnings: string[] = [];

  if (!input) {
    warnings.push('HS1 missing human-state snapshot');
    const snapshot = makeUnknownSnapshot(now);
    return {
      status: 'missing',
      warnings,
      snapshot,
      recommendedMode: computeRecommendedMode(snapshot, 'missing'),
      durationCapMin: computeDurationCap(snapshot, 'missing'),
      maxFocusCost: getFocusCostCap(snapshot.focusCapacity),
    };
  }

  const missingFields: string[] = [];
  const invalidFields: string[] = [];
  const rangeErrors: string[] = [];
  const enumErrors: string[] = [];

  const tsValue = input.ts;
  if (!tsValue) {
    missingFields.push('ts');
  } else if (typeof tsValue !== 'string') {
    invalidFields.push('ts');
  }

  const sourceValue = input.source;
  if (!sourceValue) {
    missingFields.push('source');
  } else if (
    typeof sourceValue !== 'string' ||
    !ALLOWED_SOURCES.has(sourceValue as HumanStateSource)
  ) {
    enumErrors.push(`source=${String(sourceValue)}`);
  }

  const energyValue = input.energy;
  if (energyValue === undefined || energyValue === null) {
    missingFields.push('energy');
  } else if (typeof energyValue !== 'number' || Number.isNaN(energyValue)) {
    invalidFields.push('energy');
  } else if (energyValue < 0 || energyValue > 1) {
    rangeErrors.push(`energy=${energyValue}`);
  }

  const focusCapacityValue = input.focusCapacity;
  if (!focusCapacityValue) {
    missingFields.push('focusCapacity');
  } else if (
    typeof focusCapacityValue !== 'string' ||
    !ALLOWED_FOCUS_CAPACITY.has(focusCapacityValue as FocusCapacity)
  ) {
    enumErrors.push(`focusCapacity=${String(focusCapacityValue)}`);
  }

  const stressValue = input.stress;
  if (stressValue === undefined || stressValue === null) {
    missingFields.push('stress');
  } else if (typeof stressValue !== 'number' || Number.isNaN(stressValue)) {
    invalidFields.push('stress');
  } else if (stressValue < 0 || stressValue > 1) {
    rangeErrors.push(`stress=${stressValue}`);
  }

  const sleepDebtValue = input.sleepDebt;
  if (sleepDebtValue === undefined || sleepDebtValue === null) {
    missingFields.push('sleepDebt');
  } else if (
    typeof sleepDebtValue !== 'number' ||
    Number.isNaN(sleepDebtValue)
  ) {
    invalidFields.push('sleepDebt');
  } else if (sleepDebtValue < 0 || sleepDebtValue > 1) {
    rangeErrors.push(`sleepDebt=${sleepDebtValue}`);
  }

  const timeAvailableValue = input.timeAvailableMin;
  if (timeAvailableValue === undefined || timeAvailableValue === null) {
    missingFields.push('timeAvailableMin');
  } else if (
    typeof timeAvailableValue !== 'number' ||
    Number.isNaN(timeAvailableValue)
  ) {
    invalidFields.push('timeAvailableMin');
  } else if (timeAvailableValue < 0 || timeAvailableValue > 1440) {
    rangeErrors.push(`timeAvailableMin=${timeAvailableValue}`);
  }

  const contextToleranceValue = input.contextTolerance;
  if (contextToleranceValue !== undefined && contextToleranceValue !== null) {
    if (
      typeof contextToleranceValue !== 'string' ||
      !ALLOWED_CONTEXT_TOLERANCE.has(contextToleranceValue as ContextTolerance)
    ) {
      enumErrors.push(`contextTolerance=${String(contextToleranceValue)}`);
    }
  }

  if (missingFields.length > 0 || invalidFields.length > 0) {
    const missing = [...missingFields, ...invalidFields];
    warnings.push(`HS1 missing required fields: ${missing.join(', ')}`);
  }
  if (rangeErrors.length > 0) {
    warnings.push(`HS2 range checks failed: ${rangeErrors.join(', ')}`);
  }
  if (enumErrors.length > 0) {
    warnings.push(`HS3 enum checks failed: ${enumErrors.join(', ')}`);
  }

  if (warnings.length > 0) {
    const snapshot = makeUnknownSnapshot(now);
    return {
      status: 'invalid',
      warnings,
      snapshot,
      recommendedMode: computeRecommendedMode(snapshot, 'invalid'),
      durationCapMin: computeDurationCap(snapshot, 'invalid'),
      maxFocusCost: getFocusCostCap(snapshot.focusCapacity),
    };
  }

  const parsedTs = new Date(tsValue as string);
  if (Number.isNaN(parsedTs.getTime())) {
    warnings.push('HS1 invalid timestamp');
    const snapshot = makeUnknownSnapshot(now);
    return {
      status: 'invalid',
      warnings,
      snapshot,
      recommendedMode: computeRecommendedMode(snapshot, 'invalid'),
      durationCapMin: computeDurationCap(snapshot, 'invalid'),
      maxFocusCost: getFocusCostCap(snapshot.focusCapacity),
    };
  }

  const ageHours = Math.abs(now.getTime() - parsedTs.getTime()) / 36e5;
  if (ageHours > maxStaleHours) {
    warnings.push(`HS4 stale snapshot (${ageHours.toFixed(1)}h old)`);
    const snapshot = makeUnknownSnapshot(now);
    return {
      status: 'stale',
      warnings,
      snapshot,
      ageHours,
      recommendedMode: computeRecommendedMode(snapshot, 'stale'),
      durationCapMin: computeDurationCap(snapshot, 'stale'),
      maxFocusCost: getFocusCostCap(snapshot.focusCapacity),
    };
  }

  const snapshot: HumanStateSnapshot = {
    ts: tsValue as string,
    source: sourceValue as HumanStateSource,
    energy: clamp(energyValue as number, 0, 1),
    focusCapacity: focusCapacityValue as FocusCapacity,
    stress: clamp(stressValue as number, 0, 1),
    sleepDebt: clamp(sleepDebtValue as number, 0, 1),
    timeAvailableMin: clamp(Math.round(timeAvailableValue as number), 0, 1440),
    contextTolerance:
      (contextToleranceValue as ContextTolerance | undefined) ??
      DEFAULT_CONTEXT_TOLERANCE,
  };

  const status: HumanStateEvaluation['status'] = 'ok';
  return {
    status,
    warnings,
    snapshot,
    ageHours,
    recommendedMode: computeRecommendedMode(snapshot, status),
    durationCapMin: computeDurationCap(snapshot, status),
    maxFocusCost: getFocusCostCap(snapshot.focusCapacity),
  };
};
