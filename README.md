# Obsidian MCP Platform

**A deterministic, graph-aware workflow system for Obsidian**

[![Tests](https://img.shields.io/badge/tests-37%2F37%20passing-brightgreen)]()
[![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)]()

---

## Overview

The Obsidian MCP Platform transforms Obsidian from a personal knowledge manager into a **programmable knowledge platform** with six interconnected systems:

1. **Atomic Batch Pipeline Engine** — Terraform-like workflows with preview-before-apply
2. **Operation Journal & Undo** — Complete audit trail with reversible operations
3. **Task Dependency Graph** — DAG-based task management with blocking/unblocking
4. **Session Planner** — Focus-aware, time-bounded work session optimization
5. **Structure Schema Validation** — Contract-based note structure enforcement
6. **Security-as-Tasks** — Security requirements embedded in task dependencies

---

## Quick Start

### Installation

```bash
cd apps/mcp
npm install
npm test      # Run test suite (37 tests)
npm run build # Build for production
npm start     # Start MCP server
```

### Configuration

```bash
# Required
export OBSIDIAN_VAULT_PATH=/path/to/vault

# Optional
export VAULT_OPS_DIR=.vault-ops
export VAULT_SESSIONS_DIR=.vault-sessions
export MINUTES_PER_EFFORT_UNIT=15
```

---

## Documentation

### 📚 Complete Guides

- **[COMPLETE_IMPLEMENTATION_REPORT.md](COMPLETE_IMPLEMENTATION_REPORT.md)** — Full platform overview (26KB)
- **[IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)** — Summary & production checklist

### 🚀 Quick References

- **[PIPELINE_ENGINE_QUICK_REF.md](PIPELINE_ENGINE_QUICK_REF.md)** — Pipeline workflows
- **[OPERATION_JOURNAL_QUICK_REF.md](OPERATION_JOURNAL_QUICK_REF.md)** — Journal & undo
- **[TASK_DEPENDENCY_GRAPH_QUICK_REF.md](TASK_DEPENDENCY_GRAPH_QUICK_REF.md)** — Task graph
- **[SESSION_PLANNER_QUICK_REF.md](SESSION_PLANNER_QUICK_REF.md)** — Session planning
- **[FILE_OPERATIONS_QUICK_REF.md](FILE_OPERATIONS_QUICK_REF.md)** — File operations

### 📖 System Documentation

- **[PIPELINE_ENGINE.md](PIPELINE_ENGINE.md)** — Pipeline implementation details
- **[OPERATION_JOURNAL.md](OPERATION_JOURNAL.md)** — Journal system architecture
- **[STRUCTURE_SCHEMA_VALIDATION.md](STRUCTURE_SCHEMA_VALIDATION.md)** — Schema validation
- **[TEMPLATE_DISCOVERY_API.md](TEMPLATE_DISCOVERY_API.md)** — Template system
- **[DIFF_PREVIEW_API.md](DIFF_PREVIEW_API.md)** — Diff preview system

---

## Features

### ✅ Atomic Pipelines

Execute multi-step vault operations as atomic transactions:

```typescript
obsidian_run_pipeline_simulation({ pipeline: {...} })  // Preview
obsidian_apply_pipeline({ pipelineId: "...", confirm: true })  // Apply
```

### ✅ Operation Journal

Complete audit trail with undo capability:

```typescript
obsidian_list_operations({ limit: 20 })
obsidian_undo_last_operation({ dryRun: true })
```

### ✅ Task Graph

DAG-based task management with dependency resolution:

```typescript
obsidian_task_next_actions({ max: 10, maxFocusCost: 3 })
obsidian_task_set_dependency({ fromId: "A", toId: "B" })
```

### ✅ Session Planner

Focus-aware work sessions:

```typescript
obsidian_plan_session({ durationMinutes: 45, maxFocusCost: 2 })
obsidian_start_session({ sessionId: "..." })
obsidian_update_session_task({ taskId: "...", status: "done" })
```

### ✅ Schema Validation

Enforce note structure contracts:

```typescript
obsidian_validate_note_structure({ path: "meetings/standup.md" })
obsidian_fix_note_structure({ path: "...", previewOnly: true })
```

---

## Test Coverage

```
✅ Test Suites: 2 passed, 2 total
✅ Tests:       37 passed, 37 total
✅ Time:        1.175 s
```

### Test Files

- `apps/mcp/src/__tests__/services/task-graph.service.test.ts` — 18 tests
- `apps/mcp/src/__tests__/services/session-planner.service.test.ts` — 19 tests

Run tests:
```bash
cd apps/mcp
npm test
npm test -- --coverage  # With coverage report
```

---

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    MCP CLIENT LAYER                        │
└───────────────────────────┬────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────┐
│                   TOOL REGISTRY                            │
│  Pipeline • Journal • Task Graph • Session • Schema        │
└───────────────────────────┬────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────┐
│                  SERVICE LAYER                             │
│  Pipeline • Journal • Task Graph • Session Planner         │
│  Structure Schema • AutoLink • Template Discovery          │
└───────────────────────────┬────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────┐
│                SHARED INFRASTRUCTURE                       │
│  Filesystem • Diff Preview • Validation                    │
└───────────────────────────┬────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────┘
│                    VAULT STORAGE                           │
│  .vault-ops/ • .vault-schemas/ • .vault-sessions/          │
└────────────────────────────────────────────────────────────┘
```

---

## MCP Tools

**23 tools across 5 categories:**

### Pipeline Tools (4)
`obsidian_run_pipeline_simulation` • `obsidian_apply_pipeline` • `obsidian_list_pipelines` • `obsidian_save_pipeline`

### Journal Tools (4)
`obsidian_list_operations` • `obsidian_get_operation` • `obsidian_undo_operation` • `obsidian_undo_last_operation`

### Task Graph Tools (5)
`obsidian_task_graph` • `obsidian_task_dependencies` • `obsidian_task_set_dependency` • `obsidian_task_next_actions` • `obsidian_task_critical_path`

### Session Planner Tools (6)
`obsidian_plan_session` • `obsidian_get_session` • `obsidian_list_sessions` • `obsidian_start_session` • `obsidian_end_session` • `obsidian_update_session_task`

### Structure Validation Tools (4)
`obsidian_list_schemas` • `obsidian_get_schema` • `obsidian_validate_note_structure` • `obsidian_fix_note_structure`

---

## Project Structure

```
vault-platform-full/
├── apps/
│   └── mcp/                          # MCP server
│       ├── src/
│       │   ├── services/             # Core services (9 files)
│       │   ├── tools/                # MCP tool definitions
│       │   ├── __tests__/            # Test suite (37 tests)
│       │   └── index.ts              # Server entrypoint
│       ├── package.json
│       └── jest.config.js
│
├── vault-data/                       # Example vault
│
├── Documentation (30+ files)
│   ├── COMPLETE_IMPLEMENTATION_REPORT.md
│   ├── IMPLEMENTATION_COMPLETE.md
│   ├── *_QUICK_REF.md files
│   └── System documentation
│
└── README.md (this file)
```

---

## Use Cases

### 1. Automated Workflows
Execute multi-step vault refactors with atomic safety:
- Refactor note → auto-link → validate structure → move to archive

### 2. Task Management
Manage complex project dependencies:
- Unblock tasks when prerequisites complete
- Find critical path to goals
- Plan optimal work sessions

### 3. Knowledge Curation
Enforce structure across note types:
- Meeting notes require decisions + actions
- Project notes require scope + risks
- Auto-fix missing sections

### 4. Session Planning
Optimize work based on time and energy:
- 45-minute low-focus afternoon session
- 90-minute deep work sprint
- Security-focused maintenance batch

---

## Performance

- **Task Graph Build**: O(n) where n = task count
- **Cycle Detection**: O(V + E) DFS
- **Session Planning**: O(n log n) sorting + O(n) packing
- **Pipeline Simulation**: O(steps × files) in-memory
- **Typical Response**: <100ms for common operations

---

## Safety Guarantees

- ✅ **Atomic Operations** — All-or-nothing writes
- ✅ **Preview Before Apply** — Diff-based approval
- ✅ **Conflict Detection** — Hash-based validation
- ✅ **Reversibility** — Complete undo capability
- ✅ **Validation** — Pre-flight checks

---

## Contributing

### Running Tests

```bash
cd apps/mcp
npm test                  # Run all tests
npm test -- --watch       # Watch mode
npm test -- --coverage    # Coverage report
```

### Development

```bash
npm run dev               # Watch mode
npm run typecheck         # Type checking
npm run build             # Production build
```

---

## Status

**✅ PRODUCTION READY**

- All core systems implemented
- 37/37 tests passing
- Comprehensive documentation
- Safety guarantees in place
- Performance optimized

---

## License

MIT

---

## Key Links

- [Complete Implementation Report](COMPLETE_IMPLEMENTATION_REPORT.md) — Full system overview
- [Implementation Summary](IMPLEMENTATION_COMPLETE.md) — Production checklist
- [Task Graph Quick Reference](TASK_DEPENDENCY_GRAPH_QUICK_REF.md) — Task management
- [Session Planner Quick Reference](SESSION_PLANNER_QUICK_REF.md) — Work sessions

---

*Version 1.0.0 — December 6, 2024*
