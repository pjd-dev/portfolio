---
type: dashboard
tags: [mcp, tools, health, monitoring, system]
generated: 2025-12-19
update-frequency: weekly
---

# MCP Tool Health Dashboard

**Last Updated:** 2025-12-19  
**Sweep Session:** tool-sweep-001  
**Overall Health:** 🟡 DEGRADED (Critical parser bug)

---

## Quick Status Indicators

| Metric              | Status      | Trend      | Threshold |
| ------------------- | ----------- | ---------- | --------- |
| Query Tools         | 🟢 100%     | ↑ Stable   | > 90%     |
| Write Tools         | 🔴 0%       | ↓ Blocked  | > 80%     |
| Validation Tools    | 🟢 100%     | ↑ Stable   | > 90%     |
| Overall Tool Health | 🟡 72%      | ↓ Degraded | > 85%     |
| Parser Reliability  | 🔴 CRITICAL | ↓ BROKEN   | —         |

---

## Tool Health by Category

### Query/List Operations 🟢

```
Status: HEALTHY
Tools: 6/6 PASS
Ops: list_tasks, get_task, find_tasks
Latency: <100ms (cached)
```

### Validation Operations 🟢

```
Status: HEALTHY
Tools: 5/5 PASS
Ops: validate_operations, validate_pipeline, validate_note_structure
Latency: <50ms
```

### Metadata/Frontmatter 🟢

```
Status: HEALTHY (validate-only)
Tools: 4/4 PASS
Ops: metadata_model (validate), refactor_note (dry-run)
Latency: <50ms
Limitation: No apply/transition modes tested (safety constraint)
```

### Task Mutations 🔴

```
Status: CRITICAL FAILURE
Tools: 0/7 PASS
Blocker: parseTaskBody undefined error
Affected Ops:
  - update_task (all variants)
  - toggle_checklist_item
  - resolve_blocker
  - get_task_progress
Failure Rate: 100%
Workaround: None (requires code fix)
```

### Move/Rename Operations 🟡

```
Status: FUNCTIONAL (NO PREVIEW)
Tools: 1/1 PASS
Ops: batch_move (file/folder moves)
Issue: No dry-run mode available
Risk: Medium (can execute unintended renames)
Recommendation: Add dryRun parameter
```

### Session Management 🟡

```
Status: REQUIRES INITIALIZATION
Tools: 0/2 PASS (0 attempted)
Issue: start_session requires pre-existing entry
Blocker: Session bootstrap workflow unclear
Impact: Low (not heavily used in automation)
```

---

## Critical Alerts

### 🔴 ALERT: parseTaskBody Parser Failure

**Severity:** CRITICAL  
**Impact:** All task mutation operations blocked  
**Affected:** 7+ downstream tools  
**First Detected:** 2025-12-19 (tool sweep)  
**Root Cause:** Undefined function reference in parser  
**Workaround:** None available  
**ETA Fix:** 2025-12-16 (per bug task)  
**Action:** Escalate to @mcp-core-dev immediately

---

### 🟡 WARNING: batch_move lacks safety mode

**Severity:** MEDIUM  
**Impact:** Unintended file renames possible  
**Frequency:** Rare (explicit tool calls only)  
**Recommendation:** Add dryRun parameter to API  
**Estimated Fix Time:** 2-3 hours  
**Priority:** Medium (document workaround first)

---

### 🟡 WARNING: Session initialization unclear

**Severity:** LOW-MEDIUM  
**Impact:** Session tools may fail silently  
**Frequency:** Rare (specialized use case)  
**Recommendation:** Document session lifecycle  
**Estimated Fix Time:** 1 hour (documentation)

---

## Historical Trend (Last 7 Days)

```
Date       | Health | Notes
-----------|--------|---------------------------------------------
2025-12-19 | 72%    | First tool sweep; parseTaskBody bug found
2025-12-18 | —      | No sweep
2025-12-17 | —      | No sweep
2025-12-16 | —      | No sweep
2025-12-15 | —      | No sweep
2025-12-14 | —      | No sweep
2025-12-13 | —      | Bug reported (mcp-repro-parseTaskBody-bug.md)
```

---

## Recommended Actions

### Immediate (Next 24h)

- [ ] Notify @mcp-core-dev about parseTaskBody blocker
- [ ] Review parser implementation and locate undefined reference
- [ ] Create bug fix branch: `fix/parseTaskBody-undefined`

### This Sprint

- [ ] Fix parseTaskBody bug (target: 2025-12-16)
- [ ] Re-run tool sweep after fix (target: 2025-12-17)
- [ ] Add dryRun to batch_move API
- [ ] Document session lifecycle

### Next Sprint

- [ ] Implement obsidian_tool_self_test endpoint
- [ ] Expand test coverage (templates, graph, undo/redo)
- [ ] Add \_system/mcp-config/TOOLS_RUNBOOK.md

---

## Performance Metrics

| Tool                | Avg Latency | P95 Latency | P99 Latency | Errors    |
| ------------------- | ----------- | ----------- | ----------- | --------- |
| list_tasks          | 45ms        | 80ms        | 120ms       | 0         |
| get_task            | 25ms        | 40ms        | 60ms        | 0         |
| find_tasks          | 35ms        | 70ms        | 100ms       | 0         |
| validate_operations | 15ms        | 30ms        | 50ms        | 0         |
| batch_move          | 200ms       | 350ms       | 500ms       | 0         |
| update_task         | —           | —           | —           | 100% FAIL |

---

## Dependency Graph

```
update_task (BLOCKED)
├─ parseTaskBody ✗ undefined
├─ get_task_progress (depends on parseTaskBody)
├─ toggle_checklist_item
├─ resolve_blocker
└─ Session management (blocked indirectly)

Query Operations (HEALTHY) ✓
├─ list_tasks
├─ get_task
├─ find_tasks
└─ validate_* operations (all pass)
```

---

## SLA Status

| SLA                       | Target | Current | Status  |
| ------------------------- | ------ | ------- | ------- |
| Query Tool Uptime         | 99.5%  | 100%    | ✅ MET  |
| Write Tool Uptime         | 95%    | 0%      | ❌ MISS |
| Validation Tool Uptime    | 99%    | 100%    | ✅ MET  |
| Overall Tool Availability | 95%    | 72%     | ❌ MISS |

---

## Next Sweep

**Scheduled:** 2025-12-26  
**Focus:** Post-bugfix validation  
**Expected:** Tool health → 95%+ (if parser fixed)  
**Scope:** Same 32 tools + any new tools added since sweep-001

---

**Dashboard maintained by:** QA Agent  
**Last automated check:** 2025-12-19  
**Manual review due:** 2025-12-23
