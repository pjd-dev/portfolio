/**
 * Prediction Feedback Loop
 *
 * Implements continuous learning from prediction accuracy:
 * - Records predictions before execution
 * - Compares predictions vs actual outcomes
 * - Adjusts model weights based on error
 * - Tracks accuracy metrics over time
 *
 * This enables the prediction engine to improve automatically
 * without manual retraining.
 */

import type { TaskExecutionRecord } from './prediction-history.js';
import type { TaskPrediction } from './predictions.js';
import type { HumanStateSnapshot } from './human-state-series.js';

// ============================================================================
// Types
// ============================================================================

/**
 * A prediction record stored before task execution
 */
export interface PredictionRecord {
  /** Prediction ID */
  id: string;

  /** Task being predicted */
  taskId: string;

  /** When prediction was made */
  predictedAt: string;

  /** Predicted duration in minutes */
  predictedDuration: number;

  /** Predicted quality (1-5) */
  predictedQuality: number;

  /** Predicted completion probability */
  predictedCompletion: number;

  /** Confidence in overall prediction */
  confidence: number;

  /** Human state at prediction time */
  humanStateAtPrediction: HumanStateSnapshot;

  /** Model version used */
  modelVersion: string;
}

/**
 * Outcome after task execution
 */
export interface PredictionOutcome {
  /** Matching prediction ID */
  predictionId: string;

  /** When outcome was recorded */
  recordedAt: string;

  /** Actual duration in minutes */
  actualDuration?: number;

  /** Actual quality rating (1-5) */
  actualQuality?: number;

  /** Did task complete? */
  completed: boolean;

  /** Human state at completion */
  humanStateAtCompletion?: HumanStateSnapshot;
}

/**
 * Error metrics for a single prediction
 */
export interface PredictionError {
  predictionId: string;
  taskId: string;

  /** Duration error (actual - predicted), positive = underestimate */
  durationError: number;

  /** Duration error as percentage */
  durationErrorPct: number;

  /** Quality error (actual - predicted) */
  qualityError: number;

  /** Completion prediction error (0 if correct, 1 if wrong) */
  completionError: number;

  /** Was overall prediction accurate? */
  accurate: boolean;
}

/**
 * Aggregated accuracy metrics
 */
export interface FeedbackMetrics {
  /** Number of predictions evaluated */
  sampleCount: number;

  /** Mean Absolute Error for duration */
  durationMAE: number;

  /** Mean Absolute Percentage Error for duration */
  durationMAPE: number;

  /** Root Mean Square Error for duration */
  durationRMSE: number;

  /** Bias (average error, positive = underestimating) */
  durationBias: number;

  /** Quality prediction accuracy (correct within ±1) */
  qualityAccuracy: number;

  /** Completion prediction accuracy */
  completionAccuracy: number;

  /** Overall model accuracy */
  overallAccuracy: number;

  /** Recent trend (last 10 vs overall) */
  trend: 'improving' | 'stable' | 'declining';

  /** Confidence calibration (predicted confidence vs actual accuracy) */
  calibration: number;
}

/**
 * Adjustment recommendations based on feedback
 */
export interface ModelAdjustment {
  /** Adjustment type */
  type: 'bias_correction' | 'confidence_scaling' | 'feature_weight';

  /** What to adjust */
  target: string;

  /** Adjustment factor (multiply by this) */
  factor: number;

  /** Reason for adjustment */
  reason: string;

  /** Based on how many samples */
  sampleCount: number;
}

/**
 * Feedback loop state
 */
export interface FeedbackLoopState {
  /** Pending predictions awaiting outcomes */
  pendingPredictions: Map<string, PredictionRecord>;

  /** Completed prediction-outcome pairs */
  completedPairs: Array<{
    prediction: PredictionRecord;
    outcome: PredictionOutcome;
    error: PredictionError;
  }>;

  /** Current metrics */
  metrics: FeedbackMetrics;

  /** Active adjustments */
  adjustments: ModelAdjustment[];

  /** Model version */
  modelVersion: string;

  /** Last updated */
  lastUpdated: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_MODEL_VERSION = '1.0.0';
const MAX_COMPLETED_PAIRS = 1000; // Keep last N for metrics
const ACCURACY_THRESHOLD = 0.2; // 20% error = accurate
const QUALITY_THRESHOLD = 1; // ±1 point = accurate
const MIN_SAMPLES_FOR_ADJUSTMENT = 10;

// ============================================================================
// Functions
// ============================================================================

/**
 * Create initial feedback loop state
 */
export function createFeedbackLoopState(
  modelVersion: string = DEFAULT_MODEL_VERSION
): FeedbackLoopState {
  return {
    pendingPredictions: new Map(),
    completedPairs: [],
    metrics: createEmptyMetrics(),
    adjustments: [],
    modelVersion,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Create empty metrics
 */
function createEmptyMetrics(): FeedbackMetrics {
  return {
    sampleCount: 0,
    durationMAE: 0,
    durationMAPE: 0,
    durationRMSE: 0,
    durationBias: 0,
    qualityAccuracy: 0,
    completionAccuracy: 0,
    overallAccuracy: 0,
    trend: 'stable',
    calibration: 0,
  };
}

/**
 * Record a prediction before task execution
 */
export function recordPrediction(
  state: FeedbackLoopState,
  taskId: string,
  prediction: TaskPrediction,
  humanState: HumanStateSnapshot
): FeedbackLoopState {
  const id = `pred-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const record: PredictionRecord = {
    id,
    taskId,
    predictedAt: new Date().toISOString(),
    predictedDuration: prediction.predictedDuration,
    predictedQuality: prediction.predictedQuality,
    predictedCompletion: prediction.completionProbability,
    confidence: prediction.overallConfidence,
    humanStateAtPrediction: humanState,
    modelVersion: state.modelVersion,
  };

  const newPending = new Map(state.pendingPredictions);
  newPending.set(taskId, record);

  return {
    ...state,
    pendingPredictions: newPending,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Record outcome after task execution
 */
export function recordOutcome(
  state: FeedbackLoopState,
  taskId: string,
  execution: TaskExecutionRecord
): FeedbackLoopState {
  const prediction = state.pendingPredictions.get(taskId);

  if (!prediction) {
    // No prediction to compare - skip
    return state;
  }

  const outcome: PredictionOutcome = {
    predictionId: prediction.id,
    recordedAt: new Date().toISOString(),
    actualDuration: execution.actualDuration,
    actualQuality: execution.qualityRating,
    completed: execution.completed,
    humanStateAtCompletion: execution.endHumanState
      ? {
          ...execution.endHumanState,
          timestamp: new Date().toISOString(),
          source: 'session-end' as const,
        }
      : undefined,
  };

  const error = computePredictionError(prediction, outcome);

  // Remove from pending
  const newPending = new Map(state.pendingPredictions);
  newPending.delete(taskId);

  // Add to completed (with limit)
  const newCompleted = [
    ...state.completedPairs.slice(-(MAX_COMPLETED_PAIRS - 1)),
    { prediction, outcome, error },
  ];

  // Recompute metrics
  const newMetrics = computeMetrics(newCompleted);

  // Compute adjustments if enough samples
  const newAdjustments =
    newCompleted.length >= MIN_SAMPLES_FOR_ADJUSTMENT
      ? computeAdjustments(newCompleted, newMetrics)
      : state.adjustments;

  return {
    ...state,
    pendingPredictions: newPending,
    completedPairs: newCompleted,
    metrics: newMetrics,
    adjustments: newAdjustments,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Compute error for a single prediction
 */
export function computePredictionError(
  prediction: PredictionRecord,
  outcome: PredictionOutcome
): PredictionError {
  const actualDuration = outcome.actualDuration ?? prediction.predictedDuration;
  const actualQuality = outcome.actualQuality ?? prediction.predictedQuality;

  const durationError = actualDuration - prediction.predictedDuration;
  const durationErrorPct =
    prediction.predictedDuration > 0
      ? Math.abs(durationError) / prediction.predictedDuration
      : 0;

  const qualityError = actualQuality - prediction.predictedQuality;

  // Completion: did prediction match outcome?
  const predictedComplete = prediction.predictedCompletion >= 0.5;
  const completionError = predictedComplete !== outcome.completed ? 1 : 0;

  // Overall accuracy: duration within threshold AND completion correct
  const accurate =
    durationErrorPct <= ACCURACY_THRESHOLD && completionError === 0;

  return {
    predictionId: prediction.id,
    taskId: prediction.taskId,
    durationError,
    durationErrorPct,
    qualityError,
    completionError,
    accurate,
  };
}

/**
 * Compute aggregated metrics from completed pairs
 */
export function computeMetrics(
  pairs: Array<{
    prediction: PredictionRecord;
    outcome: PredictionOutcome;
    error: PredictionError;
  }>
): FeedbackMetrics {
  if (pairs.length === 0) {
    return createEmptyMetrics();
  }

  const errors = pairs.map((p) => p.error);
  const n = errors.length;

  // Duration metrics
  const durationErrors = errors.map((e) => e.durationError);
  const absDurationErrors = durationErrors.map(Math.abs);
  const pctErrors = errors.map((e) => e.durationErrorPct);

  const durationMAE = absDurationErrors.reduce((a, b) => a + b, 0) / n;
  const durationMAPE = pctErrors.reduce((a, b) => a + b, 0) / n;
  const durationRMSE = Math.sqrt(
    durationErrors.reduce((a, b) => a + b * b, 0) / n
  );
  const durationBias = durationErrors.reduce((a, b) => a + b, 0) / n;

  // Quality accuracy (within ±1)
  const qualityCorrect = errors.filter(
    (e) => Math.abs(e.qualityError) <= QUALITY_THRESHOLD
  ).length;
  const qualityAccuracy = qualityCorrect / n;

  // Completion accuracy
  const completionCorrect = errors.filter(
    (e) => e.completionError === 0
  ).length;
  const completionAccuracy = completionCorrect / n;

  // Overall accuracy
  const overallCorrect = errors.filter((e) => e.accurate).length;
  const overallAccuracy = overallCorrect / n;

  // Trend: compare last 10 to overall
  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (n >= 20) {
    const recent = errors.slice(-10);
    const recentAccuracy =
      recent.filter((e) => e.accurate).length / recent.length;
    const diff = recentAccuracy - overallAccuracy;
    if (diff > 0.1) trend = 'improving';
    else if (diff < -0.1) trend = 'declining';
  }

  // Calibration: predicted confidence vs actual accuracy
  // Group by confidence buckets and compare
  const confidenceBuckets: Map<
    number,
    { predicted: number; actual: number }[]
  > = new Map();
  for (let i = 0; i < pairs.length; i++) {
    const bucket = Math.floor(pairs[i].prediction.confidence * 10) / 10;
    if (!confidenceBuckets.has(bucket)) {
      confidenceBuckets.set(bucket, []);
    }
    confidenceBuckets.get(bucket)!.push({
      predicted: pairs[i].prediction.confidence,
      actual: errors[i].accurate ? 1 : 0,
    });
  }

  let calibrationSum = 0;
  let calibrationCount = 0;
  for (const [bucket, values] of confidenceBuckets) {
    if (values.length >= 3) {
      const avgActual =
        values.reduce((a, v) => a + v.actual, 0) / values.length;
      calibrationSum += Math.abs(bucket - avgActual);
      calibrationCount++;
    }
  }
  const calibration =
    calibrationCount > 0 ? 1 - calibrationSum / calibrationCount : 0;

  return {
    sampleCount: n,
    durationMAE,
    durationMAPE,
    durationRMSE,
    durationBias,
    qualityAccuracy,
    completionAccuracy,
    overallAccuracy,
    trend,
    calibration,
  };
}

/**
 * Compute model adjustments based on feedback
 */
export function computeAdjustments(
  pairs: Array<{
    prediction: PredictionRecord;
    outcome: PredictionOutcome;
    error: PredictionError;
  }>,
  metrics: FeedbackMetrics
): ModelAdjustment[] {
  const adjustments: ModelAdjustment[] = [];

  // Bias correction: if consistently under/over-estimating
  if (Math.abs(metrics.durationBias) > 5 && metrics.sampleCount >= 20) {
    // More than 5 minutes systematic error
    const factor =
      metrics.durationBias > 0
        ? 1 + metrics.durationBias / 60 // Underestimating: increase predictions
        : 1 + metrics.durationBias / 60; // Overestimating: decrease predictions

    adjustments.push({
      type: 'bias_correction',
      target: 'duration',
      factor: Math.max(0.8, Math.min(1.2, factor)), // Clamp to ±20%
      reason:
        metrics.durationBias > 0
          ? `Underestimating by avg ${metrics.durationBias.toFixed(1)}min`
          : `Overestimating by avg ${Math.abs(metrics.durationBias).toFixed(1)}min`,
      sampleCount: metrics.sampleCount,
    });
  }

  // Confidence scaling: if calibration is off
  if (metrics.calibration < 0.7 && metrics.sampleCount >= 30) {
    // Poor calibration
    adjustments.push({
      type: 'confidence_scaling',
      target: 'confidence',
      factor: 0.85, // Reduce confidence
      reason: `Low calibration (${(metrics.calibration * 100).toFixed(0)}%)`,
      sampleCount: metrics.sampleCount,
    });
  }

  // Feature weight: if high energy predictions are off
  const highEnergyPairs = pairs.filter(
    (p) => p.prediction.humanStateAtPrediction.energy > 0.7
  );
  if (highEnergyPairs.length >= 10) {
    const highEnergyErrors = highEnergyPairs.map((p) => p.error.durationError);
    const avgError =
      highEnergyErrors.reduce((a, b) => a + b, 0) / highEnergyErrors.length;

    if (Math.abs(avgError) > 10) {
      adjustments.push({
        type: 'feature_weight',
        target: 'energy_weight',
        factor: avgError > 0 ? 1.1 : 0.9,
        reason: `High-energy predictions off by avg ${avgError.toFixed(1)}min`,
        sampleCount: highEnergyPairs.length,
      });
    }
  }

  return adjustments;
}

/**
 * Apply adjustments to a prediction
 */
export function applyAdjustments(
  prediction: TaskPrediction,
  adjustments: ModelAdjustment[]
): TaskPrediction {
  let adjusted = { ...prediction };

  for (const adj of adjustments) {
    switch (adj.type) {
      case 'bias_correction':
        if (adj.target === 'duration') {
          adjusted.predictedDuration = Math.round(
            adjusted.predictedDuration * adj.factor
          );
        }
        break;

      case 'confidence_scaling':
        adjusted.overallConfidence = Math.max(
          0.1,
          Math.min(1, adjusted.overallConfidence * adj.factor)
        );
        adjusted.durationConfidence *= adj.factor;
        adjusted.qualityConfidence *= adj.factor;
        break;

      case 'feature_weight':
        // Feature weights affect the underlying model, not individual predictions
        // But we can note it in recommendation
        adjusted.recommendation =
          (adjusted.recommendation || '') + ` [Adjustment: ${adj.reason}]`;
        break;
    }
  }

  return adjusted;
}

/**
 * Get feedback loop summary for display
 */
export function formatFeedbackSummary(state: FeedbackLoopState): string {
  const { metrics, adjustments } = state;
  const lines: string[] = [];

  lines.push('# Prediction Feedback Loop\n');
  lines.push(`**Model Version:** ${state.modelVersion}`);
  lines.push(`**Samples:** ${metrics.sampleCount}`);
  lines.push(`**Last Updated:** ${state.lastUpdated}\n`);

  lines.push('## Accuracy Metrics\n');
  lines.push(
    `- **Overall Accuracy:** ${(metrics.overallAccuracy * 100).toFixed(1)}%`
  );
  lines.push(`- **Duration MAE:** ${metrics.durationMAE.toFixed(1)} min`);
  lines.push(
    `- **Duration MAPE:** ${(metrics.durationMAPE * 100).toFixed(1)}%`
  );
  lines.push(
    `- **Duration Bias:** ${metrics.durationBias > 0 ? '+' : ''}${metrics.durationBias.toFixed(1)} min`
  );
  lines.push(
    `- **Quality Accuracy:** ${(metrics.qualityAccuracy * 100).toFixed(1)}%`
  );
  lines.push(
    `- **Completion Accuracy:** ${(metrics.completionAccuracy * 100).toFixed(1)}%`
  );
  lines.push(`- **Calibration:** ${(metrics.calibration * 100).toFixed(1)}%`);
  lines.push(`- **Trend:** ${metrics.trend}\n`);

  if (adjustments.length > 0) {
    lines.push('## Active Adjustments\n');
    for (const adj of adjustments) {
      lines.push(
        `- **${adj.type}** (${adj.target}): ×${adj.factor.toFixed(2)} - ${adj.reason}`
      );
    }
  } else {
    lines.push('## Adjustments\n');
    lines.push('_No adjustments needed yet._');
  }

  lines.push(`\n**Pending Predictions:** ${state.pendingPredictions.size}`);

  return lines.join('\n');
}

/**
 * Export feedback data for persistence
 */
export function exportFeedbackData(state: FeedbackLoopState): {
  version: string;
  modelVersion: string;
  metrics: FeedbackMetrics;
  adjustments: ModelAdjustment[];
  completedCount: number;
  pendingCount: number;
  recentErrors: Array<{
    taskId: string;
    durationError: number;
    accurate: boolean;
  }>;
} {
  return {
    version: '1',
    modelVersion: state.modelVersion,
    metrics: state.metrics,
    adjustments: state.adjustments,
    completedCount: state.completedPairs.length,
    pendingCount: state.pendingPredictions.size,
    recentErrors: state.completedPairs.slice(-20).map((p) => ({
      taskId: p.error.taskId,
      durationError: p.error.durationError,
      accurate: p.error.accurate,
    })),
  };
}
