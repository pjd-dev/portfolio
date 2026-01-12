/**
 * Prediction Feedback Loop Tests
 *
 * Tests for continuous learning from prediction accuracy.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  type FeedbackLoopState,
  type PredictionRecord,
  type PredictionOutcome,
  createFeedbackLoopState,
  recordPrediction,
  recordOutcome,
  computePredictionError,
  computeMetrics,
  computeAdjustments,
  applyAdjustments,
  formatFeedbackSummary,
  exportFeedbackData,
} from '../feedback-loop.js';
import type { TaskPrediction } from '../predictions.js';
import type { TaskExecutionRecord } from '../prediction-history.js';
import type { HumanStateSnapshot } from '../human-state-series.js';

describe('feedback-loop', () => {
  const mockHumanState: HumanStateSnapshot = {
    timestamp: new Date().toISOString(),
    energy: 0.7,
    stress: 0.3,
    focus: 0.8,
  };

  const mockPrediction: TaskPrediction = {
    taskId: 'task-1',
    predictedDuration: 60,
    durationConfidence: 0.8,
    durationFactors: {},
    predictedQuality: 4,
    qualityConfidence: 0.7,
    qualityFactors: {},
    completionProbability: 0.85,
    risks: [],
    overallConfidence: 0.75,
  };

  describe('createFeedbackLoopState', () => {
    it('creates initial state', () => {
      const state = createFeedbackLoopState();

      expect(state.pendingPredictions.size).toBe(0);
      expect(state.completedPairs).toEqual([]);
      expect(state.metrics.sampleCount).toBe(0);
      expect(state.adjustments).toEqual([]);
      expect(state.modelVersion).toBe('1.0.0');
    });

    it('accepts custom model version', () => {
      const state = createFeedbackLoopState('2.0.0');

      expect(state.modelVersion).toBe('2.0.0');
    });
  });

  describe('recordPrediction', () => {
    it('adds prediction to pending', () => {
      let state = createFeedbackLoopState();
      state = recordPrediction(state, 'task-1', mockPrediction, mockHumanState);

      expect(state.pendingPredictions.size).toBe(1);
      expect(state.pendingPredictions.has('task-1')).toBe(true);

      const record = state.pendingPredictions.get('task-1')!;
      expect(record.taskId).toBe('task-1');
      expect(record.predictedDuration).toBe(60);
      expect(record.predictedQuality).toBe(4);
      expect(record.predictedCompletion).toBe(0.85);
    });

    it('updates lastUpdated timestamp', () => {
      const before = new Date().toISOString();
      let state = createFeedbackLoopState();
      state = recordPrediction(state, 'task-1', mockPrediction, mockHumanState);

      expect(state.lastUpdated >= before).toBe(true);
    });
  });

  describe('recordOutcome', () => {
    it('moves prediction from pending to completed', () => {
      let state = createFeedbackLoopState();
      state = recordPrediction(state, 'task-1', mockPrediction, mockHumanState);

      const execution: TaskExecutionRecord = {
        taskId: 'task-1',
        recordedAt: new Date().toISOString(),
        plannedEffort: 5,
        plannedDuration: 60,
        plannedPriority: 7,
        actualDuration: 55,
        actualEffort: 5,
        completed: true,
        qualityRating: 4,
      };

      state = recordOutcome(state, 'task-1', execution);

      expect(state.pendingPredictions.size).toBe(0);
      expect(state.completedPairs).toHaveLength(1);
    });

    it('ignores outcome without matching prediction', () => {
      let state = createFeedbackLoopState();

      const execution: TaskExecutionRecord = {
        taskId: 'task-unknown',
        recordedAt: new Date().toISOString(),
        plannedEffort: 5,
        plannedDuration: 60,
        plannedPriority: 7,
        completed: true,
      };

      const newState = recordOutcome(state, 'task-unknown', execution);

      expect(newState.completedPairs).toHaveLength(0);
    });

    it('recomputes metrics after recording', () => {
      let state = createFeedbackLoopState();
      state = recordPrediction(state, 'task-1', mockPrediction, mockHumanState);

      const execution: TaskExecutionRecord = {
        taskId: 'task-1',
        recordedAt: new Date().toISOString(),
        plannedEffort: 5,
        plannedDuration: 60,
        plannedPriority: 7,
        actualDuration: 70,
        completed: true,
      };

      state = recordOutcome(state, 'task-1', execution);

      expect(state.metrics.sampleCount).toBe(1);
      expect(state.metrics.durationBias).toBe(10); // 70 - 60
    });
  });

  describe('computePredictionError', () => {
    it('computes duration error', () => {
      const prediction: PredictionRecord = {
        id: 'pred-1',
        taskId: 'task-1',
        predictedAt: new Date().toISOString(),
        predictedDuration: 60,
        predictedQuality: 4,
        predictedCompletion: 0.8,
        confidence: 0.75,
        humanStateAtPrediction: mockHumanState,
        modelVersion: '1.0.0',
      };

      const outcome: PredictionOutcome = {
        predictionId: 'pred-1',
        recordedAt: new Date().toISOString(),
        actualDuration: 75,
        actualQuality: 4,
        completed: true,
      };

      const error = computePredictionError(prediction, outcome);

      expect(error.durationError).toBe(15); // 75 - 60
      expect(error.durationErrorPct).toBeCloseTo(0.25); // 15/60
      expect(error.qualityError).toBe(0);
      expect(error.completionError).toBe(0);
      expect(error.accurate).toBe(false); // 25% > 20% threshold
    });

    it('marks accurate when within threshold', () => {
      const prediction: PredictionRecord = {
        id: 'pred-1',
        taskId: 'task-1',
        predictedAt: new Date().toISOString(),
        predictedDuration: 60,
        predictedQuality: 4,
        predictedCompletion: 0.8,
        confidence: 0.75,
        humanStateAtPrediction: mockHumanState,
        modelVersion: '1.0.0',
      };

      const outcome: PredictionOutcome = {
        predictionId: 'pred-1',
        recordedAt: new Date().toISOString(),
        actualDuration: 65,
        completed: true,
      };

      const error = computePredictionError(prediction, outcome);

      expect(error.durationErrorPct).toBeCloseTo(0.083); // ~8%
      expect(error.accurate).toBe(true);
    });

    it('detects completion mismatch', () => {
      const prediction: PredictionRecord = {
        id: 'pred-1',
        taskId: 'task-1',
        predictedAt: new Date().toISOString(),
        predictedDuration: 60,
        predictedQuality: 4,
        predictedCompletion: 0.8, // Predicted to complete
        confidence: 0.75,
        humanStateAtPrediction: mockHumanState,
        modelVersion: '1.0.0',
      };

      const outcome: PredictionOutcome = {
        predictionId: 'pred-1',
        recordedAt: new Date().toISOString(),
        actualDuration: 60,
        completed: false, // Did not complete
      };

      const error = computePredictionError(prediction, outcome);

      expect(error.completionError).toBe(1);
      expect(error.accurate).toBe(false);
    });
  });

  describe('computeMetrics', () => {
    it('computes metrics from pairs', () => {
      const pairs = [
        createPair(60, 70, true), // +10 error
        createPair(30, 25, true), // -5 error
        createPair(45, 50, true), // +5 error
      ];

      const metrics = computeMetrics(pairs);

      expect(metrics.sampleCount).toBe(3);
      expect(metrics.durationMAE).toBeCloseTo(6.67, 1); // (10+5+5)/3
      expect(metrics.durationBias).toBeCloseTo(3.33, 1); // (10-5+5)/3
    });

    it('returns empty metrics for no data', () => {
      const metrics = computeMetrics([]);

      expect(metrics.sampleCount).toBe(0);
      expect(metrics.overallAccuracy).toBe(0);
    });

    it('computes trend when enough samples', () => {
      // Create 25 pairs: first 15 inaccurate, last 10 accurate
      const pairs = [
        ...Array(15)
          .fill(null)
          .map(() => createPair(60, 100, true)), // 67% error - inaccurate
        ...Array(10)
          .fill(null)
          .map(() => createPair(60, 65, true)), // 8% error - accurate
      ];

      const metrics = computeMetrics(pairs);

      expect(metrics.trend).toBe('improving');
    });
  });

  describe('computeAdjustments', () => {
    it('suggests bias correction when underestimating', () => {
      // Create pairs where actual > predicted consistently
      const pairs = Array(25)
        .fill(null)
        .map(() => createPair(60, 80, true)); // +20 error each

      const metrics = computeMetrics(pairs);
      const adjustments = computeAdjustments(pairs, metrics);

      const biasAdj = adjustments.find((a) => a.type === 'bias_correction');
      expect(biasAdj).toBeDefined();
      expect(biasAdj!.factor).toBeGreaterThan(1);
      expect(biasAdj!.reason).toContain('Underestimating');
    });

    it('suggests bias correction when overestimating', () => {
      const pairs = Array(25)
        .fill(null)
        .map(() => createPair(80, 60, true)); // -20 error each

      const metrics = computeMetrics(pairs);
      const adjustments = computeAdjustments(pairs, metrics);

      const biasAdj = adjustments.find((a) => a.type === 'bias_correction');
      expect(biasAdj).toBeDefined();
      expect(biasAdj!.factor).toBeLessThan(1);
    });

    it('returns empty when not enough samples', () => {
      const pairs = [createPair(60, 100, true)];
      const metrics = computeMetrics(pairs);
      const adjustments = computeAdjustments(pairs, metrics);

      expect(adjustments).toHaveLength(0);
    });
  });

  describe('applyAdjustments', () => {
    it('applies bias correction to duration', () => {
      const prediction: TaskPrediction = {
        taskId: 'task-1',
        predictedDuration: 60,
        durationConfidence: 0.8,
        durationFactors: {},
        predictedQuality: 4,
        qualityConfidence: 0.7,
        qualityFactors: {},
        completionProbability: 0.8,
        risks: [],
        overallConfidence: 0.75,
      };

      const adjustments = [
        {
          type: 'bias_correction' as const,
          target: 'duration',
          factor: 1.1,
          reason: 'Underestimating',
          sampleCount: 20,
        },
      ];

      const adjusted = applyAdjustments(prediction, adjustments);

      expect(adjusted.predictedDuration).toBe(66); // 60 * 1.1
    });

    it('applies confidence scaling', () => {
      const prediction: TaskPrediction = {
        taskId: 'task-1',
        predictedDuration: 60,
        durationConfidence: 0.8,
        durationFactors: {},
        predictedQuality: 4,
        qualityConfidence: 0.7,
        qualityFactors: {},
        completionProbability: 0.8,
        risks: [],
        overallConfidence: 0.75,
      };

      const adjustments = [
        {
          type: 'confidence_scaling' as const,
          target: 'confidence',
          factor: 0.85,
          reason: 'Low calibration',
          sampleCount: 30,
        },
      ];

      const adjusted = applyAdjustments(prediction, adjustments);

      expect(adjusted.overallConfidence).toBeCloseTo(0.6375); // 0.75 * 0.85
    });
  });

  describe('formatFeedbackSummary', () => {
    it('formats summary string', () => {
      let state = createFeedbackLoopState();

      // Add some data
      state = recordPrediction(state, 'task-1', mockPrediction, mockHumanState);
      state = recordOutcome(state, 'task-1', {
        taskId: 'task-1',
        recordedAt: new Date().toISOString(),
        plannedEffort: 5,
        plannedDuration: 60,
        plannedPriority: 7,
        actualDuration: 65,
        completed: true,
      });

      const summary = formatFeedbackSummary(state);

      expect(summary).toContain('Prediction Feedback Loop');
      expect(summary).toContain('Model Version');
      expect(summary).toContain('Accuracy Metrics');
      expect(summary).toContain('Duration MAE');
    });
  });

  describe('exportFeedbackData', () => {
    it('exports data for persistence', () => {
      let state = createFeedbackLoopState('2.0.0');
      state = recordPrediction(state, 'task-1', mockPrediction, mockHumanState);

      const exported = exportFeedbackData(state);

      expect(exported.version).toBe('1');
      expect(exported.modelVersion).toBe('2.0.0');
      expect(exported.pendingCount).toBe(1);
      expect(exported.completedCount).toBe(0);
    });
  });

  // Helper to create test pairs
  function createPair(
    predicted: number,
    actual: number,
    completed: boolean
  ): {
    prediction: PredictionRecord;
    outcome: PredictionOutcome;
    error: ReturnType<typeof computePredictionError>;
  } {
    const prediction: PredictionRecord = {
      id: `pred-${Math.random()}`,
      taskId: `task-${Math.random()}`,
      predictedAt: new Date().toISOString(),
      predictedDuration: predicted,
      predictedQuality: 4,
      predictedCompletion: completed ? 0.8 : 0.3,
      confidence: 0.75,
      humanStateAtPrediction: mockHumanState,
      modelVersion: '1.0.0',
    };

    const outcome: PredictionOutcome = {
      predictionId: prediction.id,
      recordedAt: new Date().toISOString(),
      actualDuration: actual,
      actualQuality: 4,
      completed,
    };

    return {
      prediction,
      outcome,
      error: computePredictionError(prediction, outcome),
    };
  }
});
