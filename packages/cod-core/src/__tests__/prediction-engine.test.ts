/**
 * Prediction Engine Integration Tests
 *
 * Tests for the ML-integrated prediction pipeline:
 * - Engine initialization and state management
 * - ML predictions vs heuristics
 * - Incremental learning
 * - End-to-end prediction flow
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  initializePredictionEngine,
  generateMLPrediction,
  updatePredictionEngine,
  getPredictionEngineDiagnostics,
  type PredictionEngineState,
} from '../prediction-engine.js';
import {
  predictTask,
  predictTaskML,
  mlToTaskPrediction,
} from '../predictions.js';
import type { TaskExecutionRecord } from '../prediction-history.js';
import type { HumanStateSnapshot } from '../human-state-series.js';
import type { SessionFeatures, SessionOutcome } from '../session-classifier.js';

// ============================================================================
// Test Data Generators
// ============================================================================

function generateTaskHistory(count: number): TaskExecutionRecord[] {
  const records: TaskExecutionRecord[] = [];
  const baseDate = new Date('2025-01-01');

  for (let i = 0; i < count; i++) {
    const planned = 30 + Math.random() * 60; // 30-90 min
    const actualVariance = 0.8 + Math.random() * 0.4; // 0.8-1.2
    records.push({
      taskId: `task-${i}`,
      recordedAt: new Date(
        baseDate.getTime() + i * 24 * 60 * 60 * 1000
      ).toISOString(),
      plannedDuration: planned,
      actualDuration: planned * actualVariance,
      plannedEffort: Math.ceil(planned / 30),
      actualEffort: Math.ceil((planned * actualVariance) / 30),
      plannedPriority: 5,
      completed: Math.random() > 0.2, // 80% completion rate
      qualityRating: 3 + Math.random() * 2, // 3-5
      startHumanState: {
        energy: 0.4 + Math.random() * 0.4,
        focus: 0.4 + Math.random() * 0.4,
        stress: 0.2 + Math.random() * 0.4,
      },
    });
  }
  return records;
}

function generateHumanStateHistory(count: number): HumanStateSnapshot[] {
  const snapshots: HumanStateSnapshot[] = [];
  const baseDate = new Date('2025-01-01');

  // Generate snapshots that cover all HumanStateCategory values:
  // peak: energy > 0.7, stress < 0.3, focus > 0.7
  // productive: energy > 0.5, stress < 0.5, focus > 0.5
  // stressed: stress > 0.6
  // recovery: energy < 0.4, stress < 0.4
  // fatigued: everything else
  const statePatterns = [
    { energy: 0.85, stress: 0.15, focus: 0.85 }, // peak
    { energy: 0.65, stress: 0.35, focus: 0.65 }, // productive
    { energy: 0.5, stress: 0.75, focus: 0.4 }, // stressed
    { energy: 0.25, stress: 0.25, focus: 0.45 }, // recovery
    { energy: 0.45, stress: 0.5, focus: 0.4 }, // fatigued
  ];

  for (let i = 0; i < count; i++) {
    // Cycle through state patterns with slight variation
    const pattern = statePatterns[i % statePatterns.length];
    const variation = (Math.random() - 0.5) * 0.1;

    snapshots.push({
      timestamp: new Date(
        baseDate.getTime() + i * 60 * 60 * 1000
      ).toISOString(),
      energy: Math.max(0.1, Math.min(1, pattern.energy + variation)),
      focus: Math.max(0.1, Math.min(1, pattern.focus + variation)),
      stress: Math.max(0, Math.min(1, pattern.stress + variation)),
      source: 'manual-checkin',
    });
  }
  return snapshots;
}

function generateSessionHistory(
  count: number
): Array<{ features: SessionFeatures; outcome: SessionOutcome }> {
  const sessions = [];
  for (let i = 0; i < count; i++) {
    const duration = 60 + Math.random() * 120;
    const tasksPlanned = Math.floor(3 + Math.random() * 3);
    const tasksCompleted = Math.floor(2 + Math.random() * 4);
    const completed = Math.random() > 0.3;
    sessions.push({
      features: {
        startEnergy: 0.5 + Math.random() * 0.3,
        startStress: 0.2 + Math.random() * 0.3,
        startFocus: 0.5 + Math.random() * 0.3,
        plannedDuration: duration,
        taskCount: tasksPlanned,
        totalEffort: duration / 60,
        avgTaskComplexity: 3,
        highPriorityCount: 1,
        hourOfDay: 8 + Math.floor(Math.random() * 10),
        dayOfWeek: Math.floor(Math.random() * 7),
        consecutiveSessions: 1,
        recentCompletionRate: 0.7 + Math.random() * 0.2,
      },
      outcome: {
        completed,
        completionRate: tasksCompleted / Math.max(1, tasksPlanned),
        qualityScore: 7 + Math.random() * 2,
        endedEarly: !completed,
        extendedBeyondPlan: false,
      },
    });
  }
  return sessions;
}

// ============================================================================
// Prediction Engine Initialization Tests
// ============================================================================

describe('Prediction Engine Initialization', () => {
  it('should initialize with insufficient data (no models trained)', () => {
    const state = initializePredictionEngine([], [], []);

    expect(state.durationModel).toBeUndefined();
    expect(state.humanStateChain).toBeUndefined();
    expect(state.taskStatusChain).toBeUndefined();
    expect(state.sampleCounts.duration).toBe(0);
  });

  it('should train duration model with sufficient task history', () => {
    const taskHistory = generateTaskHistory(10);
    const state = initializePredictionEngine(taskHistory, [], []);

    expect(state.durationModel).toBeDefined();
    expect(state.sampleCounts.duration).toBe(10);
  });

  it('should build Markov chains with sufficient human state history', () => {
    const humanStateHistory = generateHumanStateHistory(10);
    const state = initializePredictionEngine([], humanStateHistory, []);

    expect(state.humanStateChain).toBeDefined();
    expect(state.sampleCounts.humanState).toBe(10);
  });

  it('should initialize all models with complete data', () => {
    const taskHistory = generateTaskHistory(15);
    const humanStateHistory = generateHumanStateHistory(15);
    const sessionHistory = generateSessionHistory(15);

    const state = initializePredictionEngine(
      taskHistory,
      humanStateHistory,
      sessionHistory
    );

    expect(state.durationModel).toBeDefined();
    expect(state.humanStateChain).toBeDefined();
    expect(state.taskStatusChain).toBeDefined();
    expect(state.lastTraining).toBeInstanceOf(Date);
  });
});

// ============================================================================
// ML Prediction Generation Tests
// ============================================================================

describe('ML Prediction Generation', () => {
  let engineState: PredictionEngineState;
  let taskHistory: TaskExecutionRecord[];
  let humanStateHistory: HumanStateSnapshot[];

  beforeEach(() => {
    taskHistory = generateTaskHistory(20);
    humanStateHistory = generateHumanStateHistory(20);
    const sessionHistory = generateSessionHistory(20);
    engineState = initializePredictionEngine(
      taskHistory,
      humanStateHistory,
      sessionHistory
    );
  });

  it('should generate prediction with all ML components', () => {
    const prediction = generateMLPrediction(
      {
        taskId: 'test-task',
        taskType: 'coding',
        plannedDuration: 60,
        plannedEffort: 2,
        currentHumanState: {
          timestamp: new Date().toISOString(),
          energy: 0.7,
          focus: 0.8,
          stress: 0.3,
          source: 'manual-checkin',
        },
        taskHistory,
      },
      engineState
    );

    expect(prediction.taskId).toBe('test-task');
    expect(prediction.duration.predicted).toBeGreaterThan(0);
    expect(prediction.duration.method).toMatch(/ml|blended/);
    expect(prediction.quality.predicted).toBeGreaterThanOrEqual(1);
    expect(prediction.quality.predicted).toBeLessThanOrEqual(5);
    expect(prediction.completion.probability).toBeGreaterThanOrEqual(0);
    expect(prediction.completion.probability).toBeLessThanOrEqual(1);
    expect(prediction.overallConfidence).toBeGreaterThan(0);
  });

  it('should fall back to heuristics with insufficient data', () => {
    const emptyState = initializePredictionEngine([], [], []);

    const prediction = generateMLPrediction(
      {
        taskId: 'test-task',
        taskType: 'coding',
        plannedDuration: 60,
        plannedEffort: 2,
        currentHumanState: {
          timestamp: new Date().toISOString(),
          energy: 0.5,
          focus: 0.5,
          stress: 0.5,
          source: 'manual-checkin',
        },
      },
      emptyState
    );

    expect(prediction.duration.method).toBe('heuristic');
    expect(prediction.duration.confidence).toBe(0.5);
    expect(prediction.modelInfo.durationMethod).toBe('heuristic');
  });

  it('should detect heuristic risks', () => {
    // Create low energy, high stress state that triggers risk detection:
    // low-energy: energy < 0.3
    // high-stress: stress > 0.8
    const lowEnergyState: HumanStateSnapshot = {
      timestamp: new Date().toISOString(),
      energy: 0.2, // < 0.3 triggers low-energy risk
      focus: 0.4,
      stress: 0.85, // > 0.8 triggers high-stress risk
      source: 'manual-checkin',
    };

    // Initialize engine with empty state to use heuristics (avoids Markov issues)
    const emptyEngine = initializePredictionEngine([], [], []);

    const prediction = generateMLPrediction(
      {
        taskId: 'test-task',
        taskType: 'coding',
        plannedDuration: 60,
        plannedEffort: 2,
        currentHumanState: lowEnergyState,
      },
      emptyEngine
    );

    // Should have risks detected
    expect(prediction.risks.length).toBeGreaterThan(0);
    expect(prediction.risks.some((r) => r.type === 'low-energy')).toBe(true);
    expect(prediction.risks.some((r) => r.type === 'high-stress')).toBe(true);
  });
});

// ============================================================================
// Prediction API Tests
// ============================================================================

describe('Prediction API', () => {
  const currentState: HumanStateSnapshot = {
    timestamp: new Date().toISOString(),
    energy: 0.7,
    focus: 0.8,
    stress: 0.3,
    source: 'manual-checkin',
  };

  it('should generate basic prediction with predictTask', () => {
    const prediction = predictTask({
      taskId: 'test-task',
      taskType: 'coding',
      plannedDuration: 60,
      plannedEffort: 2,
      currentHumanState: currentState,
    });

    expect(prediction.taskId).toBe('test-task');
    expect(prediction.predictedDuration).toBeGreaterThan(0);
    expect(prediction.predictedQuality).toBeGreaterThanOrEqual(1);
    expect(prediction.predictedQuality).toBeLessThanOrEqual(5);
    expect(prediction.overallConfidence).toBeGreaterThan(0);
  });

  it('should generate ML prediction with predictTaskML', () => {
    const taskHistory = generateTaskHistory(10);
    const humanStateHistory = generateHumanStateHistory(10);
    const sessionHistory = [
      {
        duration: 120,
        tasksCompleted: 3,
        tasksPlanned: 4,
        avgEnergy: 0.7,
        avgFocus: 0.8,
        avgStress: 0.3,
        timeOfDay: 10,
        dayOfWeek: 1,
        completed: true,
      },
    ];

    const prediction = predictTaskML({
      taskId: 'test-task',
      taskType: 'coding',
      plannedDuration: 60,
      plannedEffort: 2,
      currentHumanState: currentState,
      taskHistory,
      humanStateHistory,
      sessionHistory,
    });

    expect(prediction.taskId).toBe('test-task');
    expect(prediction.duration.predicted).toBeGreaterThan(0);
    expect(prediction.modelInfo).toBeDefined();
  });

  it('should convert ML prediction to TaskPrediction format', () => {
    const taskHistory = generateTaskHistory(10);
    const humanStateHistory = generateHumanStateHistory(10);

    const mlPrediction = predictTaskML({
      taskId: 'test-task',
      taskType: 'coding',
      plannedDuration: 60,
      plannedEffort: 2,
      currentHumanState: currentState,
      taskHistory,
      humanStateHistory,
    });

    const taskPrediction = mlToTaskPrediction(mlPrediction);

    expect(taskPrediction.taskId).toBe('test-task');
    expect(taskPrediction.predictedDuration).toBe(
      mlPrediction.duration.predicted
    );
    expect(taskPrediction.durationConfidence).toBe(
      mlPrediction.duration.confidence
    );
    expect(taskPrediction.predictedQuality).toBe(
      mlPrediction.quality.predicted
    );
    expect(taskPrediction.completionProbability).toBe(
      mlPrediction.completion.probability
    );
    expect(taskPrediction.risks).toHaveLength(mlPrediction.risks.length);
  });
});

// ============================================================================
// Engine Update Tests
// ============================================================================

describe('Prediction Engine Updates', () => {
  it('should increment sample counts on update', () => {
    const initialState = initializePredictionEngine([], [], []);

    const newTask: TaskExecutionRecord = {
      taskId: 'new-task',
      recordedAt: new Date().toISOString(),
      plannedDuration: 60,
      actualDuration: 55,
      plannedEffort: 2,
      actualEffort: 2,
      plannedPriority: 5,
      completed: true,
      qualityRating: 4,
    };

    const updated = updatePredictionEngine(initialState, newTask);

    expect(updated.sampleCounts.duration).toBe(1);
    expect(updated.sampleCounts.taskStatus).toBe(1);
  });
});

// ============================================================================
// Diagnostics Tests
// ============================================================================

describe('Prediction Engine Diagnostics', () => {
  it('should report insufficient-data status with no data', () => {
    const state = initializePredictionEngine([], [], []);
    const diagnostics = getPredictionEngineDiagnostics(state);

    expect(diagnostics.status).toBe('insufficient-data');
    expect(diagnostics.models.duration.trained).toBe(false);
    expect(diagnostics.recommendations.length).toBeGreaterThan(0);
  });

  it('should report warming-up status with partial data', () => {
    const taskHistory = generateTaskHistory(10);
    const state = initializePredictionEngine(taskHistory, [], []);
    const diagnostics = getPredictionEngineDiagnostics(state);

    expect(diagnostics.status).toBe('warming-up');
    expect(diagnostics.models.duration.trained).toBe(true);
    expect(diagnostics.models.session.trained).toBe(false);
  });

  it('should report ready status with complete data', () => {
    const taskHistory = generateTaskHistory(20);
    const humanStateHistory = generateHumanStateHistory(20);
    const sessionHistory = generateSessionHistory(20);
    const state = initializePredictionEngine(
      taskHistory,
      humanStateHistory,
      sessionHistory
    );
    const diagnostics = getPredictionEngineDiagnostics(state);

    expect(diagnostics.status).toBe('ready');
    expect(diagnostics.models.duration.trained).toBe(true);
    expect(diagnostics.models.humanStateMarkov.trained).toBe(true);
    expect(diagnostics.models.taskStatusMarkov.trained).toBe(true);
  });

  it('should provide actionable recommendations', () => {
    const taskHistory = generateTaskHistory(3); // Not enough
    const state = initializePredictionEngine(taskHistory, [], []);
    const diagnostics = getPredictionEngineDiagnostics(state);

    expect(
      diagnostics.recommendations.some((r) => r.includes('task completions'))
    ).toBe(true);
    expect(
      diagnostics.recommendations.some((r) => r.includes('sessions'))
    ).toBe(true);
    expect(
      diagnostics.recommendations.some((r) => r.includes('state recordings'))
    ).toBe(true);
  });
});

// ============================================================================
// End-to-End Integration Tests
// ============================================================================

describe('End-to-End Prediction Flow', () => {
  it('should predict task with full ML pipeline', () => {
    // Simulate a user with history
    const taskHistory = generateTaskHistory(30);
    const humanStateHistory = generateHumanStateHistory(48); // 2 days of hourly
    const sessionHistory = generateSessionHistory(15);

    // Initialize engine
    const engineState = initializePredictionEngine(
      taskHistory,
      humanStateHistory,
      sessionHistory
    );

    // Check diagnostics
    const diagnostics = getPredictionEngineDiagnostics(engineState);
    expect(diagnostics.status).toBe('ready');

    // Current state (typical mid-day)
    const currentState: HumanStateSnapshot = {
      timestamp: new Date().toISOString(),
      energy: 0.75,
      focus: 0.8,
      stress: 0.25,
      source: 'manual-checkin',
    };

    // Generate ML prediction
    const mlPrediction = generateMLPrediction(
      {
        taskId: 'important-task',
        taskType: 'coding',
        plannedDuration: 90,
        plannedEffort: 3,
        currentHumanState: currentState,
        taskHistory,
        sessionPosition: 1,
        sessionDurationSoFar: 60,
        sessionTasksCompleted: 1,
      },
      engineState
    );

    // Verify comprehensive prediction
    expect(mlPrediction.duration.predicted).toBeGreaterThan(0);
    expect(mlPrediction.quality.predicted).toBeGreaterThanOrEqual(1);
    expect(mlPrediction.completion.probability).toBeGreaterThan(0);
    expect(mlPrediction.markov).toBeDefined();
    expect(mlPrediction.overallConfidence).toBeGreaterThan(0.3);

    // Convert to standard format
    const taskPrediction = mlToTaskPrediction(mlPrediction);
    expect(taskPrediction.predictedDuration).toBe(
      mlPrediction.duration.predicted
    );
  });

  it('should handle graceful degradation', () => {
    // Minimal data - should fall back to heuristics
    const taskHistory = generateTaskHistory(2);
    const humanStateHistory = generateHumanStateHistory(2);

    const prediction = predictTaskML({
      taskId: 'test-task',
      taskType: 'writing',
      plannedDuration: 45,
      plannedEffort: 2,
      currentHumanState: {
        timestamp: new Date().toISOString(),
        energy: 0.5,
        focus: 0.5,
        stress: 0.5,
        source: 'manual-checkin',
      },
      taskHistory,
      humanStateHistory,
    });

    // Should still produce valid prediction
    expect(prediction.duration.predicted).toBeGreaterThan(0);
    expect(prediction.duration.method).toBe('heuristic');
    expect(prediction.modelInfo.durationMethod).toBe('heuristic');
    expect(prediction.quality.predicted).toBeGreaterThanOrEqual(1);
    expect(prediction.overallConfidence).toBeGreaterThan(0);
  });
});
