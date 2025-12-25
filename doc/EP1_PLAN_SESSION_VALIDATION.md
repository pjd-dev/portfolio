---
type: doc
status: draft
created: 2025-12-21
author: Agent
---

# EP1 Implementation - plan_session Validation Gate

**Enforcement Point 1 (EP1)** - Validation gate for `obsidian_plan_session` MCP tool

## What Was Implemented

### Location

`apps/mcp/src/mcp/obsidian/tools/session-planner.ts` - Updated PlanSessionTool

### Integration

- Added import: `import { CODValidator, type TaskState } from '@vault/cod';`
- Calls CODValidator before planning session
- Validates session parameters and selected tasks

## EP1 Behavior (Spec-Compliant)

### Gate 1: Session Parameter Validation

**When:** Before calling planSession service  
**What:** Validate session input parameters (duration, etc.)  
**If FAIL:**

- Refuse to plan
- Return human-readable blocking reasons
- Do NOT invent fallback tasks
- Return blockingReasons array with reason codes

**If PASS/WARN:**

- Proceed to planning

### Gate 2: Task Validation (Post-Planning)

**When:** After getting selected tasks  
**What:** Validate each task in the planned session  
**If any task FAILS:**

- Block session creation
- Return list of failing task IDs + reason codes
- Do NOT create partial sessions

**If all PASS/WARN:**

- Create and return session normally

## Response Structure

### Success (All validations pass)

```json
{
  "content": [{ "type": "text", "text": "# Work Session Planned..." }],
  "structuredContent": { "session": {...} }
}
```

### Blocked (FAIL state)

```json
{
  "content": [{ "type": "text", "text": "# ❌ Cannot Plan Session..." }],
  "structuredContent": {
    "blockingReasons": ["REASON_CODE_1", "REASON_CODE_2"],
    "validationState": "FAIL",
    "issues": [...]
  }
}
```

## Validation Rules Applied

### Session Validation

1. **Duration > 0** (required positive)
2. **Has tasks** (after planning)
3. **Effort fits** (estimated work ≤ duration + 20% buffer)

### Task Validation

1. Required fields (id, title, status)
2. Valid status enum
3. Priority in bounds (0-10)
4. No self-dependencies
5. No self-blockers

### Dependency Graph Check

- All dependencies exist (references valid)
- No cycles detected

## Code Example

```typescript
// EP1 Gate: Validate session parameters
const sessionValidation = CODValidator.validateSession({
  id: 'temp-session',
  duration: durationMinutes,
  taskIds: [],
  totalEffort: 0,
  totalReward: 0,
  focusCost: maxFocusCost ?? 0,
}, { strict: false });

// If FAIL, refuse to plan
if (sessionValidation.state === 'FAIL') {
  return {
    blockingReasons: sessionValidation.issues.map(i => i.code),
    validationState: 'FAIL'
  };
}

// ... proceed with planning ...

// EP1 Continued: Validate selected tasks
for (const task of result.session.tasks) {
  const validation = CODValidator.validateTask(task);
  if (validation.state === 'FAIL') {
    // Block session creation
    return { blockingReasons: [...] };
  }
}
```

## Strict Mode

Uses `{ strict: false }` to allow WARN state but block FAIL state.

- PASS → proceed
- WARN → proceed (allowed)
- FAIL → refuse (hard stop)

## Next Steps (Unblocked)

This unblocks:

- **EP2** - `task_next_actions` validation gate
- **EP0** - `session_start` final validation gate

Both can now import and use the same CODValidator.

## Files Modified

- `apps/mcp/src/mcp/obsidian/tools/session-planner.ts`
  - Added CODValidator import (1 line)
  - Added validation gate logic (80 lines)
  - Validation happens before planning and after task selection

## Status: Complete ✅

- ✅ EP1 validation gate implemented
- ✅ Session parameter validation
- ✅ Task validation in selected session
- ✅ Proper blocking behavior (FAIL → refuse)
- ✅ BlockingReasons returned to user
- ✅ Spec-compliant (no fallbacks, explicit failures)

---

**Reference:** Projects/COD/10-Enforcement-Points.md
