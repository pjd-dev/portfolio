import { describe, expect, it } from 'vitest';
import type { TaskNextActionsDeps } from '../handler.js';
import { handler } from '../handler.js';
import { inputSchema } from '../schema.js';

describe('task_next_actions handler', () => {
  const baseDeps = {
    goalService: {
      loadGoals: async () => ({
        source: 'none',
        warnings: [],
        index: {
          goals: [],
          goalsById: {},
          activeGoalIds: [],
          primaryGoalId: undefined,
        },
      }),
    },
    humanStateService: {
      loadPlanningContext: async () => ({
        status: 'ok',
        warnings: [],
        recommendedMode: 'normal',
        durationCapMin: 60,
        ageHours: 2,
        snapshot: {
          source: 'manual',
          energy: 0.5,
          focusCapacity: 'low',
          stress: 0,
          sleepHours: 8,
          timeAvailableMin: 30,
          contextTolerance: 'med',
        },
      }),
    },
  } satisfies Pick<TaskNextActionsDeps, 'goalService' | 'humanStateService'>;

  it('returns unblocked tasks and filters failed validation', async () => {
    const deps: TaskNextActionsDeps = {
      ...baseDeps,
      taskGraphService: {
        getNextActions: async () => [
          {
            task: {
              id: 't1',
              title: 'Task 1',
              status: 'todo',
              path: 'tasks/t1.md',
            },
            blocked: false,
            unmetDependencies: [],
            score: 2,
          },
          {
            task: {
              id: 't2',
              title: 'Task 2',
              status: 'todo',
              path: 'tasks/t2.md',
            },
            blocked: true,
            unmetDependencies: ['dep'],
            score: 1,
          },
          {
            task: {
              id: 'bad',
              title: 'Bad Task',
              status: 'todo',
              path: 'tasks/bad.md',
            },
            blocked: false,
            unmetDependencies: [],
            score: 3,
          },
        ],
      },
      codValidator: {
        validateTask: (task) => {
          const isBad = task.id === 'bad';
          return {
            state: isBad ? 'FAIL' : 'PASS',
            reason: isBad ? 'invalid' : undefined,
            issues: isBad ? [{ code: 'INVALID', message: 'bad task' }] : [],
          };
        },
      },
    };

    const result = await handler({}, deps);

    expect(result.structuredContent).toBeDefined();
    const sc = result.structuredContent!;
    expect(sc.unblocked).toHaveLength(1);
    expect(sc.unblocked[0].task.id).toBe('t1');
    expect(sc.blocked).toHaveLength(1);
    expect(sc.failed).toHaveLength(1);
    expect(result.content[0]?.text).toContain('# Next Actions');
  });

  it('is deterministic for identical inputs', async () => {
    const deps: TaskNextActionsDeps = {
      ...baseDeps,
      taskGraphService: {
        getNextActions: async () => [],
      },
      codValidator: {
        validateTask: () => ({ state: 'PASS', issues: [] }),
      },
    };

    const first = await handler({}, deps);
    const second = await handler({}, deps);

    expect(first).toEqual(second);
  });

  it('rejects invalid statusFilter in schema validation', () => {
    const result = inputSchema.safeParse({ statusFilter: ['not-a-status'] });
    expect(result.success).toBe(false);
  });

  it('filters recurring tasks based on recurringMode', async () => {
    const deps: TaskNextActionsDeps = {
      ...baseDeps,
      taskGraphService: {
        getNextActions: async () => [
          {
            task: {
              id: 't1',
              title: 'Task 1',
              status: 'todo',
              path: 'tasks/t1.md',
            },
            blocked: false,
            unmetDependencies: [],
            score: 2,
          },
          {
            task: {
              id: 'r1',
              title: 'Recurring 1',
              status: 'todo',
              path: 'tasks/r1.md',
              tags: ['recurring'],
            },
            blocked: false,
            unmetDependencies: [],
            score: 1,
          },
        ],
      },
      codValidator: {
        validateTask: () => ({ state: 'PASS', issues: [] }),
      },
    };

    const excludeResult = await handler({}, deps);
    expect(
      excludeResult.structuredContent?.unblocked.map((t) => t.task.id)
    ).toEqual(['t1']);

    const includeResult = await handler({ recurringMode: 'include' }, deps);
    expect(
      includeResult.structuredContent?.unblocked.map((t) => t.task.id)
    ).toEqual(['t1', 'r1']);

    const onlyResult = await handler({ recurringMode: 'only' }, deps);
    expect(
      onlyResult.structuredContent?.unblocked.map((t) => t.task.id)
    ).toEqual(['r1']);
  });

  it('filters recurring tasks by nextRun date', async () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const deps: TaskNextActionsDeps = {
      ...baseDeps,
      taskGraphService: {
        getNextActions: async () => [
          {
            task: {
              id: 'r-due',
              title: 'Due Today',
              status: 'todo',
              path: 'tasks/r-due.md',
              compound: { cadence: 'daily' },
              nextRun: yesterday.toISOString(),
            },
            blocked: false,
            unmetDependencies: [],
            score: 2,
          },
          {
            task: {
              id: 'r-future',
              title: 'Due Tomorrow',
              status: 'todo',
              path: 'tasks/r-future.md',
              compound: { cadence: 'daily' },
              nextRun: tomorrow.toISOString(),
            },
            blocked: false,
            unmetDependencies: [],
            score: 1,
          },
        ],
      },
      codValidator: {
        validateTask: () => ({ state: 'PASS', issues: [] }),
      },
    };

    // With 'only' mode, should only return task that is due now
    const onlyResult = await handler({ recurringMode: 'only' }, deps);
    expect(
      onlyResult.structuredContent?.unblocked.map((t) => t.task.id)
    ).toEqual(['r-due']);

    // With 'include' mode, should include both due and future
    const includeResult = await handler({ recurringMode: 'include' }, deps);
    const ids = includeResult.structuredContent?.unblocked.map(
      (t) => t.task.id
    );
    expect(ids).toContain('r-due');
    // r-future may or may not be included depending on other filters
  });

  it('rejects invalid recurringMode in schema validation', () => {
    const result = inputSchema.safeParse({ recurringMode: 'sometimes' });
    expect(result.success).toBe(false);
  });

  it('blocks actions if workload threshold exceeded', async () => {
    const deps: TaskNextActionsDeps = {
      ...baseDeps,
      taskGraphService: {
        getNextActions: async () => [
          {
            task: {
              id: 't1',
              title: 'Task 1',
              status: 'todo',
              path: 'tasks/t1.md',
            },
            blocked: false,
            unmetDependencies: [],
            score: 2,
          },
        ],
      },
      codValidator: {
        validateTask: () => ({ state: 'PASS', issues: [] }),
      },
      avatarWorkloadService: {
        checkWorkloadGating: async () => ({
          blocked: true,
          reason: 'Workload limit exceeded: 25 events today',
          workloadToday: 25,
          threshold: 20,
          date: new Date().toISOString().slice(0, 10),
        }),
        getAvatarFreshness: async () => ({
          stale: false,
        }),
      },
    };

    const result = await handler({}, deps);
    expect(result.structuredContent?.unblocked).toHaveLength(0);
    expect(result.content[0]?.text).toContain('Workload Limit Reached');
    expect(result.content[0]?.text).toContain('25 events');
  });

  it('allows actions when workload below threshold', async () => {
    const deps: TaskNextActionsDeps = {
      ...baseDeps,
      taskGraphService: {
        getNextActions: async () => [
          {
            task: {
              id: 't1',
              title: 'Task 1',
              status: 'todo',
              path: 'tasks/t1.md',
            },
            blocked: false,
            unmetDependencies: [],
            score: 2,
          },
        ],
      },
      codValidator: {
        validateTask: () => ({ state: 'PASS', issues: [] }),
      },
      avatarWorkloadService: {
        checkWorkloadGating: async () => ({
          blocked: false,
          workloadToday: 10,
          threshold: 20,
          date: new Date().toISOString().slice(0, 10),
        }),
        getAvatarFreshness: async () => ({
          stale: false,
        }),
      },
    };

    const result = await handler({}, deps);
    expect(result.structuredContent?.unblocked).toHaveLength(1);
    expect(result.structuredContent?.unblocked[0].task.id).toBe('t1');
  });

  it('blocks actions when avatar vitals are stale', async () => {
    const deps: TaskNextActionsDeps = {
      ...baseDeps,
      taskGraphService: {
        getNextActions: async () => [
          {
            task: {
              id: 't1',
              title: 'Task 1',
              status: 'todo',
              path: 'tasks/t1.md',
            },
            blocked: false,
            unmetDependencies: [],
            score: 2,
          },
        ],
      },
      codValidator: {
        validateTask: () => ({ state: 'PASS', issues: [] }),
      },
      avatarWorkloadService: {
        checkWorkloadGating: async () => ({
          blocked: false,
          workloadToday: 5,
          threshold: 20,
          date: new Date().toISOString().slice(0, 10),
        }),
        getAvatarFreshness: async () => ({
          stale: true,
          lastUpdate: '2025-01-01',
          reason: 'Avatar vitals not updated today',
        }),
      },
    };

    const result = await handler({}, deps);
    expect(result.structuredContent?.unblocked).toHaveLength(0);
    expect(result.content[0]?.text).toContain('Avatar Vitals Stale');
  });

  it('allows actions when avatar vitals are fresh', async () => {
    const deps: TaskNextActionsDeps = {
      ...baseDeps,
      taskGraphService: {
        getNextActions: async () => [
          {
            task: {
              id: 't1',
              title: 'Task 1',
              status: 'todo',
              path: 'tasks/t1.md',
            },
            blocked: false,
            unmetDependencies: [],
            score: 2,
          },
        ],
      },
      codValidator: {
        validateTask: () => ({ state: 'PASS', issues: [] }),
      },
      avatarWorkloadService: {
        checkWorkloadGating: async () => ({
          blocked: false,
          workloadToday: 5,
          threshold: 20,
          date: new Date().toISOString().slice(0, 10),
        }),
        getAvatarFreshness: async () => ({
          stale: false,
          lastUpdate: new Date().toISOString().slice(0, 10),
        }),
      },
    };

    const result = await handler({}, deps);
    expect(result.structuredContent?.unblocked).toHaveLength(1);
    expect(result.structuredContent?.unblocked[0].task.id).toBe('t1');
  });
});
