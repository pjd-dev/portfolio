---
type: spec
status: draft
created: 2025-12-25
---

# COD Validation Spec

COD = **Cognitive Organizer & Operator**.

This spec defines the deterministic validation rules implemented in `@vault/cod`.

## Validation States

- **PASS**: Valid, safe to execute.
- **WARN**: Valid but degraded (caller may proceed with warning).
- **FAIL**: Invalid, must block execution.

Strict mode treats WARN as FAIL.

## Result Shape (Required)

```ts
{
  state: 'PASS' | 'WARN' | 'FAIL',
  valid: boolean,
  issues: ValidationIssue[],
  summary: { total: number, errors: number, warnings: number },
  status?: 'PASS' | 'WARN' | 'FAIL',
  reason?: string,
  warnings?: string[],
}
```

Compatibility fields (`status`, `reason`, `warnings`) are included for MCP adapters.

## Task Validation Rules

1. **Required fields**: `id`, `title`, `status` must exist. **FAIL** if missing.
2. **Status enum**: must be `todo`, `in-progress`, `completed`, or `blocked`. **FAIL** if invalid.
3. **Priority bounds**: `priority` must be 0-10 (inclusive). **FAIL** if out of bounds.
4. **Goal reference**: if `goal` is set and `goalsMap` is provided, the goal must exist. **FAIL** if missing.
5. **No self-dependencies**: `dependsOn` must not include its own `id`. **FAIL** if violated.
6. **No self-blockers**: `blockedBy` must not include its own `id`. **FAIL** if violated.

Warnings:

- **HIGH_RISK_CONFIGURATION**: more than 5 dependencies.
- **INVALID_STATUS_TRANSITION**: `status=blocked` but no blockers recorded.

## Session Validation Rules

1. **Positive duration**: `duration` must be > 0. **FAIL** if invalid.
2. **Has tasks**: empty `taskIds` is allowed but **WARN**.
3. **Capacity check**: if `totalEffort` and `focusCost` are provided, estimated work
   must fit the session duration. **WARN** if overbooked.

Current estimate formula:

```
estimatedMin = (totalEffort * 30 + focusCost * 10) * 1.2
```

## Dependency Graph Validation Rules

1. **No cycles**: any cycle in `dependsOn` is a **FAIL**.
2. **All references exist**: missing dependencies are a **WARN**.

## Determinism Requirements

- No I/O or external state.
- No wall-clock dependence.
- Same input yields the same output.
