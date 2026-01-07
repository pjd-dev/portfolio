/**
 * Duration Predictor - ML-based task duration prediction
 * Uses linear regression with multiple features
 */

import { linearRegression, type LinearRegressionResult } from './ml-utils.js';
import type { TaskExecutionRecord } from './prediction-history.js';

export interface DurationPredictorFeatures {
  estimatedDuration: number;
  taskType: string;
  priority: number;
  complexity: number; // 1-5 scale
  effortEstimate: number; // hours
  humanStateEnergy: number; // 0-1
  humanStateStress: number; // 0-1
  humanStateFocus: number; // 0-1
  hourOfDay: number; // 0-23
  dayOfWeek: number; // 0-6 (Sunday = 0)
}

export interface DurationPrediction {
  predictedMinutes: number;
  confidenceInterval: { lower: number; upper: number };
  accuracy: number; // R² from regression
  adjustmentFactor: number; // how much we adjusted from estimate
  warnings: string[];
}

/**
 * Train duration predictor from historical task executions
 */
export function trainDurationPredictor(
  history: TaskExecutionRecord[]
): LinearRegressionResult | null {
  if (history.length < 5) {
    return null; // Need minimum data for training
  }

  // Extract features and actual durations
  const X: number[] = [];
  const y: number[] = [];

  history.forEach((h) => {
    if (h.plannedDuration && h.actualDuration) {
      X.push(h.plannedDuration);
      y.push(h.actualDuration);
    }
  });

  if (X.length < 5) return null;

  return linearRegression(X, y);
}

/**
 * Predict task duration using trained model and current features
 */
export function predictDuration(
  features: DurationPredictorFeatures,
  history: TaskExecutionRecord[]
): DurationPrediction {
  const warnings: string[] = [];

  // Get historical data for this task type (requires taskType in history or features)
  const typeHistory = history;

  // Base prediction from historical average
  let predicted = features.estimatedDuration;
  let accuracy = 0.5; // Default if no model

  // Apply ML model if we have enough data
  const model = trainDurationPredictor(history);
  if (model && model.rSquared > 0.3) {
    predicted = model.slope * features.estimatedDuration + model.intercept;
    accuracy = model.rSquared;
  } else if (typeHistory.length >= 3) {
    // Fallback: use average adjustment factor from type history
    const adjustments = typeHistory
      .filter((h) => h.plannedDuration && h.actualDuration)
      .map((h) => h.actualDuration! / h.plannedDuration!);

    if (adjustments.length > 0) {
      const avgAdjustment =
        adjustments.reduce((sum, adj) => sum + adj, 0) / adjustments.length;
      predicted = features.estimatedDuration * avgAdjustment;
      accuracy = 0.6; // Better than default
    }
  } else {
    warnings.push('Limited historical data - using estimate as baseline');
  }

  // Apply human state adjustments
  const energyAdjustment = 1 + (features.humanStateEnergy - 0.5) * 0.3;
  const stressAdjustment = 1 + features.humanStateStress * 0.2;
  const focusAdjustment = 1 - (features.humanStateFocus - 0.5) * 0.2;

  predicted *= energyAdjustment * stressAdjustment * focusAdjustment;

  // Apply time-of-day adjustments (people are slower early/late)
  if (features.hourOfDay < 8 || features.hourOfDay > 20) {
    predicted *= 1.15;
    warnings.push('Off-hours timing may increase duration');
  }

  // Apply complexity adjustment
  if (features.complexity >= 4) {
    predicted *= 1.1;
    warnings.push('High complexity may extend duration');
  }

  // Calculate confidence interval (wider with less data)
  const dataQuality = Math.min(history.length / 20, 1); // 0-1 scale
  const intervalWidth = predicted * (0.4 - 0.2 * dataQuality);

  const confidenceInterval = {
    lower: Math.max(0, predicted - intervalWidth),
    upper: predicted + intervalWidth,
  };

  // Adjustment factor
  const adjustmentFactor = predicted / features.estimatedDuration;

  // Warning for large deviations
  if (adjustmentFactor < 0.5 || adjustmentFactor > 2.0) {
    warnings.push(
      `Significant adjustment: ${Math.round(adjustmentFactor * 100)}% of estimate`
    );
  }

  return {
    predictedMinutes: Math.round(predicted),
    confidenceInterval: {
      lower: Math.round(confidenceInterval.lower),
      upper: Math.round(confidenceInterval.upper),
    },
    accuracy,
    adjustmentFactor,
    warnings,
  };
}

/**
 * Analyze prediction accuracy over time
 */
export interface PredictionAccuracyReport {
  totalPredictions: number;
  averageError: number; // mean absolute error in minutes
  medianError: number;
  accuracyTrend: 'improving' | 'stable' | 'declining';
  worstTaskTypes: Array<{ type: string; avgError: number }>;
}

export function analyzePredictionAccuracy(
  history: TaskExecutionRecord[]
): PredictionAccuracyReport {
  // Note: predictedDuration would need to be stored separately or added to interface
  const predictions = history.filter(
    (h) => h.plannedDuration && h.actualDuration
  );

  if (predictions.length === 0) {
    return {
      totalPredictions: 0,
      averageError: 0,
      medianError: 0,
      accuracyTrend: 'stable',
      worstTaskTypes: [],
    };
  }

  // Calculate errors (use plannedDuration as baseline prediction)
  const errors = predictions.map((h) =>
    Math.abs(h.plannedDuration! - h.actualDuration!)
  );

  const averageError = errors.reduce((sum, e) => sum + e, 0) / errors.length;
  const sortedErrors = [...errors].sort((a, b) => a - b);
  const medianError = sortedErrors[Math.floor(sortedErrors.length / 2)];

  // Analyze trend (compare first half vs second half)
  let accuracyTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (predictions.length >= 10) {
    const mid = Math.floor(predictions.length / 2);
    const firstHalfErrors = errors.slice(0, mid);
    const secondHalfErrors = errors.slice(mid);
    const firstAvg =
      firstHalfErrors.reduce((sum, e) => sum + e, 0) / firstHalfErrors.length;
    const secondAvg =
      secondHalfErrors.reduce((sum, e) => sum + e, 0) / secondHalfErrors.length;

    if (secondAvg < firstAvg * 0.8) {
      accuracyTrend = 'improving';
    } else if (secondAvg > firstAvg * 1.2) {
      accuracyTrend = 'declining';
    }
  }

  // Find worst task types (disabled - taskType not in record)
  const worstTaskTypes: Array<{ type: string; avgError: number }> = [];
  /* Disabled until taskType added to TaskExecutionRecord
  const typeErrors: { [type: string]: number[] } = {};
  predictions.forEach((h) => {
    if (!typeErrors[h.taskType]) typeErrors[h.taskType] = [];
    typeErrors[h.taskType].push(
      Math.abs(h.plannedDuration! - h.actualDuration!)
    );
  });

  const worstTaskTypes = Object.entries(typeErrors)
    .map(([type, errs]) => ({
      type,
      avgError: errs.reduce((sum, e) => sum + e, 0) / errs.length,
    }))
    .sort((a, b) => b.avgError - a.avgError)
    .slice(0, 5);
  */

  return {
    totalPredictions: predictions.length,
    averageError: Math.round(averageError),
    medianError: Math.round(medianError),
    accuracyTrend,
    worstTaskTypes,
  };
}
