/**
 * ML Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  dotProduct,
  vectorAdd,
  vectorSubtract,
  vectorScale,
  vectorMagnitude,
  vectorNormalize,
  matrixMultiply,
  matrixTranspose,
  matrixScale,
  mean,
  variance,
  standardDeviation,
  covariance,
  correlation,
  linearRegression,
  logisticRegression,
  createMarkovChain,
  predictNextState,
  simulateMarkovChain,
  exponentialSmoothing,
  movingAverage,
} from '../ml-utils.js';

describe('Vector Operations', () => {
  describe('dotProduct', () => {
    it('should compute dot product of two vectors', () => {
      expect(dotProduct([1, 2, 3], [4, 5, 6])).toBe(32); // 1*4 + 2*5 + 3*6
    });

    it('should return 0 for orthogonal vectors', () => {
      expect(dotProduct([1, 0], [0, 1])).toBe(0);
    });

    it('should throw for mismatched dimensions', () => {
      expect(() => dotProduct([1, 2], [1, 2, 3])).toThrow(
        'Vector dimensions must match'
      );
    });
  });

  describe('vectorAdd', () => {
    it('should add two vectors element-wise', () => {
      expect(vectorAdd([1, 2, 3], [4, 5, 6])).toEqual([5, 7, 9]);
    });

    it('should throw for mismatched dimensions', () => {
      expect(() => vectorAdd([1, 2], [1])).toThrow(
        'Vector dimensions must match'
      );
    });
  });

  describe('vectorSubtract', () => {
    it('should subtract two vectors element-wise', () => {
      expect(vectorSubtract([5, 7, 9], [4, 5, 6])).toEqual([1, 2, 3]);
    });
  });

  describe('vectorScale', () => {
    it('should scale vector by scalar', () => {
      expect(vectorScale([1, 2, 3], 2)).toEqual([2, 4, 6]);
    });

    it('should handle negative scalars', () => {
      expect(vectorScale([1, 2, 3], -1)).toEqual([-1, -2, -3]);
    });
  });

  describe('vectorMagnitude', () => {
    it('should compute magnitude of vector', () => {
      expect(vectorMagnitude([3, 4])).toBe(5); // 3-4-5 triangle
    });

    it('should return 0 for zero vector', () => {
      expect(vectorMagnitude([0, 0, 0])).toBe(0);
    });
  });

  describe('vectorNormalize', () => {
    it('should normalize vector to unit length', () => {
      const normalized = vectorNormalize([3, 4]);
      expect(normalized[0]).toBeCloseTo(0.6);
      expect(normalized[1]).toBeCloseTo(0.8);
      expect(vectorMagnitude(normalized)).toBeCloseTo(1);
    });

    it('should handle zero vector', () => {
      expect(vectorNormalize([0, 0])).toEqual([0, 0]);
    });
  });
});

describe('Matrix Operations', () => {
  describe('matrixMultiply', () => {
    it('should multiply 2x2 matrices', () => {
      const a = [
        [1, 2],
        [3, 4],
      ];
      const b = [
        [5, 6],
        [7, 8],
      ];
      const result = matrixMultiply(a, b);
      expect(result).toEqual([
        [19, 22],
        [43, 50],
      ]);
    });

    it('should multiply non-square matrices', () => {
      const a = [
        [1, 2, 3],
        [4, 5, 6],
      ]; // 2x3
      const b = [
        [7, 8],
        [9, 10],
        [11, 12],
      ]; // 3x2
      const result = matrixMultiply(a, b); // should be 2x2
      expect(result).toEqual([
        [58, 64],
        [139, 154],
      ]);
    });

    it('should throw for incompatible dimensions', () => {
      const a = [
        [1, 2],
        [3, 4],
      ]; // 2x2
      const b = [[1, 2, 3]]; // 1x3
      expect(() => matrixMultiply(a, b)).toThrow(
        'Matrix dimensions incompatible'
      );
    });
  });

  describe('matrixTranspose', () => {
    it('should transpose a matrix', () => {
      const m = [
        [1, 2, 3],
        [4, 5, 6],
      ];
      expect(matrixTranspose(m)).toEqual([
        [1, 4],
        [2, 5],
        [3, 6],
      ]);
    });
  });

  describe('matrixScale', () => {
    it('should scale all elements', () => {
      const m = [
        [1, 2],
        [3, 4],
      ];
      expect(matrixScale(m, 2)).toEqual([
        [2, 4],
        [6, 8],
      ]);
    });
  });
});

describe('Statistical Operations', () => {
  describe('mean', () => {
    it('should compute mean of values', () => {
      expect(mean([1, 2, 3, 4, 5])).toBe(3);
    });

    it('should return 0 for empty array', () => {
      expect(mean([])).toBe(0);
    });
  });

  describe('variance', () => {
    it('should compute variance', () => {
      expect(variance([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(4);
    });

    it('should return 0 for constant values', () => {
      expect(variance([5, 5, 5, 5])).toBe(0);
    });
  });

  describe('standardDeviation', () => {
    it('should compute standard deviation', () => {
      expect(standardDeviation([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2);
    });
  });

  describe('covariance', () => {
    it('should compute covariance of two datasets', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10]; // y = 2x, perfect positive correlation
      expect(covariance(x, y)).toBeCloseTo(4); // should be positive
    });

    it('should be 0 for uncorrelated data', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [3, 3, 3, 3, 3]; // constant
      expect(covariance(x, y)).toBe(0);
    });
  });

  describe('correlation', () => {
    it('should return 1 for perfect positive correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      expect(correlation(x, y)).toBeCloseTo(1);
    });

    it('should return -1 for perfect negative correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [10, 8, 6, 4, 2];
      expect(correlation(x, y)).toBeCloseTo(-1);
    });

    it('should return 0 for no correlation', () => {
      const x = [1, 2, 3];
      const y = [5, 5, 5];
      expect(correlation(x, y)).toBe(0);
    });
  });
});

describe('Linear Regression', () => {
  it('should fit a perfect linear relationship', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [3, 5, 7, 9, 11]; // y = 2x + 1
    const result = linearRegression(x, y);

    expect(result.slope).toBeCloseTo(2);
    expect(result.intercept).toBeCloseTo(1);
    expect(result.rSquared).toBeCloseTo(1);
  });

  it('should handle noisy data', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2.1, 4.2, 5.8, 8.1, 9.9]; // approximately y = 2x
    const result = linearRegression(x, y);

    expect(result.slope).toBeCloseTo(2, 0);
    expect(result.rSquared).toBeGreaterThan(0.95);
  });

  it('should throw for insufficient data', () => {
    expect(() => linearRegression([1], [2])).toThrow(
      'Need at least 2 data points'
    );
  });

  it('should generate predictions', () => {
    const x = [1, 2, 3];
    const y = [2, 4, 6]; // y = 2x
    const result = linearRegression(x, y);

    expect(result.predictions).toHaveLength(3);
    expect(result.predictions[0]).toBeCloseTo(2);
    expect(result.predictions[2]).toBeCloseTo(6);
  });
});

describe('Logistic Regression', () => {
  it('should classify linearly separable data', () => {
    // Simple case: classify based on whether x > 0.5
    const X = [
      [0.1],
      [0.2],
      [0.3],
      [0.4], // class 0
      [0.6],
      [0.7],
      [0.8],
      [0.9], // class 1
    ];
    const y = [0, 0, 0, 0, 1, 1, 1, 1];

    const result = logisticRegression(X, y, 0.5, 2000);

    expect(result.accuracy).toBeGreaterThan(0.7);
    expect(result.weights).toHaveLength(1);
  });

  it('should handle multi-feature classification', () => {
    // 2D features
    const X = [
      [0.1, 0.1],
      [0.2, 0.2],
      [0.3, 0.1],
      [0.1, 0.3], // class 0 (low values)
      [0.8, 0.8],
      [0.9, 0.7],
      [0.7, 0.9],
      [0.9, 0.9], // class 1 (high values)
    ];
    const y = [0, 0, 0, 0, 1, 1, 1, 1];

    const result = logisticRegression(X, y, 0.5, 2000);

    expect(result.accuracy).toBeGreaterThan(0.7);
    expect(result.weights).toHaveLength(2);
  });

  it('should throw for empty data', () => {
    expect(() => logisticRegression([], [])).toThrow(
      'X and y must have same length'
    );
  });
});

describe('Markov Chains', () => {
  describe('createMarkovChain', () => {
    it('should create transition matrix from observations', () => {
      const transitions = [
        { from: 'A', to: 'B' },
        { from: 'A', to: 'B' },
        { from: 'A', to: 'C' },
        { from: 'B', to: 'A' },
        { from: 'B', to: 'C' },
        { from: 'C', to: 'A' },
      ];

      const chain = createMarkovChain(transitions);

      expect(chain.states).toContain('A');
      expect(chain.states).toContain('B');
      expect(chain.states).toContain('C');
      expect(chain.transitionMatrix).toHaveLength(3);

      // From A: 2/3 to B, 1/3 to C
      const aIndex = chain.states.indexOf('A');
      const bIndex = chain.states.indexOf('B');
      const cIndex = chain.states.indexOf('C');

      expect(chain.transitionMatrix[aIndex][bIndex]).toBeCloseTo(2 / 3);
      expect(chain.transitionMatrix[aIndex][cIndex]).toBeCloseTo(1 / 3);
    });

    it('should handle self-transitions', () => {
      const transitions = [
        { from: 'A', to: 'A' },
        { from: 'A', to: 'B' },
      ];

      const chain = createMarkovChain(transitions);
      const aIndex = chain.states.indexOf('A');

      expect(chain.transitionMatrix[aIndex][aIndex]).toBeCloseTo(0.5);
    });
  });

  describe('predictNextState', () => {
    it('should predict next states with probabilities', () => {
      const chain = createMarkovChain([
        { from: 'sunny', to: 'sunny' },
        { from: 'sunny', to: 'sunny' },
        { from: 'sunny', to: 'rainy' },
        { from: 'rainy', to: 'sunny' },
      ]);

      const predictions = predictNextState(chain, 'sunny');

      expect(predictions.length).toBeGreaterThan(0);
      expect(predictions[0].probability).toBeGreaterThan(0);

      // sunny -> sunny should be most likely (2/3)
      const sunnyPred = predictions.find((p) => p.state === 'sunny');
      expect(sunnyPred?.probability).toBeCloseTo(2 / 3);
    });

    it('should throw for unknown state', () => {
      const chain = createMarkovChain([{ from: 'A', to: 'B' }]);
      expect(() => predictNextState(chain, 'Z')).toThrow('State "Z" not found');
    });
  });

  describe('simulateMarkovChain', () => {
    it('should simulate state transitions', () => {
      const chain = createMarkovChain([
        { from: 'A', to: 'B' },
        { from: 'B', to: 'A' },
      ]);

      const path = simulateMarkovChain(chain, 'A', 5);

      expect(path[0]).toBe('A');
      expect(path.length).toBeLessThanOrEqual(6); // initial + 5 steps
      path.forEach((state) => expect(['A', 'B']).toContain(state));
    });
  });
});

describe('Time Series Operations', () => {
  describe('exponentialSmoothing', () => {
    it('should smooth noisy data', () => {
      const values = [10, 12, 8, 14, 10, 16, 12];
      const smoothed = exponentialSmoothing(values, 0.3);

      expect(smoothed).toHaveLength(values.length);
      expect(smoothed[0]).toBe(values[0]); // first value unchanged

      // Smoothed values should have less variance
      expect(variance(smoothed)).toBeLessThan(variance(values));
    });

    it('should handle alpha = 1 (no smoothing)', () => {
      const values = [1, 2, 3, 4, 5];
      const smoothed = exponentialSmoothing(values, 1);
      expect(smoothed).toEqual(values);
    });

    it('should throw for invalid alpha', () => {
      expect(() => exponentialSmoothing([1, 2, 3], 1.5)).toThrow(
        'Alpha must be between 0 and 1'
      );
      expect(() => exponentialSmoothing([1, 2, 3], -0.1)).toThrow(
        'Alpha must be between 0 and 1'
      );
    });
  });

  describe('movingAverage', () => {
    it('should compute moving average', () => {
      const values = [1, 2, 3, 4, 5];
      const ma = movingAverage(values, 3);

      expect(ma).toHaveLength(3); // 5 - 3 + 1
      expect(ma[0]).toBeCloseTo(2); // (1+2+3)/3
      expect(ma[1]).toBeCloseTo(3); // (2+3+4)/3
      expect(ma[2]).toBeCloseTo(4); // (3+4+5)/3
    });

    it('should throw for invalid window size', () => {
      expect(() => movingAverage([1, 2, 3], 0)).toThrow('Invalid window size');
      expect(() => movingAverage([1, 2, 3], 4)).toThrow('Invalid window size');
    });
  });
});
