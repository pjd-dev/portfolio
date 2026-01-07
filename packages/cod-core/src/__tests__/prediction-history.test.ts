import { describe, it, expect } from 'vitest';
import {
  recordTaskExecution,
  computeTaskStats,
  TaskExecutionRecord,
} from '../prediction-history';

describe('COD Prediction - Task Execution History', () => {
  describe('recordTaskExecution', () => {
    it('records successful task completion', () => {
      const record = recordTaskExecution('task-123', {
        planned: {
          effort: 5,
          duration: 60,
          priority: 7,
          goalId: 'goal-1',
        },
        execution: {
          started: '2026-01-07T10:00:00Z',
          ended: '2026-01-07T11:05:00Z',
          completed: true,
        },
        humanState: {
          start: { energy: 0.8, stress: 0.3, focus: 0.9 },
          end: { energy: 0.7, stress: 0.4, focus: 0.8 },
        },
        session: {
          sessionId: 'session-1',
          position: 0,
        },
        outcome: {
          effort: 5,
          quality: 4,
          learnings: 'Task simpler than expected',
        },
        disruptions: {
          contextSwitch: false,
          interrupt: true,
        },
      });

      expect(record.taskId).toBe('task-123');
      expect(record.completed).toBe(true);
      expect(record.plannedDuration).toBe(60);
      expect(record.actualDuration).toBe(65); // 1h 5m
      expect(record.actualEffort).toBe(5);
      expect(record.qualityRating).toBe(4);
      expect(record.hadInterrupt).toBe(true);
    });

    it('records incomplete task with reason', () => {
      const record = recordTaskExecution('task-456', {
        planned: {
          effort: 7,
          duration: 120,
          priority: 5,
        },
        execution: {
          started: '2026-01-07T14:00:00Z',
          ended: '2026-01-07T14:30:00Z',
          completed: false,
          incompletionReason: 'blocked',
        },
        disruptions: {
          contextSwitch: true,
          interrupt: false,
        },
      });

      expect(record.completed).toBe(false);
      expect(record.incompletionReason).toBe('blocked');
      expect(record.actualDuration).toBe(30);
      expect(record.hadContextSwitch).toBe(true);
    });

    it('calculates actual duration from timestamps', () => {
      const record = recordTaskExecution('task-789', {
        planned: { effort: 3, duration: 45, priority: 6 },
        execution: {
          started: '2026-01-07T09:15:00Z',
          ended: '2026-01-07T10:45:00Z',
          completed: true,
        },
        disruptions: { contextSwitch: false, interrupt: false },
      });

      expect(record.actualDuration).toBe(90); // 1.5 hours
    });

    it('includes session context', () => {
      const record = recordTaskExecution('task-xyz', {
        planned: { effort: 4, duration: 50, priority: 8 },
        execution: {
          started: '2026-01-07T10:00:00Z',
          ended: '2026-01-07T10:50:00Z',
          completed: true,
        },
        session: { sessionId: 'session-42', position: 2 },
        disruptions: { contextSwitch: false, interrupt: false },
      });

      expect(record.sessionId).toBe('session-42');
      expect(record.sessionPosition).toBe(2);
    });
  });

  describe('computeTaskStats', () => {
    it('throws on empty execution list', () => {
      expect(() => computeTaskStats([])).toThrow();
    });

    it('computes completion rate', () => {
      const executions: TaskExecutionRecord[] = [
        {
          taskId: 'task-1',
          recordedAt: new Date().toISOString(),
          plannedEffort: 5,
          plannedDuration: 60,
          plannedPriority: 7,
          completed: true,
          actualDuration: 65,
        },
        {
          taskId: 'task-1',
          recordedAt: new Date().toISOString(),
          plannedEffort: 5,
          plannedDuration: 60,
          plannedPriority: 7,
          completed: true,
          actualDuration: 55,
        },
        {
          taskId: 'task-1',
          recordedAt: new Date().toISOString(),
          plannedEffort: 5,
          plannedDuration: 60,
          plannedPriority: 7,
          completed: false,
        },
        {
          taskId: 'task-1',
          recordedAt: new Date().toISOString(),
          plannedEffort: 5,
          plannedDuration: 60,
          plannedPriority: 7,
          completed: false,
        },
      ];

      const stats = computeTaskStats(executions);

      expect(stats.totalAttempts).toBe(4);
      expect(stats.completions).toBe(2);
      expect(stats.completionRate).toBe(0.5);
    });

    it('computes duration accuracy', () => {
      const executions: TaskExecutionRecord[] = [
        {
          taskId: 'task-1',
          recordedAt: new Date().toISOString(),
          plannedEffort: 5,
          plannedDuration: 100, // estimate 100 min
          plannedPriority: 7,
          completed: true,
          actualDuration: 100, // actual 100 min (perfect)
        },
        {
          taskId: 'task-1',
          recordedAt: new Date().toISOString(),
          plannedEffort: 5,
          plannedDuration: 100,
          plannedPriority: 7,
          completed: true,
          actualDuration: 120, // actual 120 min (20% over)
        },
      ];

      const stats = computeTaskStats(executions);

      expect(stats.avgEstimatedDuration).toBe(100);
      expect(stats.avgActualDuration).toBe(110);
      expect(stats.durationAccuracy).toBe(1.1); // 110/100
    });

    it('computes effort accuracy', () => {
      const executions: TaskExecutionRecord[] = [
        {
          taskId: 'task-1',
          recordedAt: new Date().toISOString(),
          plannedEffort: 5, // estimate 5
          plannedDuration: 60,
          plannedPriority: 7,
          completed: true,
          actualEffort: 5, // actual 5 (perfect)
        },
        {
          taskId: 'task-1',
          recordedAt: new Date().toISOString(),
          plannedEffort: 5,
          plannedDuration: 60,
          plannedPriority: 7,
          completed: true,
          actualEffort: 7, // actual 7 (harder)
        },
      ];

      const stats = computeTaskStats(executions);

      expect(stats.avgEstimatedEffort).toBe(5);
      expect(stats.avgActualEffort).toBe(6);
      expect(stats.effortAccuracy).toBe(1.2); // 6/5
    });

    it('computes context switch cost', () => {
      const executions: TaskExecutionRecord[] = [
        {
          taskId: 'task-1',
          recordedAt: new Date().toISOString(),
          plannedEffort: 5,
          plannedDuration: 60,
          plannedPriority: 7,
          completed: true,
          actualDuration: 50,
          hadContextSwitch: false, // no switch = faster
        },
        {
          taskId: 'task-1',
          recordedAt: new Date().toISOString(),
          plannedEffort: 5,
          plannedDuration: 60,
          plannedPriority: 7,
          completed: true,
          actualDuration: 80,
          hadContextSwitch: true, // with switch = slower
        },
      ];

      const stats = computeTaskStats(executions);

      expect(stats.avgDurationWithoutSwitch).toBe(50);
      expect(stats.avgDurationWithSwitch).toBe(80);
      expect(stats.contextSwitchCost).toBe(30); // 30 min overhead
    });

    it('computes quality rating average', () => {
      const executions: TaskExecutionRecord[] = [
        {
          taskId: 'task-1',
          recordedAt: new Date().toISOString(),
          plannedEffort: 5,
          plannedDuration: 60,
          plannedPriority: 7,
          completed: true,
          actualDuration: 60,
          qualityRating: 5,
        },
        {
          taskId: 'task-1',
          recordedAt: new Date().toISOString(),
          plannedEffort: 5,
          plannedDuration: 60,
          plannedPriority: 7,
          completed: true,
          actualDuration: 60,
          qualityRating: 3,
        },
      ];

      const stats = computeTaskStats(executions);

      expect(stats.avgQualityRating).toBe(4);
    });

    it('counts consecutive failures', () => {
      const executions: TaskExecutionRecord[] = [
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
        {
          taskId: 'task-1',
          recordedAt: new Date().toISOString(),
          plannedEffort: 5,
          plannedDuration: 60,
          plannedPriority: 7,
          completed: false,
        },
      ];

      const stats = computeTaskStats(executions);

      expect(stats.consecutiveFailures).toBe(2); // Last 2 executions are failures
    });

    it('handles missing data gracefully', () => {
      const executions: TaskExecutionRecord[] = [
        {
          taskId: 'task-1',
          recordedAt: new Date().toISOString(),
          plannedEffort: 5,
          plannedDuration: 60,
          plannedPriority: 7,
          completed: false,
          // No actualDuration, actualEffort, qualityRating
        },
        {
          taskId: 'task-1',
          recordedAt: new Date().toISOString(),
          plannedEffort: 5,
          plannedDuration: 60,
          plannedPriority: 7,
          completed: true,
          actualDuration: 70,
          actualEffort: 6,
        },
      ];

      const stats = computeTaskStats(executions);

      expect(stats.avgActualDuration).toBe(70); // Only one completed
      expect(stats.completionRate).toBe(0.5);
      expect(stats.avgQualityRating).toBeUndefined(); // No ratings recorded
    });

    it('real-world example: recurring task with improving accuracy', () => {
      // Task done 5 times, getting better at estimates
      const executions: TaskExecutionRecord[] = [
        {
          taskId: 'review-pr',
          recordedAt: new Date().toISOString(),
          plannedEffort: 4,
          plannedDuration: 90,
          plannedPriority: 8,
          completed: true,
          actualDuration: 150,
          actualEffort: 6,
          qualityRating: 3,
        },
        {
          taskId: 'review-pr',
          recordedAt: new Date().toISOString(),
          plannedEffort: 6,
          plannedDuration: 120,
          plannedPriority: 8,
          completed: true,
          actualDuration: 130,
          actualEffort: 6,
          qualityRating: 4,
        },
        {
          taskId: 'review-pr',
          recordedAt: new Date().toISOString(),
          plannedEffort: 6,
          plannedDuration: 130,
          plannedPriority: 8,
          completed: true,
          actualDuration: 125,
          actualEffort: 5,
          qualityRating: 4,
        },
      ];

      const stats = computeTaskStats(executions);

      expect(stats.completionRate).toBe(1.0); // All completed
      expect(stats.avgEstimatedDuration).toBeCloseTo(113.3, 1);
      expect(stats.avgActualDuration).toBeCloseTo(135, 1);
      expect(stats.durationAccuracy).toBeCloseTo(1.19, 2); // ~19% longer than expected
      expect(stats.avgQualityRating).toBeCloseTo(3.67, 2);
    });
  });
});
