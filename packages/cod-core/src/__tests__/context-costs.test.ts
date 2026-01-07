import { describe, it, expect } from 'vitest';
import {
  recordContextSwitch,
  analyzeContextCosts,
  estimateSwitchCost,
} from '../context-costs';

describe('Context Switching Costs', () => {
  it('records context switch event', () => {
    const event = recordContextSwitch({
      timestamp: new Date().toISOString(),
      fromTask: { taskId: 'task-1', type: 'coding', duration: 30 },
      toTask: { taskId: 'task-2', type: 'email', expectedDuration: 20 },
      focusRecoveryTime: 12,
      reason: 'interrupt',
    });

    expect(event.fromTask.type).toBe('coding');
    expect(event.toTask.type).toBe('email');
    expect(event.focusRecoveryTime).toBe(12);
  });

  it('analyzes context costs across multiple switches', () => {
    const switches = [
      {
        timestamp: new Date().toISOString(),
        fromTask: { taskId: 'task-1', type: 'coding', duration: 30 },
        toTask: { taskId: 'task-2', type: 'email', expectedDuration: 20 },
        focusRecoveryTime: 10,
        reason: 'interrupt' as const,
      },
      {
        timestamp: new Date().toISOString(),
        fromTask: { taskId: 'task-2', type: 'email', duration: 20 },
        toTask: { taskId: 'task-3', type: 'coding', expectedDuration: 45 },
        focusRecoveryTime: 15,
        reason: 'priority-change' as const,
      },
      {
        timestamp: new Date().toISOString(),
        fromTask: { taskId: 'task-3', type: 'coding', duration: 45 },
        toTask: { taskId: 'task-4', type: 'email', expectedDuration: 25 },
        focusRecoveryTime: 8,
        reason: 'interrupt' as const,
      },
    ];

    const metrics = analyzeContextCosts(switches);

    expect(metrics.avgRecoveryTime).toBeCloseTo(11, 0);
    expect(metrics.weeklyProductivityLoss).toBeGreaterThan(0);
    expect(metrics.mostExpensiveSwitches.length).toBeGreaterThan(0);
    expect(metrics.recommendation).toBeDefined();
  });

  it('breaks down costs by source task type', () => {
    const switches = [
      {
        timestamp: new Date().toISOString(),
        fromTask: { taskId: 'task-1', type: 'coding', duration: 30 },
        toTask: { taskId: 'task-2', type: 'email', expectedDuration: 20 },
        focusRecoveryTime: 20, // Expensive
        reason: 'interrupt' as const,
      },
      {
        timestamp: new Date().toISOString(),
        fromTask: { taskId: 'task-3', type: 'admin', duration: 15 },
        toTask: { taskId: 'task-4', type: 'meeting', expectedDuration: 30 },
        focusRecoveryTime: 3, // Cheap
        reason: 'voluntary' as const,
      },
    ];

    const metrics = analyzeContextCosts(switches);

    expect(metrics.costsBySourceType['coding'].avgRecoveryTime).toBe(20);
    expect(metrics.costsBySourceType['admin'].avgRecoveryTime).toBe(3);
  });

  it('identifies most and least expensive switch combinations', () => {
    const switches = [
      {
        timestamp: new Date().toISOString(),
        fromTask: { taskId: 'task-1', type: 'deep-work', duration: 60 },
        toTask: {
          taskId: 'task-2',
          type: 'interruption',
          expectedDuration: 10,
        },
        focusRecoveryTime: 25,
        reason: 'interrupt' as const,
      },
      {
        timestamp: new Date().toISOString(),
        fromTask: { taskId: 'task-3', type: 'admin', duration: 10 },
        toTask: { taskId: 'task-4', type: 'admin', expectedDuration: 15 },
        focusRecoveryTime: 2,
        reason: 'voluntary' as const,
      },
    ];

    const metrics = analyzeContextCosts(switches);

    expect(metrics.mostExpensiveSwitches[0].from).toBe('deep-work');
    expect(metrics.cheapestSwitches[0].from).toBe('admin');
  });

  it('estimates switch cost for potential switches', () => {
    const metrics = {
      avgRecoveryTime: 12,
      costsBySourceType: { coding: { avgRecoveryTime: 20, frequency: 5 } },
      costsByDestType: { email: { avgRecoveryTime: 8, frequency: 3 } },
      mostExpensiveSwitches: [
        {
          from: 'coding',
          to: 'email',
          avgRecoveryTime: 18,
          frequency: 3,
        },
      ],
      cheapestSwitches: [],
      weeklyProductivityLoss: 4,
    };

    // Exact match found
    const cost1 = estimateSwitchCost(metrics, 'coding', 'email');
    expect(cost1).toBe(18);

    // No exact match - should average source and dest
    const cost2 = estimateSwitchCost(metrics, 'coding', 'meeting');
    expect(cost2).toBeGreaterThan(0);
  });
});
