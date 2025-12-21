/**
 * COD Validator Tests
 *
 * Test suite for deterministic validation rules.
 * Every rule must have explicit test coverage.
 *
 * Canonical Reference: Projects/COD/05-Validation-Spec.md
 */

import { describe, it, expect } from 'vitest';
import {
  CODValidator,
  type TaskState,
  type SessionState,
} from '../validator/index.js';

describe('CODValidator.validateTask', () => {
  describe('RULE 1: Required fields', () => {
    it('should FAIL when task.id is missing', () => {
      const result = CODValidator.validateTask({
        title: 'Test Task',
        status: 'todo',
        priority: 5,
      });

      expect(result.state).toBe('FAIL');
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.field === 'id')).toBe(true);
    });

    it('should FAIL when task.title is missing', () => {
      const result = CODValidator.validateTask({
        id: 'task-001',
        status: 'todo',
        priority: 5,
      });

      expect(result.state).toBe('FAIL');
      expect(result.issues.some((i) => i.field === 'title')).toBe(true);
    });

    it('should FAIL when task.status is missing', () => {
      const result = CODValidator.validateTask({
        id: 'task-001',
        title: 'Test Task',
        priority: 5,
      });

      expect(result.state).toBe('FAIL');
      expect(result.issues.some((i) => i.field === 'status')).toBe(true);
    });

    it('should PASS when all required fields present', () => {
      const result = CODValidator.validateTask({
        id: 'task-001',
        title: 'Test Task',
        status: 'todo',
        priority: 5,
      });

      expect(result.state).toBe('PASS');
      expect(result.valid).toBe(true);
    });
  });

  describe('RULE 2: Status enum validation', () => {
    it('should FAIL with invalid status', () => {
      const result = CODValidator.validateTask({
        id: 'task-001',
        title: 'Test',
        status: 'invalid-status' as any,
        priority: 5,
      });

      expect(result.state).toBe('FAIL');
      expect(result.issues.some((i) => i.code === 'INVALID_ENUM_VALUE')).toBe(
        true
      );
    });

    it('should PASS with valid statuses', () => {
      for (const status of ['todo', 'in-progress', 'completed', 'blocked']) {
        const result = CODValidator.validateTask({
          id: 'task-001',
          title: 'Test',
          status: status as any,
          priority: 5,
        });
        expect(result.state).toBe('PASS', `Status ${status} should be valid`);
      }
    });
  });

  describe('RULE 3: Priority bounds (0-10)', () => {
    it('should FAIL when priority < 0', () => {
      const result = CODValidator.validateTask({
        id: 'task-001',
        title: 'Test',
        status: 'todo',
        priority: -1,
      });

      expect(result.state).toBe('FAIL');
      expect(result.issues.some((i) => i.code === 'VALUE_OUT_OF_BOUNDS')).toBe(
        true
      );
    });

    it('should FAIL when priority > 10', () => {
      const result = CODValidator.validateTask({
        id: 'task-001',
        title: 'Test',
        status: 'todo',
        priority: 11,
      });

      expect(result.state).toBe('FAIL');
    });

    it('should PASS with valid priority (0-10)', () => {
      for (const priority of [0, 5, 10]) {
        const result = CODValidator.validateTask({
          id: 'task-001',
          title: 'Test',
          status: 'todo',
          priority,
        });
        expect(result.state).toBe(
          'PASS',
          `Priority ${priority} should be valid`
        );
      }
    });
  });

  describe('RULE 4: Goal reference validation', () => {
    it('should FAIL when goal does not exist in goalsMap', () => {
      const result = CODValidator.validateTask(
        {
          id: 'task-001',
          title: 'Test',
          status: 'todo',
          priority: 5,
          goal: 'non-existent-goal',
        },
        {
          goalsMap: {
            'goal-001': true,
            'goal-002': true,
          },
        }
      );

      expect(result.state).toBe('FAIL');
      expect(
        result.issues.some((i) => i.code === 'INVALID_GOAL_REFERENCE')
      ).toBe(true);
    });

    it('should PASS when goal exists in goalsMap', () => {
      const result = CODValidator.validateTask(
        {
          id: 'task-001',
          title: 'Test',
          status: 'todo',
          priority: 5,
          goal: 'goal-001',
        },
        {
          goalsMap: {
            'goal-001': true,
          },
        }
      );

      expect(result.state).toBe('PASS');
    });

    it('should PASS when goal is null', () => {
      const result = CODValidator.validateTask({
        id: 'task-001',
        title: 'Test',
        status: 'todo',
        priority: 5,
        goal: null,
      });

      expect(result.state).toBe('PASS');
    });

    it('should PASS when goal is undefined', () => {
      const result = CODValidator.validateTask({
        id: 'task-001',
        title: 'Test',
        status: 'todo',
        priority: 5,
      });

      expect(result.state).toBe('PASS');
    });
  });

  describe('RULE 5: No self-dependencies', () => {
    it('should FAIL when task depends on itself', () => {
      const result = CODValidator.validateTask({
        id: 'task-001',
        title: 'Test',
        status: 'todo',
        priority: 5,
        dependsOn: ['task-001'],
      });

      expect(result.state).toBe('FAIL');
      expect(result.issues.some((i) => i.code === 'DEPENDENCY_CYCLE')).toBe(
        true
      );
    });

    it('should PASS when dependencies do not include self', () => {
      const result = CODValidator.validateTask({
        id: 'task-001',
        title: 'Test',
        status: 'todo',
        priority: 5,
        dependsOn: ['task-002', 'task-003'],
      });

      expect(result.state).toBe('PASS');
    });
  });

  describe('RULE 6: Cannot be blocked by self', () => {
    it('should FAIL when task is blocked by itself', () => {
      const result = CODValidator.validateTask({
        id: 'task-001',
        title: 'Test',
        status: 'todo',
        priority: 5,
        blockedBy: ['task-001'],
      });

      expect(result.state).toBe('FAIL');
      expect(result.issues.some((i) => i.code === 'BLOCKED_BY_BLOCKER')).toBe(
        true
      );
    });

    it('should PASS when blockers do not include self', () => {
      const result = CODValidator.validateTask({
        id: 'task-001',
        title: 'Test',
        status: 'todo',
        priority: 5,
        blockedBy: ['blocker-001'],
      });

      expect(result.state).toBe('PASS');
    });
  });

  describe('Warnings', () => {
    it('should WARN when task has many dependencies (>5)', () => {
      const result = CODValidator.validateTask({
        id: 'task-001',
        title: 'Test',
        status: 'todo',
        priority: 5,
        dependsOn: ['t1', 't2', 't3', 't4', 't5', 't6'],
      });

      expect(result.state).toBe('WARN');
      expect(result.summary.warnings).toBeGreaterThan(0);
    });

    it('should WARN when status is blocked but no blockers recorded', () => {
      const result = CODValidator.validateTask({
        id: 'task-001',
        title: 'Test',
        status: 'blocked',
        priority: 5,
        blockedBy: [],
      });

      expect(result.state).toBe('WARN');
      expect(
        result.issues.some((i) => i.code === 'INVALID_STATUS_TRANSITION')
      ).toBe(true);
    });
  });

  describe('Strict mode', () => {
    it('should FAIL when warnings are treated as errors (strict=true)', () => {
      const result = CODValidator.validateTask(
        {
          id: 'task-001',
          title: 'Test',
          status: 'blocked',
          priority: 5,
          blockedBy: [],
        },
        {},
        { strict: true }
      );

      expect(result.state).toBe('FAIL');
    });

    it('should WARN in normal mode but FAIL in strict mode', () => {
      const task = {
        id: 'task-001',
        title: 'Test',
        status: 'blocked',
        priority: 5,
        blockedBy: [],
      };

      const normalResult = CODValidator.validateTask(task, {}, {});
      const strictResult = CODValidator.validateTask(
        task,
        {},
        { strict: true }
      );

      expect(normalResult.state).toBe('WARN');
      expect(strictResult.state).toBe('FAIL');
    });
  });
});

describe('CODValidator.validateSession', () => {
  describe('RULE 1: Duration must be positive', () => {
    it('should FAIL when duration is 0', () => {
      const result = CODValidator.validateSession({
        id: 'session-001',
        duration: 0,
        taskIds: ['task-001'],
        totalEffort: 5,
        totalReward: 10,
        focusCost: 3,
      });

      expect(result.state).toBe('FAIL');
      expect(result.issues.some((i) => i.code === 'VALUE_OUT_OF_BOUNDS')).toBe(
        true
      );
    });

    it('should FAIL when duration is negative', () => {
      const result = CODValidator.validateSession({
        id: 'session-001',
        duration: -45,
        taskIds: ['task-001'],
        totalEffort: 5,
        totalReward: 10,
        focusCost: 3,
      });

      expect(result.state).toBe('FAIL');
    });

    it('should PASS when duration is positive', () => {
      const result = CODValidator.validateSession({
        id: 'session-001',
        duration: 500,
        taskIds: ['task-001'],
        totalEffort: 5,
        totalReward: 10,
        focusCost: 3,
      });

      expect(result.state).toBe('PASS');
    });
  });

  describe('RULE 2: Session must have tasks', () => {
    it('should WARN when session has no tasks', () => {
      const result = CODValidator.validateSession({
        id: 'session-001',
        duration: 45,
        taskIds: [],
        totalEffort: 0,
        totalReward: 0,
        focusCost: 0,
      });

      expect(result.state).toBe('WARN');
      expect(result.issues.some((i) => i.field === 'taskIds')).toBe(true);
    });

    it('should PASS when session has tasks', () => {
      const result = CODValidator.validateSession({
        id: 'session-001',
        duration: 500,
        taskIds: ['task-001', 'task-002'],
        totalEffort: 5,
        totalReward: 10,
        focusCost: 3,
      });

      expect(result.state).toBe('PASS');
    });
  });

  describe('RULE 3: Capacity check', () => {
    it('should WARN when total effort exceeds duration capacity', () => {
      // High effort + high focus cost = too much work
      const result = CODValidator.validateSession({
        id: 'session-001',
        duration: 30, // only 30 minutes
        taskIds: ['task-001'],
        totalEffort: 8, // 8 * 30 = 240 min
        totalReward: 10,
        focusCost: 8, // 8 * 10 = 80 min
      });

      expect(result.state).toBe('WARN');
      expect(
        result.issues.some((i) => i.code === 'HIGH_RISK_CONFIGURATION')
      ).toBe(true);
    });

    it('should PASS when work fits in duration', () => {
      const result = CODValidator.validateSession({
        id: 'session-001',
        duration: 120, // 2 hours
        taskIds: ['task-001'],
        totalEffort: 2, // 2 * 30 = 60 min
        totalReward: 10,
        focusCost: 2, // 2 * 10 = 20 min
      });

      // (60 + 20) * 1.2 buffer = 96 min, fits in 120
      expect(result.state).toBe('PASS');
    });
  });
});

describe('CODValidator.validateDependencyGraph', () => {
  describe('RULE 1: No circular dependencies', () => {
    it('should FAIL when cycle is detected (A -> B -> A)', () => {
      const tasks = {
        'task-A': { id: 'task-A', title: 'A', dependsOn: ['task-B'] },
        'task-B': { id: 'task-B', title: 'B', dependsOn: ['task-A'] },
      };

      const result = CODValidator.validateDependencyGraph(tasks);

      expect(result.state).toBe('FAIL');
      expect(result.issues.some((i) => i.code === 'DEPENDENCY_CYCLE')).toBe(
        true
      );
    });

    it('should FAIL when self-cycle exists (A -> A)', () => {
      const tasks = {
        'task-A': { id: 'task-A', title: 'A', dependsOn: ['task-A'] },
      };

      const result = CODValidator.validateDependencyGraph(tasks);

      expect(result.state).toBe('FAIL');
      expect(result.issues.some((i) => i.code === 'DEPENDENCY_CYCLE')).toBe(
        true
      );
    });

    it('should FAIL when cycle is detected (A -> B -> C -> A)', () => {
      const tasks = {
        'task-A': { id: 'task-A', title: 'A', dependsOn: ['task-B'] },
        'task-B': { id: 'task-B', title: 'B', dependsOn: ['task-C'] },
        'task-C': { id: 'task-C', title: 'C', dependsOn: ['task-A'] },
      };

      const result = CODValidator.validateDependencyGraph(tasks);

      expect(result.state).toBe('FAIL');
      expect(result.issues.some((i) => i.code === 'DEPENDENCY_CYCLE')).toBe(
        true
      );
    });

    it('should PASS with acyclic graph', () => {
      const tasks = {
        'task-A': { id: 'task-A', title: 'A', dependsOn: [] },
        'task-B': { id: 'task-B', title: 'B', dependsOn: ['task-A'] },
        'task-C': { id: 'task-C', title: 'C', dependsOn: ['task-A', 'task-B'] },
      };

      const result = CODValidator.validateDependencyGraph(tasks);

      expect(result.state).toBe('PASS');
    });
  });

  describe('RULE 2: All dependency references must exist', () => {
    it('should WARN when task depends on non-existent task', () => {
      const tasks = {
        'task-A': { id: 'task-A', title: 'A', dependsOn: ['task-B'] },
      };

      const result = CODValidator.validateDependencyGraph(tasks);

      expect(result.summary.warnings).toBeGreaterThan(0);
      expect(result.issues.some((i) => i.code === 'MISSING_DEPENDENCY')).toBe(
        true
      );
    });

    it('should PASS when all dependencies exist', () => {
      const tasks = {
        'task-A': { id: 'task-A', title: 'A', dependsOn: [] },
        'task-B': { id: 'task-B', title: 'B', dependsOn: ['task-A'] },
      };

      const result = CODValidator.validateDependencyGraph(tasks);

      expect(result.state).toBe('PASS');
    });
  });
});
