# COD Validator - Quick Reference Guide

COD = **Cognitive Organizer & Operator**.

## Installation

```bash
# COD Validator is available as @vault/cod package
import { CODValidator } from '@vault/cod';
```

## Basic Usage Pattern

All MCP tools follow this validation pattern:

```typescript
import { CODValidator } from '@vault/cod';

export async function myTool(params: any) {
  // 1. Create state object for validation
  const state = {
    id: params.id,
    title: params.title,
    status: params.status,
    priority: params.priority,
    // ... other fields
  };

  // 2. Call appropriate validator method
  const validation = CODValidator.validateTask(state);

  // 3. Check validation result
  if (validation.state === 'FAIL') {
    return {
      content: [
        {
          type: 'text',
          text: `❌ Validation failed: ${validation.issues[0]?.message}`,
        },
      ],
      isError: true,
    };
  }

  // 4. Proceed with operation
  return {
    content: [{ type: 'text', text: 'Operation completed' }],
  };
}
```

## Validator Methods

### Task Validation

```typescript
const result = CODValidator.validateTask(
  task, // Task object with fields to validate
  {
    goalsMap: { 'goal-1': true }, // Optional: validate goal references
    tasksMap: { 'task-1': true }, // Optional: validate dependencies
  },
  { strict: false } // Optional: strict mode for production
);
```

**Result Structure:**

```typescript
{
  state: 'PASS' | 'WARN' | 'FAIL',
  valid: boolean,
  issues: [
    {
      code: string,
      severity: 'error' | 'warning',
      message: string,
      field: string,
      value: any,
      suggestion: string,
    }
  ],
  summary: {
    total: number,
    errors: number,
    warnings: number,
  }
}
```

### Session Validation

```typescript
const result = CODValidator.validateSession(
  session, // Session object
  { strict: false }
);
```

### Dependency Graph Validation

```typescript
const result = CODValidator.validateDependencyGraph(
  taskGraph, // Record<taskId, dependencies[]>
  { strict: false }
);
```

## Validation States

| State    | Meaning                 | Action                         |
| -------- | ----------------------- | ------------------------------ |
| **PASS** | Valid, no issues        | ✅ Proceed with operation      |
| **WARN** | Valid but has warnings  | ⚠️ Proceed, but alert user     |
| **FAIL** | Invalid, cannot proceed | ❌ Return error, don't execute |

## Response Patterns

### On Validation Success

```typescript
if (validation.state === 'PASS') {
  // Proceed with the operation
  return {
    content: [{ type: 'text', text: 'Success!' }],
  };
}
```

### On Validation Warning

```typescript
if (validation.state === 'WARN') {
  // Proceed but inform user
  return {
    content: [
      {
        type: 'text',
        text: `⚠️ Warning: ${validation.issues[0]?.message}\n\nProceeding anyway...`,
      },
    ],
  };
}
```

### On Validation Failure

```typescript
if (validation.state === 'FAIL') {
  // Return error structure
  return {
    content: [
      {
        type: 'text',
        text: `❌ Validation failed!\n\n${validation.issues
          .map((i) => `• ${i.message}\n  Suggestion: ${i.suggestion}`)
          .join('\n')}`,
      },
    ],
    isError: true,
  };
}
```

## Real-World Examples

### Example 1: Task Next Actions (EP2)

```typescript
// Validate multiple tasks, filter out invalid ones
export async function taskNextActions(params: any) {
  const tasks = params.tasks || [];

  const validationMap = new Map();
  const validTasks = [];
  const failedTasks = [];

  // Validate each task
  for (const task of tasks) {
    const validation = CODValidator.validateTask(task);
    validationMap.set(task.id, validation);

    if (validation.state === 'FAIL') {
      failedTasks.push({
        id: task.id,
        reason: validation.issues[0]?.message,
      });
    } else {
      validTasks.push(task);
    }
  }

  // Return results
  return {
    content: [
      {
        type: 'text',
        text: `Valid tasks: ${validTasks.length}\nFailed: ${failedTasks.length}`,
      },
    ],
    structuredContent: {
      validTasks,
      failedTasks,
      validationMap: Object.fromEntries(validationMap),
    },
  };
}
```

### Example 2: Apply with Diff (EP3)

```typescript
// Atomic validation of all operations before execution
export async function applyWithDiff(params: any) {
  const operations = params.operations || [];

  // Validate ALL operations first
  const validationResults = operations.map((op) => ({
    op,
    validation: validateOperation(op), // Custom validation
  }));

  // Check if any failed
  const failed = validationResults.filter((r) => r.validation.state === 'FAIL');

  if (failed.length > 0) {
    // Entire batch rejected
    return {
      content: [
        {
          type: 'text',
          text: `❌ Batch rejected: ${failed.length} invalid operation(s)`,
        },
      ],
      isError: true,
    };
  }

  // All valid, execute operations
  // ... execution code ...
}
```

### Example 3: Resolve Blocker (EP4)

```typescript
// Validate blocker state consistency
export async function resolveBlocker(params: any) {
  const state = {
    id: params.blockerId,
    taskId: params.taskId,
    solution: params.solution,
  };

  const validation = CODValidator.validateBlockerResolution(state);

  if (validation.state === 'FAIL') {
    return {
      content: [
        {
          type: 'text',
          text: `❌ Cannot resolve blocker: ${validation.issues[0]?.message}`,
        },
      ],
      isError: true,
    };
  }

  // Proceed with resolution
  // ... resolution code ...
}
```

## Strict Mode

Use strict mode in production environments:

```typescript
// Development (permissive)
const result = CODValidator.validateTask(task, {}, { strict: false });
// Returns WARN for non-critical issues

// Production (strict)
const result = CODValidator.validateTask(task, {}, { strict: true });
// Returns FAIL for any issue (warnings become errors)
```

## Testing Validation

```typescript
import { describe, it, expect } from 'vitest';
import { CODValidator } from '@vault/cod';

describe('my-tool validation', () => {
  it('should reject invalid task', () => {
    const result = CODValidator.validateTask({
      id: 'task-1',
      title: 'Test',
      status: 'todo',
      priority: 15, // invalid: > 10
    });

    expect(result.state).toBe('FAIL');
    expect(result.issues[0]?.code).toBe('VALUE_OUT_OF_BOUNDS');
  });

  it('should pass valid task', () => {
    const result = CODValidator.validateTask({
      id: 'task-1',
      title: 'Test',
      status: 'todo',
      priority: 5,
    });

    expect(result.state).toBe('PASS');
    expect(result.valid).toBe(true);
  });
});
```

## Performance

| Operation                  | Time   | Notes           |
| -------------------------- | ------ | --------------- |
| Single task validation     | <0.1ms | Constant time   |
| 100 batch operations       | 0.01ms | Linear time     |
| 1000-task dependency graph | 0.73ms | Polynomial time |

**Rule:** Validation overhead is negligible (<1% of tool execution time)

## Common Errors & Fixes

### Error: Missing Required Field

```
Message: Task requires field: id
Suggestion: Provide a unique task identifier
```

**Fix:** Ensure all required fields are present before validation

### Error: Value Out of Bounds

```
Message: Priority out of bounds: 15
Suggestion: Priority must be between 0 and 10
```

**Fix:** Adjust value to valid range

### Error: Invalid Enum Value

```
Message: Task status invalid: invalid-status
Suggestion: Use one of: todo, in-progress, completed, blocked
```

**Fix:** Use valid status value

### Error: Self-Reference Detected

```
Message: Task cannot depend on itself: task-123
```

**Fix:** Remove self-reference from dependencies

### Warning: Blocked Status Without Blockers

```
Message: Task status is "blocked" but no blockers are recorded
Suggestion: Add blocker IDs or change status
```

**Fix:** Either add blockers or change status

## Validation Rules by Tool

| Tool                    | Validates  | Required Fields       |
| ----------------------- | ---------- | --------------------- |
| task_next_actions (EP2) | Tasks      | id, title, status     |
| apply_with_diff (EP3)   | Operations | type, search/line     |
| resolve_blocker (EP4)   | Blockers   | id, taskId, solution  |
| suggest_links (EP6)     | Links      | from, to, type        |
| metadata_model (EP8)    | Metadata   | path, action          |
| batch_move (EP9)        | Moves      | from, to, type        |
| plan_session (EP1)      | Sessions   | id, duration          |
| start_session (EP10)    | Sessions   | id, duration, taskIds |

## Reference Documentation

- **Core Validator:** `@vault/cod/validator/core.ts`
- **Type Definitions:** `@vault/cod/validator/types.ts`
- **Validation Spec:** `doc/COD_VALIDATION_SPEC.md`
- **Integration Tests:** `packages/cod-core/src/__tests__/integration.test.ts`
- **Live Test Results:** `doc/COD_VALIDATOR_LIVE_TEST_RESULTS.md`

## Next Steps

1. Add validation to your MCP tool using the pattern above
2. Write tests for validation scenarios
3. Test with both normal and strict modes
4. Deploy with confidence knowing data consistency is enforced
