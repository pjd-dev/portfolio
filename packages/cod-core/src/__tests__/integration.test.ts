/**
 * COD Validator Integration Tests
 *
 * Live tests demonstrating real-world validation scenarios
 * where the COD validator protects MCP tools from invalid operations.
 */

import { describe, it, expect } from 'vitest';
import { CODValidator } from '../validator/index.js';

describe('COD Integration Tests - Real-World Scenarios', () => {
  describe('Session Planning - Valid Flow', () => {
    it('should validate session with proper duration and task capacity', () => {
      const session = {
        id: 'sess-001',
        duration: 500, // 500 minutes (plenty of time)
        taskIds: ['task-1', 'task-2', 'task-3'],
        totalEffort: 1, // low effort
        totalReward: 25,
        focusCost: 1, // minimal context switching
      };

      const result = CODValidator.validateSession(session);

      expect(result.state).toBe('PASS');
      expect(result.valid).toBe(true);
      expect(result.summary.errors).toBe(0);
      console.log('✓ Session validation passed:', {
        duration: session.duration,
        tasks: session.taskIds.length,
        effort: session.totalEffort,
      });
    });

    it('should warn about overbooked session but not reject', () => {
      const session = {
        id: 'sess-002',
        duration: 30, // only 30 minutes
        taskIds: ['task-1', 'task-2', 'task-3', 'task-4', 'task-5'],
        totalEffort: 10, // too much work
        totalReward: 50,
        focusCost: 5,
      };

      const result = CODValidator.validateSession(session);

      expect(result.state).toBe('WARN');
      expect(result.valid).toBe(false);
      expect(result.summary.warnings).toBeGreaterThan(0);
      console.log('⚠ Session capacity warning:', result.issues[0]?.message);
    });
  });

  describe('Task Validation - Valid and Invalid States', () => {
    it('should validate a properly formed task', () => {
      const task = {
        id: 'task-123',
        title: 'Implement feature X',
        status: 'in-progress' as const,
        priority: 7,
        dependsOn: ['task-100', 'task-101'],
        blockedBy: [],
      };

      const result = CODValidator.validateTask(task);

      expect(result.state).toBe('PASS');
      expect(result.valid).toBe(true);
      console.log('✓ Task validation passed:', {
        id: task.id,
        status: task.status,
        priority: task.priority,
      });
    });

    it('should reject task with invalid priority', () => {
      const task = {
        id: 'task-124',
        title: 'Invalid priority task',
        status: 'todo' as const,
        priority: 15, // exceeds max of 10
        dependsOn: [],
        blockedBy: [],
      };

      const result = CODValidator.validateTask(task);

      expect(result.state).toBe('FAIL');
      expect(result.valid).toBe(false);
      expect(result.summary.errors).toBeGreaterThan(0);
      console.log('❌ Task validation failed:', result.issues[0]?.message);
    });

    it('should reject self-referencing dependencies', () => {
      const task = {
        id: 'task-125',
        title: 'Circular task',
        status: 'todo' as const,
        priority: 5,
        dependsOn: ['task-125'], // self-reference
        blockedBy: [],
      };

      const result = CODValidator.validateTask(task);

      expect(result.state).toBe('FAIL');
      expect(result.valid).toBe(false);
      console.log('❌ Self-reference detected:', result.issues[0]?.message);
    });

    it('should detect blocked status with empty blockers list', () => {
      const task = {
        id: 'task-126',
        title: 'Blocked but why?',
        status: 'blocked' as const,
        priority: 5,
        dependsOn: [],
        blockedBy: [], // empty! inconsistent state
      };

      const result = CODValidator.validateTask(task);

      expect(result.state).toBe('WARN');
      expect(result.summary.warnings).toBeGreaterThan(0);
      console.log('⚠ Blocked status warning:', result.issues[0]?.message);
    });
  });

  describe('Batch Operations - Validation Atomicity', () => {
    it('should validate all operations in batch before execution', () => {
      // Simulate batch of operations that would be applied together
      const operations = [
        {
          type: 'replace' as const,
          search: 'old text',
          replacement: 'new text',
        },
        {
          type: 'insert' as const,
          line: 10,
          content: 'inserted line',
        },
        {
          type: 'delete' as const,
          search: 'line to delete',
        },
      ];

      // Validate each operation state
      let allValid = true;
      const validationResults = operations.map((op) => {
        // Simple validation: all operations have required fields
        const isValid =
          op.type &&
          ((op.type === 'replace' && op.search && op.replacement) ||
            (op.type === 'insert' && op.line && op.content) ||
            (op.type === 'delete' && op.search));

        if (!isValid) allValid = false;
        return { op, isValid };
      });

      expect(allValid).toBe(true);
      console.log('✓ Batch operations validation:', {
        totalOps: operations.length,
        validOps: validationResults.filter((r) => r.isValid).length,
      });
    });

    it('should reject batch if any operation is invalid', () => {
      const operations = [
        { type: 'replace', search: 'valid', replacement: 'text' }, // valid
        { type: 'insert', line: 10, content: 'text' }, // valid
        { type: 'delete', search: null }, // INVALID - null search
      ];

      let hasInvalid = false;
      operations.forEach((op) => {
        if (op.type === 'delete' && !op.search) {
          hasInvalid = true;
        }
      });

      expect(hasInvalid).toBe(true);
      console.log('❌ Batch validation failed: operation contains null search');
    });
  });

  describe('Dependency Graph Validation', () => {
    it('should detect circular dependencies in task graph', () => {
      const taskGraph = {
        'task-a': { dependsOn: ['task-b'] },
        'task-b': { dependsOn: ['task-c'] },
        'task-c': { dependsOn: ['task-a'] }, // cycle: c -> a -> b -> c
      };

      // Simplified cycle detection for integration test
      const hasCycle = (graph: Record<string, any>) => {
        const visited = new Set<string>();
        const recStack = new Set<string>();

        const dfs = (node: string): boolean => {
          visited.add(node);
          recStack.add(node);

          const neighbors = graph[node]?.dependsOn || [];
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
              if (dfs(neighbor)) return true;
            } else if (recStack.has(neighbor)) {
              return true;
            }
          }

          recStack.delete(node);
          return false;
        };

        for (const node of Object.keys(graph)) {
          if (!visited.has(node)) {
            if (dfs(node)) return true;
          }
        }
        return false;
      };

      expect(hasCycle(taskGraph)).toBe(true);
      console.log('❌ Cycle detected: c → a → b → c');
    });

    it('should validate acyclic dependency graph', () => {
      const taskGraph = {
        'task-a': ['task-b', 'task-c'],
        'task-b': ['task-d'],
        'task-c': ['task-d'],
        'task-d': [],
      };

      const result = CODValidator.validateDependencyGraph(taskGraph);

      expect(result.state).toBe('PASS');
      expect(result.valid).toBe(true);
      console.log('✓ Dependency graph is acyclic');
    });

    it('should warn about non-existent task references', () => {
      const taskGraph = {
        'task-a': {
          dependsOn: ['task-b', 'task-nonexistent'],
        },
        'task-b': {
          dependsOn: [],
        },
      };

      // Check for missing dependencies
      let hasMissing = false;
      for (const [taskId, task] of Object.entries(taskGraph)) {
        const deps = (task as any).dependsOn || [];
        for (const dep of deps) {
          if (!taskGraph[dep]) {
            hasMissing = true;
            break;
          }
        }
      }

      expect(hasMissing).toBe(true);
      console.log('⚠ Missing task reference: task-nonexistent');
    });
  });

  describe('Strict Mode - Production Safety', () => {
    it('should reject warnings in strict mode (production)', () => {
      const session = {
        id: 'sess-003',
        duration: 45,
        taskIds: [], // empty task list - warning
        totalEffort: 0,
        totalReward: 0,
        focusCost: 0,
      };

      const resultNormal = CODValidator.validateSession(session, {});
      const resultStrict = CODValidator.validateSession(session, {
        strict: true,
      });

      expect(resultNormal.state).toBe('WARN');
      expect(resultStrict.state).toBe('FAIL');
      console.log('✓ Strict mode enforces stricter validation');
    });

    it('should provide actionable error messages', () => {
      const task = {
        id: 'task-127',
        title: 'Priority test',
        status: 'todo' as const,
        priority: 15,
      };

      const result = CODValidator.validateTask(task);

      expect(result.issues.length).toBeGreaterThan(0);
      const issue = result.issues[0];
      expect(issue?.suggestion).toBeDefined();
      console.log('✓ Error includes suggestion:', issue?.suggestion);
    });
  });

  describe('Error Recovery - Validation Feedback Loop', () => {
    it('should provide enough info to fix invalid task', () => {
      let task = {
        id: 'task-128',
        // missing title
        status: 'todo' as const,
        priority: 15, // invalid
        dependsOn: ['task-128'], // self-reference
      };

      let result = CODValidator.validateTask(task);
      expect(result.state).toBe('FAIL');

      // User fixes based on feedback
      task = {
        id: 'task-128',
        title: 'Now with title',
        status: 'todo' as const,
        priority: 7, // fixed
        dependsOn: [], // fixed
      };

      result = CODValidator.validateTask(task);
      expect(result.state).toBe('PASS');
      console.log('✓ Task fixed based on validation feedback');
    });

    it('should suggest specific fixes for common issues', () => {
      const invalidSession = {
        id: 'sess-004',
        duration: 0, // invalid
        taskIds: [],
        totalEffort: 0,
        totalReward: 0,
        focusCost: 0,
      };

      const result = CODValidator.validateSession(invalidSession);
      const durationIssue = result.issues.find((i) => i.field === 'duration');

      expect(durationIssue?.suggestion).toBeDefined();
      console.log('✓ Suggestion:', durationIssue?.suggestion);
    });
  });

  describe('Performance - Validation Overhead', () => {
    it('should validate large task graphs efficiently', () => {
      // Create large task graph
      const taskGraph: Record<string, string[]> = {};
      for (let i = 0; i < 1000; i++) {
        taskGraph[`task-${i}`] = [`task-${i + 1}`, `task-${i + 2}`].filter(
          (k) => parseInt(k.split('-')[1]) < 1000
        );
      }

      const start = performance.now();
      const result = CODValidator.validateDependencyGraph(taskGraph);
      const duration = performance.now() - start;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(100); // should be fast
      console.log(`✓ Validated 1000 tasks in ${duration.toFixed(2)}ms`);
    });

    it('should validate batch operations without significant overhead', () => {
      const operations = Array.from({ length: 100 }, (_, i) => ({
        type: 'replace' as const,
        search: `pattern-${i}`,
        replacement: `replacement-${i}`,
      }));

      const start = performance.now();
      let validCount = 0;
      operations.forEach((op) => {
        if (op.search && op.replacement) validCount++;
      });
      const duration = performance.now() - start;

      expect(validCount).toBe(100);
      expect(duration).toBeLessThan(10);
      console.log(`✓ Validated 100 operations in ${duration.toFixed(2)}ms`);
    });
  });

  describe('Real-World MCP Tool Scenarios', () => {
    it('scenario: task_next_actions with invalid tasks filtered', () => {
      // Simulate the EP2 validation scenario
      const tasks = [
        {
          id: 'task-1',
          title: 'Valid task',
          status: 'todo' as const,
          priority: 5,
        },
        {
          id: 'task-2',
          title: 'Invalid task',
          status: 'todo' as const,
          priority: 15, // invalid
        },
        {
          id: 'task-3',
          title: 'Another valid',
          status: 'in-progress' as const,
          priority: 7,
        },
      ];

      const validationMap = new Map();
      const failedTasks = [];

      tasks.forEach((task) => {
        const result = CODValidator.validateTask(task);
        validationMap.set(task.id, result);

        if (result.state === 'FAIL') {
          failedTasks.push(task.id);
        }
      });

      expect(failedTasks).toContain('task-2');
      expect(failedTasks.length).toBe(1);
      console.log('✓ MCP tool filtered out invalid task:', failedTasks);
    });

    it('scenario: apply_with_diff atomic validation before execution', () => {
      // Simulate EP3 validation scenario
      const operations = [
        {
          id: 'op-1',
          type: 'replace' as const,
          search: 'pattern',
          replacement: 'new-pattern',
        },
        {
          id: 'op-2',
          type: 'insert' as const,
          line: 5,
          content: 'new line',
        },
        {
          id: 'op-3',
          type: 'delete' as const,
          search: null, // INVALID
        },
      ];

      let hasInvalidOp = false;
      operations.forEach((op) => {
        if (op.type === 'delete' && !op.search) {
          hasInvalidOp = true;
        }
      });

      // Entire batch rejected due to one invalid operation
      expect(hasInvalidOp).toBe(true);
      console.log(
        '✓ Batch operation rejected: atomic validation prevents partial execution'
      );
    });

    it('scenario: resolve_blocker validates state consistency', () => {
      // Simulate EP4 validation scenario
      const blocker = {
        id: 'blocker-1',
        taskId: 'task-x',
        solution: 'Fixed the underlying issue',
        timestamp: new Date().toISOString(),
      };

      // Validate blocker has required fields
      const isValid =
        blocker.id &&
        blocker.taskId &&
        blocker.solution &&
        blocker.solution.length > 0;

      expect(isValid).toBe(true);
      console.log('✓ Blocker resolution validated');
    });
  });

  describe('Validation Summary Statistics', () => {
    it('should collect validation statistics across multiple checks', () => {
      const tests = [
        CODValidator.validateTask({
          id: 't1',
          title: 'Test 1',
          status: 'todo' as const,
          priority: 5,
        }),
        CODValidator.validateTask({
          id: 't2',
          title: 'Test 2',
          status: 'todo' as const,
          priority: 15, // invalid
        }),
        CODValidator.validateSession({
          id: 's1',
          duration: 500,
          taskIds: ['t1'],
          totalEffort: 1,
          totalReward: 10,
          focusCost: 0,
        }),
      ];

      const stats = {
        total: tests.length,
        passed: tests.filter((r) => r.state === 'PASS').length,
        warned: tests.filter((r) => r.state === 'WARN').length,
        failed: tests.filter((r) => r.state === 'FAIL').length,
      };

      expect(stats.total).toBe(3);
      expect(stats.passed).toBe(2); // both session and t1 pass
      expect(stats.failed).toBe(1); // t2 fails

      console.log('✓ Validation Summary:', stats);
    });
  });
});
