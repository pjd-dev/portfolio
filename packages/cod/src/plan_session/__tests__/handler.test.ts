import { describe, expect, it, vi } from 'vitest';
import { handler } from '../handler.js';
import { inputSchema } from '../schema.js';

describe('plan_session handler', () => {
  const baseResult = {
    session: {
      id: 'session-1',
      status: 'planned',
      params: { durationMinutes: 30 },
      totals: { plannedTasks: 1, plannedEffort: 1, plannedReward: 5 },
      tasks: [
        {
          taskId: 't1',
          title: 'Task 1',
          path: 'tasks/t1.md',
          estimatedEffort: 1,
          reward: 5,
          status: 'pending',
        },
      ],
    },
    noTasksAvailable: false,
    goalContext: {
      source: 'Goals/',
      count: 1,
      primaryGoalId: 'g1',
      warnings: [],
    },
    humanState: {
      status: 'ok',
      warnings: [],
      recommendedMode: 'normal',
      durationCapMin: 60,
      snapshot: {
        source: 'manual',
        energy: 0.6,
        focusCapacity: 'med',
        stress: 0.2,
        sleepHours: 7,
        timeAvailableMin: 120,
        contextTolerance: 'med',
      },
    },
  };

  it('plans a session when validation passes', async () => {
    const deps = {
      sessionPlannerService: {
        planSession: async () => baseResult,
      },
      codValidator: {
        validateSession: () => ({ state: 'PASS', issues: [] }),
        validateTask: () => ({ state: 'PASS', issues: [] }),
      },
    };

    const result = await handler({ durationMinutes: 30 }, deps);

    expect(result.content[0]?.text).toContain('Work Session Planned');
    expect(result.structuredContent.session.id).toBe('session-1');
  });

  it('blocks planning when session validation fails', async () => {
    const planSession = vi.fn();
    const deps = {
      sessionPlannerService: { planSession },
      codValidator: {
        validateSession: () => ({
          state: 'FAIL',
          issues: [{ code: 'INVALID_DURATION', message: 'Bad duration' }],
        }),
        validateTask: () => ({ state: 'PASS', issues: [] }),
      },
    };

    const result = await handler({ durationMinutes: 0 }, deps);

    expect(result.content[0]?.text).toContain('Cannot Plan Session');
    expect(result.structuredContent.validationState).toBe('FAIL');
    expect(planSession).not.toHaveBeenCalled();
  });

  it('returns noTasksAvailable summary when no tasks fit', async () => {
    const deps = {
      sessionPlannerService: {
        planSession: async () => ({
          ...baseResult,
          noTasksAvailable: true,
        }),
      },
      codValidator: {
        validateSession: () => ({ state: 'PASS', issues: [] }),
        validateTask: () => ({ state: 'PASS', issues: [] }),
      },
    };

    const result = await handler({ durationMinutes: 30 }, deps);

    expect(result.content[0]?.text).toContain('No Tasks Available');
  });

  it('is deterministic for identical inputs', async () => {
    const deps = {
      sessionPlannerService: {
        planSession: async () => baseResult,
      },
      codValidator: {
        validateSession: () => ({ state: 'PASS', issues: [] }),
        validateTask: () => ({ state: 'PASS', issues: [] }),
      },
    };

    const first = await handler({ durationMinutes: 30 }, deps);
    const second = await handler({ durationMinutes: 30 }, deps);

    expect(first).toEqual(second);
  });

  it('rejects missing duration in schema validation', () => {
    const result = inputSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
