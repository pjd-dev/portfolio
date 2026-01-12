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
});
