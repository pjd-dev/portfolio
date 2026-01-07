/**
 * Duration Predictor Tests
 */

import { describe, it, expect } from 'vitest';
import {
  trainDurationPredictor,
  predictDuration,
  analyzePredictionAccuracy,
  type DurationPredictorFeatures,
} from '../duration-predictor.js';
import type { TaskExecutionRecord } from '../prediction-history.js';

// Helper to create task records
function createTaskRecord(
  overrides: Partial<TaskExecutionRecord> = {}
): TaskExecutionRecord {
  return {
    taskId: 'task-' + Math.random().toString(36).slice(2),
    recordedAt: new Date().toISOString(),
    plannedEffort: 5,
    plannedDuration: 60,
    plannedPriority: 5,
    completed: true,
    actualDuration: 55,
    ...overrides,
  };
}

describe('Duration Predictor', () => {
  describe('trainDurationPredictor', () => {
    it('should return null with insufficient data', () => {
      const history = [
        createTaskRecord({ plannedDuration: 60, actualDuration: 55 }),
        createTaskRecord({ plannedDuration: 30, actualDuration: 35 }),
      ];

      expect(trainDurationPredictor(history)).toBeNull();
    });

    it('should train model with sufficient data', () => {
      const history = [
        createTaskRecord({ plannedDuration: 30, actualDuration: 35 }),
        createTaskRecord({ plannedDuration: 60, actualDuration: 65 }),
        createTaskRecord({ plannedDuration: 90, actualDuration: 95 }),
        createTaskRecord({ plannedDuration: 120, actualDuration: 125 }),
        createTaskRecord({ plannedDuration: 150, actualDuration: 155 }),
      ];

      const model = trainDurationPredictor(history);

      expect(model).not.toBeNull();
      expect(model!.slope).toBeCloseTo(1, 0); // actual ≈ planned + 5
      expect(model!.rSquared).toBeGreaterThan(0.9);
    });

    it('should filter out records without duration data', () => {
      const history = [
        createTaskRecord({ plannedDuration: 30, actualDuration: 35 }),
        createTaskRecord({ plannedDuration: 60, actualDuration: undefined }),
        createTaskRecord({ plannedDuration: 90, actualDuration: 95 }),
        createTaskRecord({ plannedDuration: undefined, actualDuration: 125 }),
        createTaskRecord({ plannedDuration: 120, actualDuration: 125 }),
        createTaskRecord({ plannedDuration: 150, actualDuration: 155 }),
        createTaskRecord({ plannedDuration: 180, actualDuration: 185 }),
      ];

      const model = trainDurationPredictor(history);
      expect(model).not.toBeNull();
    });
  });

  describe('predictDuration', () => {
    const baseFeatures: DurationPredictorFeatures = {
      estimatedDuration: 60,
      taskType: 'coding',
      priority: 5,
      complexity: 3,
      effortEstimate: 2,
      humanStateEnergy: 0.7,
      humanStateStress: 0.3,
      humanStateFocus: 0.7,
      hourOfDay: 10,
      dayOfWeek: 2,
    };

    it('should return prediction with empty history', () => {
      const result = predictDuration(baseFeatures, []);

      expect(result.predictedMinutes).toBeGreaterThan(0);
      expect(result.accuracy).toBeDefined();
      expect(result.warnings).toContain(
        'Limited historical data - using estimate as baseline'
      );
    });

    it('should adjust for low energy', () => {
      const normalResult = predictDuration(baseFeatures, []);
      const lowEnergyResult = predictDuration(
        { ...baseFeatures, humanStateEnergy: 0.2 },
        []
      );

      // Formula: energyAdjustment = 1 + (energy - 0.5) * 0.3
      // The adjustments produce different predictions
      expect(lowEnergyResult.predictedMinutes).not.toBe(
        normalResult.predictedMinutes
      );
    });

    it('should adjust for high stress', () => {
      const normalResult = predictDuration(baseFeatures, []);
      const highStressResult = predictDuration(
        { ...baseFeatures, humanStateStress: 0.9 },
        []
      );

      // High stress should increase predicted duration
      expect(highStressResult.predictedMinutes).toBeGreaterThan(
        normalResult.predictedMinutes
      );
    });

    it('should warn about off-hours', () => {
      const result = predictDuration({ ...baseFeatures, hourOfDay: 23 }, []);

      expect(result.warnings).toContain(
        'Off-hours timing may increase duration'
      );
    });

    it('should warn about high complexity', () => {
      const result = predictDuration({ ...baseFeatures, complexity: 5 }, []);

      expect(result.warnings).toContain('High complexity may extend duration');
    });

    it('should provide confidence interval', () => {
      const result = predictDuration(baseFeatures, []);

      expect(result.confidenceInterval.lower).toBeLessThan(
        result.predictedMinutes
      );
      expect(result.confidenceInterval.upper).toBeGreaterThan(
        result.predictedMinutes
      );
    });

    it('should use historical data when available', () => {
      // Create history where actual is always ~20% more than planned
      const history = Array.from({ length: 10 }, (_, i) =>
        createTaskRecord({
          plannedDuration: 50 + i * 10,
          actualDuration: Math.round((50 + i * 10) * 1.2),
        })
      );

      const result = predictDuration(baseFeatures, history);

      // Should adjust estimate upward based on history
      expect(result.adjustmentFactor).toBeGreaterThan(1);
      expect(result.accuracy).toBeGreaterThan(0.5);
    });

    it('should warn about large adjustments', () => {
      // Create history where actual is always double planned
      const history = Array.from({ length: 10 }, (_, i) =>
        createTaskRecord({
          plannedDuration: 30 + i * 10,
          actualDuration: (30 + i * 10) * 2.5,
        })
      );

      const result = predictDuration(baseFeatures, history);

      expect(
        result.warnings.some((w) => w.includes('Significant adjustment'))
      ).toBe(true);
    });
  });

  describe('analyzePredictionAccuracy', () => {
    it('should return zeros for empty history', () => {
      const result = analyzePredictionAccuracy([]);

      expect(result.totalPredictions).toBe(0);
      expect(result.averageError).toBe(0);
      expect(result.accuracyTrend).toBe('stable');
    });

    it('should calculate average error', () => {
      const history = [
        createTaskRecord({ plannedDuration: 60, actualDuration: 70 }), // 10 error
        createTaskRecord({ plannedDuration: 60, actualDuration: 50 }), // 10 error
        createTaskRecord({ plannedDuration: 60, actualDuration: 80 }), // 20 error
      ];

      const result = analyzePredictionAccuracy(history);

      expect(result.totalPredictions).toBe(3);
      expect(result.averageError).toBeCloseTo(13, 0); // (10+10+20)/3
    });

    it('should detect improving accuracy trend', () => {
      // First half: large errors, second half: small errors
      const history: TaskExecutionRecord[] = [];

      // First 5: large errors (30 min diff)
      for (let i = 0; i < 5; i++) {
        history.push(
          createTaskRecord({
            plannedDuration: 60,
            actualDuration: 90,
          })
        );
      }

      // Last 5: small errors (5 min diff)
      for (let i = 0; i < 5; i++) {
        history.push(
          createTaskRecord({
            plannedDuration: 60,
            actualDuration: 65,
          })
        );
      }

      const result = analyzePredictionAccuracy(history);

      expect(result.accuracyTrend).toBe('improving');
    });

    it('should detect declining accuracy trend', () => {
      // First half: small errors, second half: large errors
      const history: TaskExecutionRecord[] = [];

      // First 5: small errors
      for (let i = 0; i < 5; i++) {
        history.push(
          createTaskRecord({
            plannedDuration: 60,
            actualDuration: 65,
          })
        );
      }

      // Last 5: large errors
      for (let i = 0; i < 5; i++) {
        history.push(
          createTaskRecord({
            plannedDuration: 60,
            actualDuration: 100,
          })
        );
      }

      const result = analyzePredictionAccuracy(history);

      expect(result.accuracyTrend).toBe('declining');
    });
  });
});
