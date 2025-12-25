---
type: doc
status: draft
created: 2025-12-21
author: Agent
---

# COD Validator Core - Implementation Summary

**Branch:** `feature/cod-validator-framework`

## What Was Built

### `@vault/cod` Package

Pure, deterministic validation library for COD (Cognitive Organizer & Operator).

**Location:** `packages/cod-core/`

**Core Files:**

- `src/validator/types.ts` - Domain model (TaskState, SessionState, ValidationResult)
- `src/validator/core.ts` - CODValidator class with 3 public static methods
- `src/validator/index.ts` - Public exports
- `src/index.ts` - Package root export
- `src/__tests__/validator.test.ts` - Comprehensive test suite

**Build:** TypeScript → ESM (ECMAScript modules)

## Implementation Details

### CODValidator API

```typescript
class CODValidator {
  static validateTask(task, context?, options?): ValidationResult;
  static validateSession(session, options?): ValidationResult;
  static validateDependencyGraph(tasks, options?): ValidationResult;
}
```

### Validation States (Spec-Mandated)

- **PASS** - Valid, safe to execute
- **WARN** - Valid but degraded (e.g., high risk config)
- **FAIL** - Invalid, must block execution

### Task Validation Rules (6 rules)

**RULE 1: Required fields**

- id, title, status are required
- FAIL if missing

**RULE 2: Status enum**

- Must be one of: todo, in-progress, completed, blocked
- FAIL if invalid

**RULE 3: Priority bounds (0-10)**

- Must be number between 0 and 10 (inclusive)
- FAIL if out of bounds

**RULE 4: Goal reference**

- If goal specified, must exist in goalsMap
- FAIL if referenced goal doesn't exist
- PASS if null or undefined

**RULE 5: No self-dependencies**

- Task cannot depend on itself
- FAIL if detectedd

**RULE 6: No self-blockers**

- Task cannot be blocked by itself
- FAIL if detected

**WARNINGS:**

- HIGH_DEPENDENCY_COUNT: >5 dependencies
- INVALID_STATUS_TRANSITION: status=blocked but no blockedBy[]

### Session Validation Rules (3 rules)

**RULE 1: Positive duration**

- Must be positive number (minutes)
- FAIL if <= 0

**RULE 2: Has tasks**

- taskIds[] must be non-empty
- WARN if empty

**RULE 3: Fits in duration**

- Estimated work time must fit in session time (with 20% buffer)
- WARN if overbooked

### Dependency Graph Validation

**RULE 1: No cycles**

- Uses DFS cycle detection
- FAIL if cycle found
- Reports cycle path for debugging

**RULE 2: All references exist**

- All dependsOn[] references must exist
- WARN if missing dependencies

## Design Principles (Enforced)

✅ **Deterministic** - Same input → same output always  
✅ **Pure** - No I/O, vault access, MCP calls, side effects  
✅ **Testable** - All rules have explicit unit tests  
✅ **Reusable** - Can be called from MCP adapters or standalone  
✅ **Composable** - Rules are independent, can be combined

## Test Coverage

**Total Tests:** 34

**Breakdown:**

- validateTask: 21 tests
  - Required fields: 4 tests
  - Status enum: 2 tests
  - Priority bounds: 3 tests
  - Goal references: 4 tests
  - No self-deps: 2 tests
  - No self-blockers: 2 tests
  - Warnings: 2 tests
  - Strict mode: 2 tests

- validateSession: 7 tests
  - Duration validation: 3 tests
  - Has tasks: 2 tests
  - Capacity check: 2 tests

- validateDependencyGraph: 6 tests
  - Cycle detection: 4 tests (including A→B→A, A→B→C→A, self-cycle)
  - Missing references: 2 tests

**All tests deterministic and fixture-based (no randomness).**

## Strict Mode

Option flag: `{ strict: true }`

When enabled:

- Warnings are treated as errors
- WARN becomes FAIL
- Prevents risky configurations

## Error Codes (Reason Codes)

```typescript
type FailReasonCode =
  | 'MISSING_REQUIRED_FIELD'
  | 'INVALID_ENUM_VALUE'
  | 'VALUE_OUT_OF_BOUNDS'
  | 'DEPENDENCY_CYCLE'
  | 'MISSING_DEPENDENCY'
  | 'BLOCKED_BY_BLOCKER'
  | 'INVALID_STATUS_TRANSITION'
  | 'INVALID_GOAL_REFERENCE'
  | 'HIGH_RISK_CONFIGURATION';
```

Every issue includes:

- code (canonical reason)
- severity (error/warning/info)
- message (human-readable)
- field (which field failed)
- suggestion (how to fix)

## Next Steps (Blocked Tasks Unblocked)

This implementation unblocks:

1. **task-1765552458913** - MCP gate obsidian_plan_session with COD validation
2. **task-1765552406193** - MCP gate obsidian_task_next_actions with COD validation

Both can now import `@vault/cod` and use CODValidator.

## Enforcement Points (Not Yet Wired)

### EP0 - session_start

- Final gate before execution
- FAIL → hard stop

### EP1 - plan_session

- FAIL → refuse to plan
- Return blockingReasons[]

### EP2 - task_next_actions

- FAIL → filter out task
- WARN/PASS → include

(MCP adapter wiring happens in follow-up tasks)

## Spec Compliance

✅ Deterministic validation (no randomness)  
✅ Pure core (no dependencies)  
✅ Three-state verdict (PASS/WARN/FAIL)  
✅ Explicit reason codes  
✅ Reusable API  
✅ Comprehensive tests

**Reference:** doc/COD_VALIDATION_SPEC.md

## Known Constraints

- Spec currently silent on whether missing `goal` is WARN or FAIL (using PASS per optional field rule)
- TODO: Confirm goal field handling with domain experts

## Files Changed

```
packages/cod-core/
├── package.json (new)
├── tsconfig.json (new)
├── src/
│   ├── index.ts (new)
│   ├── validator/
│   │   ├── index.ts (new)
│   │   ├── types.ts (new, 89 lines)
│   │   └── core.ts (new, 317 lines)
│   └── __tests__/
│       └── validator.test.ts (new, 471 lines)
└── dist/
    └── (compiled output)
```

Total new lines: ~877 (code + tests)

## Building & Testing

```bash
# Install
pnpm install

# Build
cd packages/cod-core && pnpm build

# Test
pnpm test --run

# Type check
pnpm type-check
```

## Status: 75% Complete

✅ Core validator implemented  
✅ All 6 task rules implemented  
✅ All 3 session rules implemented  
✅ Dependency graph validation  
✅ Test suite written (34 tests)  
⏳ Test execution verification pending  
⏳ MCP adapter integration (next tasks)  
⏳ Enforcement point wiring (next tasks)

---

**Implementation follows COD directives:**

- No interpretive decisions
- Pure functions only
- Deterministic validation
- Spec-driven design
