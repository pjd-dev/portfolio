---
type: spec
status: draft
version: 1.0.0
tags: [mcp, parser, fix, parseTaskBody, bug, codegen]
created: 2025-12-19
priority: critical
effort-estimate: 1-2 hours
---

# COD/09: MCP parseTaskBody Parser Export Fix

**Title:** Export parseTaskBody from get_task.ts for cross-tool reuse  
**Issue:** `Cannot read properties of undefined (reading 'parseTaskBody')`  
**Severity:** CRITICAL — Blocks all `update_task` and dependent operations  
**Root Cause:** parseTaskBody function is local, not exported  
**Impact:** 7 tools blocked; task mutations impossible

---

## Problem Statement

The MCP tools `update_task`, `task_metrics`, and `task_rewards` attempt to dynamically import and call `parseTaskBody()` from `get_task.ts` to compute task metrics after mutations. However:

1. **parseTaskBody is not exported** from `get_task.ts`
2. **Dynamic import fails** — `import('./get_task.js')` only gets the default export (`GetTaskTool`)
3. **undefined reference error** — All callers receive `undefined` instead of the function
4. **All task mutations blocked** — Any call to `update_task` with mutation options throws immediately

### Error Evidence

```
Cannot read properties of undefined (reading 'parseTaskBody')

Call Chain:
  update_task({ addHistoryNote: "test" })
    → importedModule.default.parseTaskBody is undefined
    → Throw error
    → Task not updated
```

---

## Affected Tools

| Tool           | File                                              | Import Line  | Status                |
| -------------- | ------------------------------------------------- | ------------ | --------------------- |
| `update_task`  | `apps/mcp/src/mcp/obsidian/tools/update_task.ts`  | 184          | BLOCKED               |
| `task_metrics` | `apps/mcp/src/mcp/obsidian/tools/task_metrics.ts` | 37, 120, 199 | BLOCKED               |
| `task_rewards` | `apps/mcp/src/mcp/obsidian/tools/task_rewards.ts` | 115, 200     | BLOCKED               |
| `get_task`     | `apps/mcp/src/mcp/obsidian/tools/get_task.ts`     | —            | SOURCE (needs export) |

---

## Solution Design

### Option A: Named Export (Recommended)

Export `parseTaskBody` as a named export from `get_task.ts`. Callers import it explicitly.

**Pros:**

- ✅ Explicit, IDE-discoverable imports
- ✅ Tree-shakeable in bundlers
- ✅ Easier to test in isolation
- ✅ Backwards-compatible (default export unchanged)

**Cons:**

- Requires updating 4 import statements

### Option B: Default Export Property

Attach `parseTaskBody` to the default export object.

**Pros:**

- ✅ Single import location
- ✅ Mirrors current import pattern

**Cons:**

- ❌ Couples parser to tool definition
- ❌ Less clean API

### Option C: Separate Parser Module

Extract `parseTaskBody` to `core/task-parser.ts`, export from there.

**Pros:**

- ✅ Cleanest separation of concerns
- ✅ Reusable by non-MCP code
- ✅ Future-proof architecture

**Cons:**

- ❌ Requires new module + refactor
- ❌ Out of scope for quick fix

**Selected:** **Option A** — Fast, minimal, correct.

---

## Implementation Steps

### Step 1: Export parseTaskBody from get_task.ts

**File:** `apps/mcp/src/mcp/obsidian/tools/get_task.ts`

Add named export after function definition:

```typescript
/**
 * Parse task note body into structured Task object
 * @internal Exported for use by task mutation tools (update_task, task_metrics, etc.)
 */
export function parseTaskBody(content: string, frontmatter: any): Task {
  // ... existing implementation ...
}
```

**Location:** After line 17 function definition, before line 180 (export const GetTaskTool)

### Step 2: Update update_task.ts Import

**File:** `apps/mcp/src/mcp/obsidian/tools/update_task.ts`

**Current (line 184-186):**

```typescript
const {
  default: { parseTaskBody },
} = (await import('./get_task.js')) as any;
```

**New:**

```typescript
const { parseTaskBody } = await import('./get_task.js');
```

### Step 3: Update task_metrics.ts Imports

**File:** `apps/mcp/src/mcp/obsidian/tools/task_metrics.ts`

Three locations need update (lines 37, 120, 199):

**Current pattern:**

```typescript
default: { parseTaskBody },
```

**New pattern:**

```typescript
parseTaskBody,
```

### Step 4: Update task_rewards.ts Imports

**File:** `apps/mcp/src/mcp/obsidian/tools/task_rewards.ts`

Two locations need update (lines 115, 200):

**Current pattern:**

```typescript
default: { parseTaskBody },
```

**New pattern:**

```typescript
parseTaskBody,
```

---

## Testing Plan

### Unit Test

```typescript
// Test that parseTaskBody is exported
import { parseTaskBody } from './get_task.ts';

const task = parseTaskBody('# Content', { title: 'Test', type: 'task' });
assert(task.title === 'Test');
assert(task.id);
```

### Integration Test

```typescript
// Run each blocked tool with minimal fixture
1. update_task(path, { addHistoryNote: "test" })
   → Expect: task updated, history logged, no error

2. task_metrics.query(path)
   → Expect: metrics computed and returned

3. task_rewards.query(path, { milestone: 50 })
   → Expect: reward added, metrics updated
```

### Validation Checklist

- [ ] `export function parseTaskBody` added to get_task.ts
- [ ] All 4 import statements updated (update_task, task_metrics x2, task_rewards x2)
- [ ] TypeScript compiles without errors
- [ ] Tool sweep re-run: all 7 blocked tools now PASS
- [ ] Existing tests pass (if any)

---

## Rollout Plan

### Phase 1: Implementation (30 min)

- Apply changes to 5 files
- Verify TypeScript compilation
- Test locally against vault

### Phase 2: Verification (30 min)

- Run tool sweep (tool_sweep_report.md test suite)
- Verify all 7 blocked tools now functional
- Check vault sync works correctly

### Phase 3: Documentation (15 min)

- Update TOOL_SWEEP_REPORT.md with fix status
- Mark parseTaskBody bug as RESOLVED
- Update TOOL_HEALTH_DASHBOARD.md

### Phase 4: Deploy

- Commit and push to main branch
- Trigger CI/CD (if any)
- Monitor MCP server logs for errors

---

## Risk Assessment

| Risk                               | Likelihood | Impact | Mitigation                              |
| ---------------------------------- | ---------- | ------ | --------------------------------------- |
| Export changes break existing code | LOW        | MEDIUM | Check all imports; TypeScript validates |
| Import statement syntax errors     | LOW        | LOW    | Manual review + compile check           |
| Metrics calculation fails          | LOW        | MEDIUM | Tool sweep validates all outputs        |
| Type mismatch on imported function | MEDIUM     | LOW    | TypeScript strict mode catches          |

**Overall Risk:** LOW (isolated, well-scoped change)

---

## Success Criteria

✅ `parseTaskBody` is exported from get_task.ts  
✅ All 4 import sites updated to use named import  
✅ TypeScript compilation succeeds with no errors  
✅ Tool sweep: 7 previously-blocked tools now PASS  
✅ All downstream tools (update_task, task_metrics, task_rewards) functional  
✅ Existing get_task functionality unchanged

---

## References

- **Bug Report:** `tasks/mcp-repro-parseTaskBody-bug.md`
- **Tool Sweep:** `_system/mcp-config/TOOL_SWEEP_REPORT.md`
- **Source Files:**
  - [get_task.ts](apps/mcp/src/mcp/obsidian/tools/get_task.ts#L17)
  - [update_task.ts](apps/mcp/src/mcp/obsidian/tools/update_task.ts#L184)
  - [task_metrics.ts](apps/mcp/src/mcp/obsidian/tools/task_metrics.ts)
  - [task_rewards.ts](apps/mcp/src/mcp/obsidian/tools/task_rewards.ts)

---

**Spec Status:** READY FOR IMPLEMENTATION  
**Author:** QA Agent (Tool Sweep)  
**Reviewed By:** —  
**Approved By:** —
