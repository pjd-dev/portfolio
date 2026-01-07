/**
 * Session Classifier - ML-based session success prediction
 * Uses logistic regression to predict session outcomes
 */

import {
  logisticRegression,
  type LogisticRegressionResult,
} from './ml-utils.js';

export interface SessionFeatures {
  // Human state at session start
  startEnergy: number; // 0-1
  startStress: number; // 0-1
  startFocus: number; // 0-1

  // Session characteristics
  plannedDuration: number; // minutes
  taskCount: number;
  totalEffort: number; // sum of task efforts
  avgTaskComplexity: number; // 1-5 scale
  highPriorityCount: number; // tasks with priority >= 7

  // Context
  hourOfDay: number; // 0-23
  dayOfWeek: number; // 0-6
  consecutiveSessions: number; // sessions without break

  // Historical
  recentCompletionRate: number; // 0-1, from last 5 sessions
}

export interface SessionOutcome {
  completed: boolean; // did session finish as planned?
  completionRate: number; // % of planned tasks completed
  qualityScore: number; // 0-10, subjective quality
  endedEarly: boolean;
  extendedBeyondPlan: boolean;
}

export interface SessionPrediction {
  successProbability: number; // 0-1
  predictedCompletionRate: number; // 0-1
  predictedQuality: number; // 0-10
  risks: string[];
  recommendations: string[];
  confidence: number; // 0-1
}

/**
 * Train session classifier from historical session data
 */
export function trainSessionClassifier(
  sessions: Array<{ features: SessionFeatures; outcome: SessionOutcome }>
): LogisticRegressionResult | null {
  if (sessions.length < 10) {
    return null; // Need minimum training data
  }

  // Extract features matrix
  const X: number[][] = sessions.map((s) => [
    s.features.startEnergy,
    s.features.startStress,
    s.features.startFocus,
    s.features.plannedDuration / 480, // normalize to 0-1 (8 hours max)
    s.features.taskCount / 10, // normalize
    s.features.totalEffort / 20, // normalize
    s.features.avgTaskComplexity / 5,
    s.features.highPriorityCount / 5,
    s.features.hourOfDay / 24,
    s.features.dayOfWeek / 7,
    s.features.consecutiveSessions / 5,
    s.features.recentCompletionRate,
  ]);

  // Binary labels: success = completed & completionRate >= 0.7
  const y: number[] = sessions.map((s) =>
    s.outcome.completed && s.outcome.completionRate >= 0.7 ? 1 : 0
  );

  return logisticRegression(X, y, 0.01, 1000);
}

/**
 * Predict session success probability
 */
export function predictSessionSuccess(
  features: SessionFeatures,
  historicalSessions: Array<{
    features: SessionFeatures;
    outcome: SessionOutcome;
  }>
): SessionPrediction {
  const risks: string[] = [];
  const recommendations: string[] = [];

  // Train model if enough data
  let successProbability = 0.5;
  let confidence = 0.3;

  const model = trainSessionClassifier(historicalSessions);
  if (model && model.accuracy > 0.6) {
    const featureVector = [
      features.startEnergy,
      features.startStress,
      features.startFocus,
      features.plannedDuration / 480,
      features.taskCount / 10,
      features.totalEffort / 20,
      features.avgTaskComplexity / 5,
      features.highPriorityCount / 5,
      features.hourOfDay / 24,
      features.dayOfWeek / 7,
      features.consecutiveSessions / 5,
      features.recentCompletionRate,
    ];

    // Compute sigmoid manually
    const z =
      featureVector.reduce((sum, val, i) => sum + val * model.weights[i], 0) +
      model.bias;
    successProbability = 1 / (1 + Math.exp(-z));
    confidence = model.accuracy;
  } else {
    // Fallback: use heuristic scoring
    const energyScore = features.startEnergy;
    const stressScore = 1 - features.startStress;
    const focusScore = features.startFocus;
    const loadScore =
      1 - Math.min(1, (features.totalEffort / features.plannedDuration) * 30);
    const historyScore = features.recentCompletionRate;

    successProbability =
      (energyScore + stressScore + focusScore + loadScore + historyScore) / 5;
    confidence = 0.5;
  }

  // Analyze risk factors
  if (features.startEnergy < 0.3) {
    risks.push('Low starting energy');
    recommendations.push('Reduce session scope or take a rest break first');
  }

  if (features.startStress > 0.7) {
    risks.push('High stress level');
    recommendations.push(
      'Include stress management time or defer non-urgent tasks'
    );
  }

  if (features.startFocus < 0.4) {
    risks.push('Poor focus at session start');
    recommendations.push('Start with easier tasks to build momentum');
  }

  const workloadRatio = features.totalEffort / features.plannedDuration;
  if (workloadRatio > 0.05) {
    // More than 3 effort-hours per clock-hour
    risks.push('Session may be overbooked');
    recommendations.push(
      `Reduce task count or extend duration (${Math.round(workloadRatio * 100)}% load factor)`
    );
  }

  if (features.consecutiveSessions >= 3) {
    risks.push('Multiple consecutive sessions without break');
    recommendations.push('Schedule a longer break to avoid burnout');
  }

  if (features.hourOfDay < 7 || features.hourOfDay > 22) {
    risks.push('Off-hours scheduling');
    recommendations.push('Consider rescheduling to peak productivity hours');
  }

  if (features.avgTaskComplexity >= 4 && features.startFocus < 0.6) {
    risks.push('Complex tasks with suboptimal focus');
    recommendations.push('Defer complex tasks until focus improves');
  }

  if (features.recentCompletionRate < 0.5) {
    risks.push('Recent completion rate is low');
    recommendations.push('Review recent blockers and adjust planning approach');
  }

  // Predict completion rate and quality
  const predictedCompletionRate = Math.max(
    0,
    Math.min(1, successProbability * 1.2)
  );
  const predictedQuality =
    successProbability *
    10 *
    (features.startFocus * 0.4 +
      features.startEnergy * 0.3 +
      (1 - features.startStress) * 0.3);

  // Add positive recommendations
  if (risks.length === 0) {
    recommendations.push('Session setup looks optimal - proceed as planned');
  }

  return {
    successProbability,
    predictedCompletionRate,
    predictedQuality: Math.round(predictedQuality * 10) / 10,
    risks,
    recommendations,
    confidence,
  };
}

/**
 * Analyze what factors most influence session success
 */
export interface SuccessFactorAnalysis {
  topPositiveFactors: Array<{ factor: string; impact: number }>;
  topNegativeFactors: Array<{ factor: string; impact: number }>;
  insights: string[];
}

export function analyzeSuccessFactors(
  sessions: Array<{ features: SessionFeatures; outcome: SessionOutcome }>
): SuccessFactorAnalysis {
  if (sessions.length < 10) {
    return {
      topPositiveFactors: [],
      topNegativeFactors: [],
      insights: ['Insufficient data for factor analysis'],
    };
  }

  const model = trainSessionClassifier(sessions);
  if (!model) {
    return {
      topPositiveFactors: [],
      topNegativeFactors: [],
      insights: ['Unable to train model for factor analysis'],
    };
  }

  // Feature names
  const featureNames = [
    'Start Energy',
    'Start Stress',
    'Start Focus',
    'Planned Duration',
    'Task Count',
    'Total Effort',
    'Avg Complexity',
    'High Priority Count',
    'Hour of Day',
    'Day of Week',
    'Consecutive Sessions',
    'Recent Completion Rate',
  ];

  // Analyze feature weights
  const factors = featureNames.map((name, i) => ({
    factor: name,
    impact: model.weights[i],
  }));

  // Note: Positive weight means higher value increases success probability
  // For "Start Stress", positive weight is counterintuitive, so we'll invert it
  factors[1].impact *= -1; // Invert stress impact for interpretation

  const topPositiveFactors = factors
    .filter((f) => f.impact > 0)
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 5);

  const topNegativeFactors = factors
    .filter((f) => f.impact < 0)
    .sort((a, b) => a.impact - b.impact)
    .slice(0, 5);

  // Generate insights
  const insights: string[] = [];

  if (topPositiveFactors.length > 0) {
    const top = topPositiveFactors[0];
    insights.push(
      `${top.factor} has the strongest positive impact on session success`
    );
  }

  if (topNegativeFactors.length > 0) {
    const worst = topNegativeFactors[0];
    insights.push(
      `${worst.factor} is the biggest risk factor for session failure`
    );
  }

  // Analyze energy importance
  const energyFactor = factors.find((f) => f.factor === 'Start Energy');
  if (energyFactor && energyFactor.impact > 0.5) {
    insights.push(
      'Starting energy level is critical - prioritize rest before sessions'
    );
  }

  // Analyze workload importance
  const effortFactor = factors.find((f) => f.factor === 'Total Effort');
  if (effortFactor && Math.abs(effortFactor.impact) > 0.3) {
    insights.push(
      'Session workload significantly affects outcomes - avoid overbooking'
    );
  }

  // Analyze history importance
  const historyFactor = factors.find(
    (f) => f.factor === 'Recent Completion Rate'
  );
  if (historyFactor && historyFactor.impact > 0.4) {
    insights.push(
      'Past performance strongly predicts future success - momentum matters'
    );
  }

  return {
    topPositiveFactors,
    topNegativeFactors,
    insights,
  };
}

/**
 * Recommend optimal session timing based on historical data
 */
export interface SessionTimingRecommendation {
  bestHourOfDay: number;
  bestDayOfWeek: number;
  optimalDuration: number; // minutes
  maxTaskCount: number;
  reasoning: string;
}

export function recommendSessionTiming(
  sessions: Array<{ features: SessionFeatures; outcome: SessionOutcome }>
): SessionTimingRecommendation {
  if (sessions.length < 5) {
    return {
      bestHourOfDay: 9,
      bestDayOfWeek: 1,
      optimalDuration: 120,
      maxTaskCount: 5,
      reasoning: 'Default recommendations - insufficient historical data',
    };
  }

  // Successful sessions
  const successful = sessions.filter(
    (s) => s.outcome.completed && s.outcome.completionRate >= 0.7
  );

  if (successful.length === 0) {
    return {
      bestHourOfDay: 9,
      bestDayOfWeek: 1,
      optimalDuration: 90,
      maxTaskCount: 3,
      reasoning:
        'No successful sessions in history - conservative recommendations',
    };
  }

  // Find most common success patterns
  const hourCounts: { [hour: number]: number } = {};
  const dayCounts: { [day: number]: number } = {};
  const durations: number[] = [];
  const taskCounts: number[] = [];

  successful.forEach((s) => {
    const hour = s.features.hourOfDay;
    const day = s.features.dayOfWeek;
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    dayCounts[day] = (dayCounts[day] || 0) + 1;
    durations.push(s.features.plannedDuration);
    taskCounts.push(s.features.taskCount);
  });

  const bestHourOfDay = parseInt(
    Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0]
  );
  const bestDayOfWeek = parseInt(
    Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0][0]
  );

  const optimalDuration = Math.round(
    durations.reduce((sum, d) => sum + d, 0) / durations.length
  );
  const maxTaskCount = Math.ceil(
    taskCounts.reduce((sum, c) => sum + c, 0) / taskCounts.length
  );

  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const reasoning = `Based on ${successful.length} successful sessions: ${dayNames[bestDayOfWeek]} at ${bestHourOfDay}:00 shows best results. Average duration: ${optimalDuration}min with ~${maxTaskCount} tasks.`;

  return {
    bestHourOfDay,
    bestDayOfWeek,
    optimalDuration,
    maxTaskCount,
    reasoning,
  };
}
