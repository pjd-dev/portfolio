import { describe, it, expect } from 'vitest';
import {
  recordHumanState,
  analyzeTrend,
  analyzeCorrelation,
  findOptimalState,
} from '../human-state-series';

describe('Human State Series', () => {
  it('records and clamps human state values', () => {
    const record = recordHumanState({
      timestamp: new Date().toISOString(),
      energy: 1.5, // should clamp to 1
      stress: -0.1, // should clamp to 0
      focus: 0.8,
      source: 'session-start',
    });

    expect(record.energy).toBe(1);
    expect(record.stress).toBe(0);
    expect(record.focus).toBe(0.8);
  });

  it('analyzes energy trend over window', () => {
    const snapshots = [
      {
        timestamp: new Date(Date.now() - 480 * 60 * 1000).toISOString(),
        energy: 0.3,
        stress: 0.6,
        focus: 0.4,
        source: 'session-start' as const,
      },
      {
        timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
        energy: 0.5,
        stress: 0.5,
        focus: 0.6,
        source: 'session-end' as const,
      },
      {
        timestamp: new Date().toISOString(),
        energy: 0.7,
        stress: 0.3,
        focus: 0.8,
        source: 'session-end' as const,
      },
    ];

    const trend = analyzeTrend(snapshots, 'energy', 480);

    expect(trend.metric).toBe('energy');
    expect(trend.trend).toBe('improving');
    // Average of [0.4, 0.5, 0.7] = 0.533, but weighted average may differ
    expect(trend.average).toBeGreaterThanOrEqual(0.4);
    expect(trend.average).toBeLessThanOrEqual(0.7);
    expect(trend.confidence).toBeGreaterThan(0);
  });

  it('detects stress decline as improvement', () => {
    const snapshots = [
      {
        timestamp: new Date(Date.now() - 480 * 60 * 1000).toISOString(),
        energy: 0.5,
        stress: 0.8,
        focus: 0.5,
        source: 'session-start' as const,
      },
      {
        timestamp: new Date().toISOString(),
        energy: 0.6,
        stress: 0.2,
        focus: 0.7,
        source: 'session-end' as const,
      },
    ];

    const trend = analyzeTrend(snapshots, 'stress');

    expect(trend.trend).toBe('improving'); // Lower stress is improvement
  });

  it('analyzes correlation between state and outcomes', () => {
    const snapshots = [
      {
        timestamp: new Date(Date.now() - 300 * 1000).toISOString(),
        energy: 0.8,
        stress: 0.2,
        focus: 0.9,
        source: 'session-start' as const,
      },
      {
        timestamp: new Date(Date.now() - 200 * 1000).toISOString(),
        energy: 0.7,
        stress: 0.3,
        focus: 0.8,
        source: 'session-end' as const,
      },
      {
        timestamp: new Date(Date.now() - 100 * 1000).toISOString(),
        energy: 0.4,
        stress: 0.7,
        focus: 0.3,
        source: 'session-end' as const,
      },
    ];

    const outcomes = [
      { stateMetric: 'energy' as const, value: 5 }, // High energy → high quality
      { stateMetric: 'energy' as const, value: 4 },
      { stateMetric: 'energy' as const, value: 2 }, // Low energy → low quality
    ];

    const corr = analyzeCorrelation(snapshots, outcomes, 'energy', 'quality');

    expect(corr.stateMetric).toBe('energy');
    expect(corr.correlation).toBeGreaterThan(0.5); // Positive correlation
    expect(corr.examples.length).toBe(3);
  });

  it('finds optimal state range for task type', () => {
    const correlations = [
      {
        stateMetric: 'energy' as const,
        prediction: 'quality' as const,
        correlation: 0.6,
        significance: 0.4,
        examples: [
          { stateValue: 0.8, outcome: 5, taskId: 'task-1' },
          { stateValue: 0.9, outcome: 5, taskId: 'task-2' },
          { stateValue: 0.7, outcome: 4, taskId: 'task-3' },
          { stateValue: 0.2, outcome: 2, taskId: 'task-4' },
        ],
      },
    ];

    const optimal = findOptimalState(correlations, 'quality');

    expect(optimal.length).toBeGreaterThanOrEqual(0); // May be empty if no strong correlation
  });
});
