/**
 * ML Utilities - Core mathematical operations for machine learning
 * Pure functions, no I/O, fully deterministic
 */

/**
 * Vector operations
 */
export function dotProduct(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vector dimensions must match');
  }
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

export function vectorAdd(a: number[], b: number[]): number[] {
  if (a.length !== b.length) {
    throw new Error('Vector dimensions must match');
  }
  return a.map((val, i) => val + b[i]);
}

export function vectorSubtract(a: number[], b: number[]): number[] {
  if (a.length !== b.length) {
    throw new Error('Vector dimensions must match');
  }
  return a.map((val, i) => val - b[i]);
}

export function vectorScale(v: number[], scalar: number): number[] {
  return v.map((val) => val * scalar);
}

export function vectorMagnitude(v: number[]): number {
  return Math.sqrt(dotProduct(v, v));
}

export function vectorNormalize(v: number[]): number[] {
  const mag = vectorMagnitude(v);
  if (mag === 0) return v.map(() => 0);
  return vectorScale(v, 1 / mag);
}

/**
 * Matrix operations
 */
export function matrixMultiply(a: number[][], b: number[][]): number[][] {
  if (a[0].length !== b.length) {
    throw new Error('Matrix dimensions incompatible for multiplication');
  }
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

export function matrixTranspose(m: number[][]): number[][] {
  const rows = m.length;
  const cols = m[0].length;
  const result: number[][] = [];
  for (let j = 0; j < cols; j++) {
    result[j] = [];
    for (let i = 0; i < rows; i++) {
      result[j][i] = m[i][j];
    }
  }
  return result;
}

export function matrixScale(m: number[][], scalar: number): number[][] {
  return m.map((row) => row.map((val) => val * scalar));
}

/**
 * Statistical operations
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

export function variance(values: number[]): number {
  if (values.length === 0) return 0;
  const m = mean(values);
  return (
    values.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / values.length
  );
}

export function standardDeviation(values: number[]): number {
  return Math.sqrt(variance(values));
}

export function covariance(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  const meanX = mean(x);
  const meanY = mean(y);
  return (
    x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0) /
    x.length
  );
}

export function correlation(x: number[], y: number[]): number {
  const cov = covariance(x, y);
  const stdX = standardDeviation(x);
  const stdY = standardDeviation(y);
  if (stdX === 0 || stdY === 0) return 0;
  return cov / (stdX * stdY);
}

/**
 * Linear regression
 */
export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  predictions: number[];
}

export function linearRegression(
  x: number[],
  y: number[]
): LinearRegressionResult {
  if (x.length !== y.length || x.length < 2) {
    throw new Error('Need at least 2 data points with matching dimensions');
  }

  const n = x.length;
  const meanX = mean(x);
  const meanY = mean(y);

  // Calculate slope: Σ((x - x̄)(y - ȳ)) / Σ((x - x̄)²)
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    const xDiff = x[i] - meanX;
    const yDiff = y[i] - meanY;
    numerator += xDiff * yDiff;
    denominator += xDiff * xDiff;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = meanY - slope * meanX;

  // Calculate predictions and R²
  const predictions = x.map((val) => slope * val + intercept);
  const ssTotal = y.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0);
  const ssResidual = y.reduce(
    (sum, val, i) => sum + Math.pow(val - predictions[i], 2),
    0
  );
  const rSquared = ssTotal === 0 ? 1 : 1 - ssResidual / ssTotal;

  return { slope, intercept, rSquared, predictions };
}

/**
 * Logistic regression (simple binary classifier)
 */
export interface LogisticRegressionResult {
  weights: number[];
  bias: number;
  accuracy: number;
}

function sigmoid(z: number): number {
  // Clamp to avoid overflow in Math.exp()
  if (z > 500) return 1;
  if (z < -500) return 0;
  return 1 / (1 + Math.exp(-z));
}

export function logisticRegression(
  X: number[][], // features (rows = samples, cols = features)
  y: number[], // binary labels (0 or 1)
  learningRate = 0.01,
  iterations = 1000
): LogisticRegressionResult {
  if (X.length !== y.length || X.length === 0) {
    throw new Error('X and y must have same length and be non-empty');
  }

  const m = X.length; // number of samples
  const n = X[0].length; // number of features

  // Initialize weights and bias
  let weights = new Array(n).fill(0);
  let bias = 0;

  // Gradient descent
  for (let iter = 0; iter < iterations; iter++) {
    // Forward pass: compute predictions
    const predictions = X.map((row) => {
      const z = dotProduct(row, weights) + bias;
      return sigmoid(z);
    });

    // Compute gradients
    const dWeights = new Array(n).fill(0);
    let dBias = 0;

    for (let i = 0; i < m; i++) {
      const error = predictions[i] - y[i];
      dBias += error;
      for (let j = 0; j < n; j++) {
        dWeights[j] += error * X[i][j];
      }
    }

    // Update parameters
    for (let j = 0; j < n; j++) {
      weights[j] -= (learningRate * dWeights[j]) / m;
    }
    bias -= (learningRate * dBias) / m;
  }

  // Calculate accuracy
  const finalPredictions = X.map((row) => {
    const z = dotProduct(row, weights) + bias;
    return sigmoid(z) >= 0.5 ? 1 : 0;
  });
  const correct: number = finalPredictions.reduce(
    (sum, pred, i) => sum + (pred === y[i] ? 1 : 0),
    0 as number
  );
  const accuracy = correct / m;

  return { weights, bias, accuracy };
}

/**
 * Markov chain operations
 */
export interface MarkovChain {
  states: string[];
  transitionMatrix: number[][]; // P[i][j] = probability of transitioning from state i to state j
}

export function createMarkovChain(
  transitions: Array<{ from: string; to: string }>
): MarkovChain {
  // Get unique states
  const stateSet = new Set<string>();
  transitions.forEach((t) => {
    stateSet.add(t.from);
    stateSet.add(t.to);
  });
  const states = Array.from(stateSet).sort();

  // Count transitions
  const counts: { [key: string]: { [key: string]: number } } = {};
  states.forEach((s) => (counts[s] = {}));

  transitions.forEach((t) => {
    if (!counts[t.from][t.to]) counts[t.from][t.to] = 0;
    counts[t.from][t.to]++;
  });

  // Build transition matrix with probabilities
  const matrix: number[][] = [];
  for (let i = 0; i < states.length; i++) {
    const fromState = states[i];
    const total = Object.values(counts[fromState]).reduce(
      (sum, count) => sum + count,
      0
    );
    matrix[i] = [];
    for (let j = 0; j < states.length; j++) {
      const toState = states[j];
      const count = counts[fromState][toState] || 0;
      matrix[i][j] = total === 0 ? 0 : count / total;
    }
  }

  return { states, transitionMatrix: matrix };
}

export function predictNextState(
  chain: MarkovChain,
  currentState: string
): { state: string; probability: number }[] {
  const stateIndex = chain.states.indexOf(currentState);
  if (stateIndex === -1) {
    // Unknown state - return empty predictions instead of throwing
    return [];
  }

  const probabilities = chain.transitionMatrix[stateIndex];
  return chain.states
    .map((state, i) => ({ state, probability: probabilities[i] }))
    .filter((p) => p.probability > 0)
    .sort((a, b) => b.probability - a.probability);
}

export function simulateMarkovChain(
  chain: MarkovChain,
  initialState: string,
  steps: number
): string[] {
  const path: string[] = [initialState];
  let currentState = initialState;

  for (let step = 0; step < steps; step++) {
    const stateIndex = chain.states.indexOf(currentState);
    if (stateIndex === -1) break;

    const probabilities = chain.transitionMatrix[stateIndex];

    // Sample next state based on probabilities
    const random = Math.random();
    let cumulative = 0;
    let nextState = currentState;

    for (let i = 0; i < probabilities.length; i++) {
      cumulative += probabilities[i];
      if (random <= cumulative) {
        nextState = chain.states[i];
        break;
      }
    }

    path.push(nextState);
    currentState = nextState;
  }

  return path;
}

/**
 * Exponential smoothing for time series
 */
export function exponentialSmoothing(
  values: number[],
  alpha: number = 0.3
): number[] {
  if (values.length === 0) return [];
  if (alpha < 0 || alpha > 1) {
    throw new Error('Alpha must be between 0 and 1');
  }

  const smoothed: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    smoothed[i] = alpha * values[i] + (1 - alpha) * smoothed[i - 1];
  }
  return smoothed;
}

/**
 * Moving average
 */
export function movingAverage(values: number[], windowSize: number): number[] {
  if (windowSize <= 0 || windowSize > values.length) {
    throw new Error('Invalid window size');
  }

  const result: number[] = [];
  for (let i = 0; i <= values.length - windowSize; i++) {
    const window = values.slice(i, i + windowSize);
    result.push(mean(window));
  }
  return result;
}
