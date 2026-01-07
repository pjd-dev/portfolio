import { describe, it, expect } from 'vitest';
import {
  analyzeTaskTypePattern,
  detectWorkHabitPatterns,
} from '../pattern-detection';

describe('Pattern Detection', () => {
  it('analyzes task type pattern', () => {
    const pattern = analyzeTaskTypePattern({
      taskType: 'code-review',
      totalCount: 20,
      completedCount: 18,
      avgDuration: 45,
      executionsByHour: {
        '9': { count: 5, completed: 5 },
        '14': { count: 5, completed: 3 },
        '18': { count: 5, completed: 5 },
        '22': { count: 5, completed: 5 },
      },
      followUpTasks: [
        { type: 'follow-up-email', count: 10 },
        { type: 'fix-feedback', count: 8 },
      ],
      allTasksCount: 100,
    });

    expect(pattern.taskType).toBe('code-review');
    expect(pattern.frequency).toBe(0.2);
    expect(pattern.completionRate).toBeCloseTo(0.9, 1);
    expect(pattern.bestHours).toContain(9);
    expect(pattern.spawnsFollowUps).toBe(true);
    expect(pattern.followUpRate).toBeGreaterThan(0);
  });

  it('detects context switching pattern', () => {
    const patterns = detectWorkHabitPatterns({
      recentExecutions: [
        {
          taskId: 'task-1',
          plannedDuration: 100,
          actualDuration: 40,
          completed: true,
          startedAt: new Date(Date.now() - 300 * 1000).toISOString(),
        },
        {
          taskId: 'task-2',
          plannedDuration: 100,
          actualDuration: 35,
          completed: true,
          startedAt: new Date(Date.now() - 200 * 1000).toISOString(),
        },
        {
          taskId: 'task-3',
          plannedDuration: 100,
          actualDuration: 30,
          completed: true,
          startedAt: new Date(Date.now() - 100 * 1000).toISOString(),
        },
      ],
      humanStateHistory: [],
      baselineDate: new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
    });

    const contextSwitch = patterns.find((p) => p.type === 'context-switch');
    expect(contextSwitch).toBeDefined();
    expect(contextSwitch?.consistency).toBeGreaterThan(0.3);
  });

  it('detects afternoon energy crash', () => {
    const patterns = detectWorkHabitPatterns({
      recentExecutions: [],
      humanStateHistory: [
        {
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 AM
          energy: 0.9,
          stress: 0.2,
          focus: 0.95,
        },
        {
          timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), // 9 AM
          energy: 0.85,
          stress: 0.25,
          focus: 0.9,
        },
        {
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 12 PM
          energy: 0.6,
          stress: 0.35,
          focus: 0.65,
        },
        {
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 PM
          energy: 0.45,
          stress: 0.5,
          focus: 0.4,
        },
      ],
      baselineDate: new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
    });

    const energyCrash = patterns.find((p) => p.type === 'energy-crash');
    expect(energyCrash).toBeDefined();
  });

  it('detects focus loss under stress', () => {
    const patterns = detectWorkHabitPatterns({
      recentExecutions: [
        {
          taskId: 'task-1',
          plannedDuration: 60,
          actualDuration: 45,
          completed: true,
          startedAt: new Date().toISOString(),
          qualityRating: 2,
        },
        {
          taskId: 'task-2',
          plannedDuration: 60,
          actualDuration: 50,
          completed: true,
          startedAt: new Date().toISOString(),
          qualityRating: 1,
        },
      ],
      humanStateHistory: [
        {
          timestamp: new Date().toISOString(),
          energy: 0.6,
          stress: 0.8,
          focus: 0.4,
        },
      ],
      baselineDate: new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
    });

    const focusLoss = patterns.find((p) => p.type === 'focus-loss');
    expect(focusLoss).toBeDefined();
  });
});
