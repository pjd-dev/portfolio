import { describe, it, expect } from 'vitest';
import { predictTask } from '../predictions';
import type { HumanStateSnapshot } from '../human-state-series';

describe('Prediction Engine', () => {
  const mockHumanState: HumanStateSnapshot = {
    timestamp: new Date().toISOString(),
    energy: 0.8,
    stress: 0.3,
    focus: 0.85,
    source: 'session-start',
  };

  it('predicts task duration based on human state', () => {
    const prediction = predictTask({
      taskId: 'task-1',
      taskType: 'code-review',
      plannedDuration: 60,
      plannedEffort: 5,
      currentHumanState: mockHumanState,
    });

    expect(prediction.taskId).toBe('task-1');
    expect(prediction.predictedDuration).toBeGreaterThan(0);
    expect(prediction.durationConfidence).toBeGreaterThan(0);
  });

  it('increases duration prediction when energy is low', () => {
    const lowEnergyState = {
      ...mockHumanState,
      energy: 0.2,
    };

    const prediction = predictTask({
      taskId: 'task-1',
      taskType: 'coding',
      plannedDuration: 60,
      plannedEffort: 5,
      currentHumanState: lowEnergyState,
    });

    expect(prediction.predictedDuration).toBeGreaterThan(60);
    expect(prediction.durationConfidence).toBeLessThan(0.7);
  });

  it('predicts quality based on human state', () => {
    const prediction = predictTask({
      taskId: 'task-1',
      taskType: 'code-review',
      plannedDuration: 60,
      plannedEffort: 5,
      currentHumanState: mockHumanState,
    });

    expect(prediction.predictedQuality).toBeGreaterThanOrEqual(1);
    expect(prediction.predictedQuality).toBeLessThanOrEqual(5);
    expect(prediction.qualityFactors.humanEnergy).toBe(0.8);
  });

  it('reduces quality prediction when stressed', () => {
    const stressedState = {
      ...mockHumanState,
      stress: 0.8,
      energy: 0.3,
    };

    const prediction = predictTask({
      taskId: 'task-1',
      taskType: 'coding',
      plannedDuration: 60,
      plannedEffort: 5,
      currentHumanState: stressedState,
    });

    expect(prediction.predictedQuality).toBeLessThan(3.5);
  });

  it('detects energy crash risk', () => {
    const tiredState = {
      ...mockHumanState,
      energy: 0.2,
    };

    const prediction = predictTask({
      taskId: 'task-1',
      taskType: 'coding',
      plannedDuration: 60,
      plannedEffort: 5,
      currentHumanState: tiredState,
      sessionPosition: 0,
    });

    const energyRisk = prediction.risks.find(
      (r) => r.riskType === 'energy-crash'
    );
    expect(energyRisk).toBeDefined();
    expect(energyRisk?.probability).toBeGreaterThan(0.5);
  });

  it('detects focus loss risk under stress', () => {
    const stressedState = {
      ...mockHumanState,
      stress: 0.8,
    };

    const prediction = predictTask({
      taskId: 'task-1',
      taskType: 'coding',
      plannedDuration: 60,
      plannedEffort: 5,
      currentHumanState: stressedState,
    });

    const focusRisk = prediction.risks.find((r) => r.riskType === 'focus-loss');
    expect(focusRisk).toBeDefined();
  });

  it('includes context switch recovery time', () => {
    const contextCosts = {
      avgRecoveryTime: 15,
      costsBySourceType: {},
      costsByDestType: {},
      mostExpensiveSwitches: [],
      cheapestSwitches: [],
      weeklyProductivityLoss: 2,
    };

    const prediction = predictTask({
      taskId: 'task-1',
      taskType: 'coding',
      plannedDuration: 60,
      plannedEffort: 5,
      currentHumanState: mockHumanState,
      sessionPosition: 1, // Not first task
      contextCosts,
    });

    expect(prediction.durationFactors.contextSwitch).toBeGreaterThan(0);
  });

  it('generates recommendation for optimal conditions', () => {
    const excellentState: HumanStateSnapshot = {
      timestamp: new Date().toISOString(),
      energy: 0.9,
      stress: 0.1,
      focus: 0.95,
      source: 'session-start',
    };

    const prediction = predictTask({
      taskId: 'task-1',
      taskType: 'important-work',
      plannedDuration: 120,
      plannedEffort: 8,
      currentHumanState: excellentState,
    });

    expect(prediction.recommendation?.toLowerCase()).toContain('optimal');
  });

  it('includes multiple risk factors', () => {
    const poorState: HumanStateSnapshot = {
      timestamp: new Date().toISOString(),
      energy: 0.2,
      stress: 0.85,
      focus: 0.25,
      source: 'session-start',
    };

    const prediction = predictTask({
      taskId: 'task-1',
      taskType: 'coding',
      plannedDuration: 60,
      plannedEffort: 5,
      currentHumanState: poorState,
      sessionPosition: 3,
      contextCosts: {
        avgRecoveryTime: 18,
        costsBySourceType: {},
        costsByDestType: {},
        mostExpensiveSwitches: [],
        cheapestSwitches: [],
        weeklyProductivityLoss: 3,
      },
    });

    expect(prediction.risks.length).toBeGreaterThan(1);
    expect(prediction.overallConfidence).toBeLessThan(0.7);
  });

  it('calculates overall confidence from component confidences', () => {
    const prediction = predictTask({
      taskId: 'task-1',
      taskType: 'coding',
      plannedDuration: 60,
      plannedEffort: 5,
      currentHumanState: mockHumanState,
    });

    expect(prediction.overallConfidence).toBeGreaterThanOrEqual(0);
    expect(prediction.overallConfidence).toBeLessThanOrEqual(1);
  });

  it('completion probability reflects task history', () => {
    const prediction = predictTask({
      taskId: 'task-1',
      taskType: 'coding',
      plannedDuration: 60,
      plannedEffort: 5,
      currentHumanState: mockHumanState,
      taskHistory: [
        {
          taskId: 'task-1',
          recordedAt: new Date().toISOString(),
          plannedEffort: 5,
          plannedDuration: 60,
          plannedPriority: 7,
          completed: true,
        },
        {
          taskId: 'task-1',
          recordedAt: new Date().toISOString(),
          plannedEffort: 5,
          plannedDuration: 60,
          plannedPriority: 7,
          completed: true,
        },
        {
          taskId: 'task-1',
          recordedAt: new Date().toISOString(),
          plannedEffort: 5,
          plannedDuration: 60,
          plannedPriority: 7,
          completed: false,
        },
      ],
    });

    expect(prediction.completionProbability).toBeCloseTo(0.67, 1); // 2 out of 3 completed
  });
});
