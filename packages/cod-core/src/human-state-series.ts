/**
 * Human State Time Series
 *
 * Tracks energy, stress, and focus over time for prediction models.
 * Used to understand patterns: when do we perform best? when do we crash?
 *
 * Input: Human state snapshots from sessions/tasks
 * Output: Time series trends, forecasts, anomalies
 */

export interface HumanStateSnapshot {
  /** ISO timestamp */
  timestamp: string;

  /** Energy level (0-1, where 1 is fully rested) */
  energy: number;

  /** Stress level (0-1, where 0 is calm) */
  stress: number;

  /** Focus capacity (0-1, where 1 is fully focused) */
  focus: number;

  /** Source of measurement */
  source: 'session-start' | 'session-end' | 'manual-checkin';

  /** Optional context */
  context?: {
    sessionId?: string;
    taskId?: string;
    sleepHours?: number;
    caffeine?: boolean;
    interrupts?: number;
  };
}

export interface HumanStateTrend {
  /** Metric being tracked */
  metric: 'energy' | 'stress' | 'focus';

  /** Time window (minutes) */
  windowMinutes: number;

  /** Average value in window */
  average: number;

  /** Standard deviation */
  variance: number;

  /** Trend direction */
  trend: 'improving' | 'stable' | 'declining';

  /** Confidence (how much data) */
  confidence: number; // 0-1, based on sample size

  /** Prediction for next period */
  forecast?: number;
}

export interface HumanStateCorrelation {
  /** What state metric affects output? */
  stateMetric: 'energy' | 'stress' | 'focus';

  /** What do we predict? */
  prediction: 'task-duration' | 'quality' | 'completion' | 'context-switch';

  /** Correlation coefficient (-1 to 1) */
  correlation: number;

  /** Statistical significance (0-1) */
  significance: number;

  /** Examples from history */
  examples: {
    stateValue: number;
    outcome: number;
    taskId: string;
  }[];
}

/**
 * Record a human state snapshot
 */
export function recordHumanState(
  snapshot: HumanStateSnapshot
): HumanStateSnapshot {
  // Clamp values to 0-1
  return {
    ...snapshot,
    energy: Math.max(0, Math.min(1, snapshot.energy)),
    stress: Math.max(0, Math.min(1, snapshot.stress)),
    focus: Math.max(0, Math.min(1, snapshot.focus)),
  };
}

/**
 * Analyze time series for trend in given window
 */
export function analyzeTrend(
  snapshots: HumanStateSnapshot[],
  metric: 'energy' | 'stress' | 'focus',
  windowMinutes: number = 480 // Default 8 hours
): HumanStateTrend {
  if (snapshots.length === 0) {
    throw new Error('No snapshots provided');
  }

  // Filter to window
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);

  const inWindow = snapshots.filter(
    (s) => new Date(s.timestamp) >= windowStart
  );

  if (inWindow.length === 0) {
    throw new Error('No snapshots in window');
  }

  // Compute stats
  const values = inWindow.map((s) => s[metric]);
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - average, 2), 0) /
    values.length;

  // Detect trend
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (metric === 'stress') {
    // For stress, lower is better
    if (secondAvg < firstAvg - 0.1) trend = 'improving';
    else if (secondAvg > firstAvg + 0.1) trend = 'declining';
  } else {
    // For energy/focus, higher is better
    if (secondAvg > firstAvg + 0.1) trend = 'improving';
    else if (secondAvg < firstAvg - 0.1) trend = 'declining';
  }

  // Confidence based on sample size
  const confidence = Math.min(1, inWindow.length / 10);

  // Simple linear forecast
  const slope = (secondAvg - firstAvg) / Math.max(1, secondHalf.length - 1);
  const forecast = Math.max(0, Math.min(1, secondAvg + slope));

  return {
    metric,
    windowMinutes,
    average,
    variance,
    trend,
    confidence,
    forecast,
  };
}

/**
 * Find correlation between human state and task outcomes
 *
 * Example: Does high energy → faster task completion?
 */
export function analyzeCorrelation(
  snapshots: HumanStateSnapshot[],
  outcomes: { stateMetric: 'energy' | 'stress' | 'focus'; value: number }[],
  stateMetric: 'energy' | 'stress' | 'focus',
  prediction: 'task-duration' | 'quality' | 'completion' | 'context-switch'
): HumanStateCorrelation {
  if (snapshots.length !== outcomes.length) {
    throw new Error('Snapshots and outcomes length must match');
  }

  const pairs = snapshots.map((s, i) => ({
    state: s[stateMetric],
    outcome: outcomes[i].value,
  }));

  // Pearson correlation
  const stateValues = pairs.map((p) => p.state);
  const outcomeValues = pairs.map((p) => p.outcome);

  const stateMean = stateValues.reduce((a, b) => a + b, 0) / stateValues.length;
  const outcomeMean =
    outcomeValues.reduce((a, b) => a + b, 0) / outcomeValues.length;

  const covariance =
    pairs.reduce(
      (sum, p) => sum + (p.state - stateMean) * (p.outcome - outcomeMean),
      0
    ) / pairs.length;

  const stateStd = Math.sqrt(
    stateValues.reduce((sum, v) => sum + Math.pow(v - stateMean, 2), 0) /
      stateValues.length
  );

  const outcomeStd = Math.sqrt(
    outcomeValues.reduce((sum, v) => sum + Math.pow(v - outcomeMean, 2), 0) /
      outcomeValues.length
  );

  const correlation =
    stateStd > 0 && outcomeStd > 0 ? covariance / (stateStd * outcomeStd) : 0;

  // Significance: R-squared
  const rSquared = correlation * correlation;
  const significance = Math.min(1, Math.max(0, rSquared));

  return {
    stateMetric,
    prediction,
    correlation,
    significance,
    examples: snapshots.map((s, i) => ({
      stateValue: s[stateMetric],
      outcome: outcomes[i].value,
      taskId: s.context?.taskId || 'unknown',
    })),
  };
}

/**
 * Predict best time to do a task type based on state history
 *
 * Example: "Code reviews work best when stress < 0.3 and focus > 0.7"
 */
export function findOptimalState(
  correlations: HumanStateCorrelation[],
  targetPrediction:
    | 'task-duration'
    | 'quality'
    | 'completion'
    | 'context-switch'
): { metric: 'energy' | 'stress' | 'focus'; optimalRange: [number, number] }[] {
  const relevant = correlations.filter(
    (c) => c.prediction === targetPrediction && Math.abs(c.correlation) > 0.3
  );

  if (relevant.length === 0) {
    return [];
  }

  return relevant.map((c) => {
    const examples = c.examples.sort((a, b) => b.outcome - a.outcome);
    const topQuarter = examples.slice(0, Math.ceil(examples.length / 4));

    const values = topQuarter.map((e) => e.stateValue);
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      metric: c.stateMetric,
      optimalRange: [min, max] as [number, number],
    };
  });
}
