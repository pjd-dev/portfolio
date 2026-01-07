/**
 * State Forecaster - State-space model for human state prediction
 * Models energy, stress, and focus as interconnected time series
 */

import { exponentialSmoothing, movingAverage, mean } from './ml-utils.js';

export interface StateVector {
  energy: number;
  stress: number;
  focus: number;
  timestamp: string;
}

export interface StateForecast {
  predicted: StateVector;
  confidence: number; // 0-1
  trend: 'improving' | 'stable' | 'declining';
  recommendations: string[];
  risksDetected: string[];
}

/**
 * State-space model parameters
 */
interface StateSpaceModel {
  // State transition matrix (how states evolve)
  A: number[][];
  // Observation matrix (how we measure states)
  H: number[][];
  // Process noise covariance
  Q: number[][];
  // Measurement noise covariance
  R: number[][];
}

/**
 * Simple Kalman filter for state estimation
 */
function kalmanFilter(
  measurements: StateVector[],
  model: StateSpaceModel
): StateVector[] {
  if (measurements.length === 0) return [];

  // Initialize state estimate
  let stateEstimate = [
    measurements[0].energy,
    measurements[0].stress,
    measurements[0].focus,
  ];

  // Initialize covariance
  let P = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];

  const filtered: StateVector[] = [];

  measurements.forEach((m, i) => {
    // Prediction step
    const statePred = matrixVectorMultiply(model.A, stateEstimate);
    const PPred = matrixAdd(
      matrixMultiply(matrixMultiply(model.A, P), transposeMatrix(model.A)),
      model.Q
    );

    // Measurement
    const z = [m.energy, m.stress, m.focus];

    // Innovation
    const y = vectorSubtract(z, matrixVectorMultiply(model.H, statePred));

    // Innovation covariance
    const S = matrixAdd(
      matrixMultiply(matrixMultiply(model.H, PPred), transposeMatrix(model.H)),
      model.R
    );

    // Kalman gain
    const K = matrixMultiply(
      matrixMultiply(PPred, transposeMatrix(model.H)),
      invertMatrix(S)
    );

    // Update step
    stateEstimate = vectorAdd(statePred, matrixVectorMultiply(K, y));
    P = matrixMultiply(
      matrixSubtract(identityMatrix(3), matrixMultiply(K, model.H)),
      PPred
    );

    filtered.push({
      energy: clamp(stateEstimate[0], 0, 1),
      stress: clamp(stateEstimate[1], 0, 1),
      focus: clamp(stateEstimate[2], 0, 1),
      timestamp: m.timestamp,
    });
  });

  return filtered;
}

/**
 * Forecast future state based on historical data
 */
export function forecastState(
  history: StateVector[],
  hoursAhead: number = 1
): StateForecast {
  if (history.length < 3) {
    return {
      predicted: history[history.length - 1] || {
        energy: 0.5,
        stress: 0.5,
        focus: 0.5,
        timestamp: new Date().toISOString(),
      },
      confidence: 0.3,
      trend: 'stable',
      recommendations: ['Insufficient data for accurate forecast'],
      risksDetected: [],
    };
  }

  // Build state-space model with learned parameters
  const model: StateSpaceModel = {
    // Assume states have moderate persistence and some coupling
    A: [
      [0.9, -0.1, 0.0], // energy: persists, reduced by stress
      [0.0, 0.85, -0.1], // stress: persists, reduced by focus
      [-0.05, -0.15, 0.8], // focus: reduced by low energy and high stress
    ],
    H: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
    Q: [
      [0.01, 0, 0],
      [0, 0.01, 0],
      [0, 0, 0.01],
    ],
    R: [
      [0.05, 0, 0],
      [0, 0.05, 0],
      [0, 0, 0.05],
    ],
  };

  // Apply Kalman filtering to get smoothed estimates
  const filtered = kalmanFilter(history, model);

  // Get recent trend
  const recentWindow = Math.min(10, filtered.length);
  const recent = filtered.slice(-recentWindow);

  const energyTrend = calculateTrend(recent.map((s) => s.energy));
  const stressTrend = calculateTrend(recent.map((s) => s.stress));
  const focusTrend = calculateTrend(recent.map((s) => s.focus));

  // Forecast next state by applying transition matrix
  const current = filtered[filtered.length - 1];
  const currentState = [current.energy, current.stress, current.focus];

  let predicted = currentState;
  for (let h = 0; h < hoursAhead; h++) {
    predicted = matrixVectorMultiply(model.A, predicted);
  }

  const predictedState: StateVector = {
    energy: clamp(predicted[0], 0, 1),
    stress: clamp(predicted[1], 0, 1),
    focus: clamp(predicted[2], 0, 1),
    timestamp: new Date(
      new Date(current.timestamp).getTime() + hoursAhead * 60 * 60 * 1000
    ).toISOString(),
  };

  // Calculate confidence based on data quality and variance
  const energyVariance = variance(recent.map((s) => s.energy));
  const stressVariance = variance(recent.map((s) => s.stress));
  const focusVariance = variance(recent.map((s) => s.focus));
  const avgVariance = (energyVariance + stressVariance + focusVariance) / 3;

  const dataQuality = Math.min(history.length / 20, 1);
  const confidence = Math.max(
    0.3,
    Math.min(0.95, dataQuality * (1 - avgVariance))
  );

  // Determine overall trend
  let trend: 'improving' | 'stable' | 'declining';
  const trendScore = energyTrend + focusTrend - stressTrend;
  if (trendScore > 0.1) {
    trend = 'improving';
  } else if (trendScore < -0.1) {
    trend = 'declining';
  } else {
    trend = 'stable';
  }

  // Generate recommendations
  const recommendations: string[] = [];
  const risksDetected: string[] = [];

  if (predictedState.energy < 0.3) {
    recommendations.push(
      'Energy forecast is low. Schedule rest or lighter tasks.'
    );
    risksDetected.push('Low energy predicted');
  }

  if (predictedState.stress > 0.7) {
    recommendations.push(
      'High stress expected. Consider stress management techniques.'
    );
    risksDetected.push('High stress predicted');
  }

  if (predictedState.focus < 0.4) {
    recommendations.push(
      'Focus may be impaired. Avoid complex tasks during this period.'
    );
    risksDetected.push('Low focus predicted');
  }

  if (energyTrend < -0.05) {
    recommendations.push(
      'Energy declining over time. Review workload and rest schedule.'
    );
    risksDetected.push('Declining energy trend');
  }

  if (stressTrend > 0.05) {
    recommendations.push('Stress increasing. Identify and address stressors.');
    risksDetected.push('Rising stress trend');
  }

  if (trend === 'improving' && risksDetected.length === 0) {
    recommendations.push(
      'Positive trajectory detected. Good time for challenging work.'
    );
  }

  return {
    predicted: predictedState,
    confidence,
    trend,
    recommendations,
    risksDetected,
  };
}

/**
 * Analyze state patterns and correlations
 */
export interface StatePatternAnalysis {
  dailyPattern: {
    peakEnergyHour: number;
    worstStressHour: number;
    bestFocusHour: number;
  };
  correlations: {
    energyStress: number;
    energyFocus: number;
    stressFocus: number;
  };
  cycleLength: number | null; // hours in typical energy cycle
  insights: string[];
}

export function analyzeStatePatterns(
  history: StateVector[]
): StatePatternAnalysis {
  if (history.length < 10) {
    return {
      dailyPattern: {
        peakEnergyHour: 10,
        worstStressHour: 17,
        bestFocusHour: 9,
      },
      correlations: { energyStress: -0.3, energyFocus: 0.5, stressFocus: -0.4 },
      cycleLength: null,
      insights: ['Insufficient data for pattern analysis'],
    };
  }

  // Group by hour of day
  const hourlyStats: {
    [hour: number]: { energy: number[]; stress: number[]; focus: number[] };
  } = {};

  history.forEach((s) => {
    const hour = new Date(s.timestamp).getHours();
    if (!hourlyStats[hour]) {
      hourlyStats[hour] = { energy: [], stress: [], focus: [] };
    }
    hourlyStats[hour].energy.push(s.energy);
    hourlyStats[hour].stress.push(s.stress);
    hourlyStats[hour].focus.push(s.focus);
  });

  // Find peak/worst hours
  let peakEnergyHour = 10;
  let maxEnergy = 0;
  let worstStressHour = 17;
  let maxStress = 0;
  let bestFocusHour = 9;
  let maxFocus = 0;

  Object.entries(hourlyStats).forEach(([hourStr, stats]) => {
    const hour = parseInt(hourStr);
    const avgEnergy = mean(stats.energy);
    const avgStress = mean(stats.stress);
    const avgFocus = mean(stats.focus);

    if (avgEnergy > maxEnergy) {
      maxEnergy = avgEnergy;
      peakEnergyHour = hour;
    }
    if (avgStress > maxStress) {
      maxStress = avgStress;
      worstStressHour = hour;
    }
    if (avgFocus > maxFocus) {
      maxFocus = avgFocus;
      bestFocusHour = hour;
    }
  });

  // Calculate correlations
  const energyValues = history.map((s) => s.energy);
  const stressValues = history.map((s) => s.stress);
  const focusValues = history.map((s) => s.focus);

  const energyStress = correlation(energyValues, stressValues);
  const energyFocus = correlation(energyValues, focusValues);
  const stressFocus = correlation(stressValues, focusValues);

  // Detect cycles (simplified: look for periodicity in energy)
  const cycleLength = detectCycle(energyValues);

  // Generate insights
  const insights: string[] = [];
  insights.push(`Peak energy typically occurs around ${peakEnergyHour}:00`);
  insights.push(`Stress tends to peak around ${worstStressHour}:00`);
  insights.push(`Best focus occurs around ${bestFocusHour}:00`);

  if (Math.abs(energyStress) > 0.5) {
    insights.push(
      `Strong ${energyStress > 0 ? 'positive' : 'negative'} correlation between energy and stress`
    );
  }

  if (energyFocus > 0.5) {
    insights.push('Higher energy strongly predicts better focus');
  }

  if (cycleLength) {
    insights.push(`Energy follows a ~${cycleLength}-hour cycle pattern`);
  }

  return {
    dailyPattern: { peakEnergyHour, worstStressHour, bestFocusHour },
    correlations: {
      energyStress: Math.round(energyStress * 100) / 100,
      energyFocus: Math.round(energyFocus * 100) / 100,
      stressFocus: Math.round(stressFocus * 100) / 100,
    },
    cycleLength,
    insights,
  };
}

// Helper functions

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = values;
  const meanX = mean(x);
  const meanY = mean(y);

  const numerator = x.reduce(
    (sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY),
    0
  );
  const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0);

  return denominator === 0 ? 0 : numerator / denominator;
}

function variance(values: number[]): number {
  if (values.length === 0) return 0;
  const m = mean(values);
  return values.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / values.length;
}

function correlation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  const meanX = mean(x);
  const meanY = mean(y);
  const cov =
    x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0) / x.length;
  const stdX = Math.sqrt(variance(x));
  const stdY = Math.sqrt(variance(y));
  if (stdX === 0 || stdY === 0) return 0;
  return cov / (stdX * stdY);
}

function detectCycle(values: number[]): number | null {
  // Simple autocorrelation-based cycle detection
  if (values.length < 20) return null;

  const maxLag = Math.min(12, Math.floor(values.length / 2));
  let bestLag = 0;
  let bestCorr = 0;

  for (let lag = 2; lag <= maxLag; lag++) {
    const x = values.slice(0, -lag);
    const y = values.slice(lag);
    const corr = Math.abs(correlation(x, y));

    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }

  return bestCorr > 0.5 ? bestLag : null;
}

// Matrix operations (simplified versions)
function matrixVectorMultiply(m: number[][], v: number[]): number[] {
  return m.map((row) => row.reduce((sum, val, i) => sum + val * v[i], 0));
}

function vectorAdd(a: number[], b: number[]): number[] {
  return a.map((val, i) => val + b[i]);
}

function vectorSubtract(a: number[], b: number[]): number[] {
  return a.map((val, i) => val - b[i]);
}

function matrixMultiply(a: number[][], b: number[][]): number[][] {
  const result: number[][] = [];
  for (let i = 0; i < a.length; i++) {
    result[i] = [];
    for (let j = 0; j < b[0].length; j++) {
      let sum = 0;
      for (let k = 0; k < b.length; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

function matrixAdd(a: number[][], b: number[][]): number[][] {
  return a.map((row, i) => row.map((val, j) => val + b[i][j]));
}

function matrixSubtract(a: number[][], b: number[][]): number[][] {
  return a.map((row, i) => row.map((val, j) => val - b[i][j]));
}

function transposeMatrix(m: number[][]): number[][] {
  return m[0].map((_, i) => m.map((row) => row[i]));
}

function identityMatrix(n: number): number[][] {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );
}

function invertMatrix(m: number[][]): number[][] {
  // Simplified 3x3 matrix inversion
  if (m.length !== 3 || m[0].length !== 3) {
    throw new Error('Only 3x3 matrices supported');
  }

  const det =
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);

  if (Math.abs(det) < 1e-10) {
    // Matrix is singular, return identity as fallback
    return identityMatrix(3);
  }

  const inv: number[][] = [
    [
      (m[1][1] * m[2][2] - m[1][2] * m[2][1]) / det,
      (m[0][2] * m[2][1] - m[0][1] * m[2][2]) / det,
      (m[0][1] * m[1][2] - m[0][2] * m[1][1]) / det,
    ],
    [
      (m[1][2] * m[2][0] - m[1][0] * m[2][2]) / det,
      (m[0][0] * m[2][2] - m[0][2] * m[2][0]) / det,
      (m[0][2] * m[1][0] - m[0][0] * m[1][2]) / det,
    ],
    [
      (m[1][0] * m[2][1] - m[1][1] * m[2][0]) / det,
      (m[0][1] * m[2][0] - m[0][0] * m[2][1]) / det,
      (m[0][0] * m[1][1] - m[0][1] * m[1][0]) / det,
    ],
  ];

  return inv;
}
