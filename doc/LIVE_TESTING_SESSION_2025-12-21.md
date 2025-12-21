# Live Testing Session - 2025-12-21

## Objective

Execute end-to-end testing of the vault platform to validate:

1. All services operational and responsive
2. MCP tools with COD validation gating working correctly
3. Vault git sync functioning
4. Task graph and session planning integration
5. COD validation enforcing data consistency

## Test Environment

- **Platform:** Obsidian MCP + Vault + COD Validator
- **Services Running:** mcp (4000), vaulty, vault
- **Test Time:** 2025-12-21
- **Commit:** 621b44d (latest main)

---

## Test Suite 1: Service Connectivity

### 1.1 MCP Server Health Check

**Objective:** Verify MCP server is running and responding

```bash
# Test connectivity
curl -s http://localhost:4000/ | head -20
```

**Expected Response:** HTML page with MCP server info

---

## Test Suite 2: Task Graph Operations (COD Validated)

### 2.1 List All Tasks

**Tool:** `obsidian_task_graph`
**Purpose:** Build dependency graph and list all tasks

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "obsidian_task_graph",
    "arguments": {}
  },
  "id": 1
}
```

**Expected:**

- Returns all tasks with nodes and edges
- Shows graph statistics (total, done, blocked, unblocked)
- COD validation status included

**Success Criteria:**

- [ ] Response includes `nodes`, `edges`, `stats`
- [ ] No COD validation failures for basic graph
- [ ] Statistics populated correctly

---

### 2.2 Get Next Actions (EP2 - COD Validated)

**Tool:** `obsidian_task_next_actions`
**Purpose:** Get ranked unblocked tasks with validation

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "obsidian_task_next_actions",
    "arguments": {
      "max": 10,
      "maxFocusCost": 3
    }
  },
  "id": 2
}
```

**Expected:**

- Returns unblocked tasks only
- Each task passes or warns COD validation
- Tasks ranked by score (reward/(effort\*focusCost))
- Failed validation tasks filtered out

**Success Criteria:**

- [ ] Only unblocked tasks returned
- [ ] Validation map shows all tasks evaluated
- [ ] Failed validation tasks listed separately
- [ ] Score calculation is consistent

---

### 2.3 Get Task Dependencies

**Tool:** `obsidian_task_dependencies`
**Purpose:** Inspect dependency chains

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "obsidian_task_dependencies",
    "arguments": {
      "id": "task-1766350560055-tasks-mcp-validation-gating-comprehensive-2025-12-21-md",
      "direction": "both"
    }
  },
  "id": 3
}
```

**Expected:**

- Task details with upstream/downstream dependencies
- Cycle detection (if present)
- COD validation applied

**Success Criteria:**

- [ ] Correct upstream/downstream listed
- [ ] No cycles in graph
- [ ] Dependency validation passes

---

## Test Suite 3: Session Planning (COD Validated)

### 3.1 Plan Session (EP1 - COD Validated)

**Tool:** `obsidian_plan_session`
**Purpose:** Create optimized work session

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "obsidian_plan_session",
    "arguments": {
      "durationMinutes": 45,
      "maxFocusCost": 2
    }
  },
  "id": 4
}
```

**Expected:**

- Session created with tasks fitting duration
- COD validation performed on session state
- Tasks sorted by score and focus cost

**Success Criteria:**

- [ ] Session ID generated
- [ ] Task selection respects focus/duration constraints
- [ ] Validation status is PASS or WARN
- [ ] `plannedEffort` and `plannedReward` calculated

---

### 3.2 Start Session (EP10 - COD Validated)

**Tool:** `obsidian_start_session`
**Purpose:** Begin session with validation

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "obsidian_start_session",
    "arguments": {
      "sessionId": "[SESSION_ID_FROM_3.1]"
    }
  },
  "id": 5
}
```

**Expected:**

- Session status changes to "active"
- `startedAt` timestamp recorded
- COD validation gates session start
- If FAIL, returns blocking reasons

**Success Criteria:**

- [ ] Session status is "active"
- [ ] Start time recorded
- [ ] Validation passed (PASS/WARN)
- [ ] Session ready for task updates

---

## Test Suite 4: COD Validation Enforcement

### 4.1 Validate Task Data Integrity

**Purpose:** Verify COD validator rejects invalid tasks

**Test Data - Invalid Task:**

```json
{
  "id": "invalid-task",
  "title": "",
  "status": "invalid_status",
  "effort": -1,
  "path": ""
}
```

**Expected:**

- Validation returns FAIL status
- Reason code provided (e.g., "INVALID_STATUS")
- Invalid tasks filtered from operations

---

### 4.2 Validate Session State

**Purpose:** Ensure session validation prevents invalid starts

**Conditions to test:**

- Session with 0 tasks → WARN
- Session with too much focus cost → WARN
- Session with valid tasks → PASS

---

## Test Suite 5: Git Sync & Vault Operations

### 5.1 Check Git Sync Status

**Purpose:** Verify vault git sync working

```bash
# Check vault directory git status
cd ~/.config/obsidian/vault-sync && git log --oneline -5
```

**Expected:**

- Recent commits from vault service
- Sync interval working (30s)

---

### 5.2 Create a Test Task

**Tool:** Pipeline or direct file creation
**Purpose:** Verify task creation → git sync → task graph update

**Steps:**

1. Create new task file in vault
2. Wait 5 seconds for vault sync
3. Call `obsidian_task_graph` to verify task appears
4. Check git log for new commit

**Success Criteria:**

- [ ] Task appears in graph after sync delay
- [ ] Git commit recorded by vault service
- [ ] Task graph rebuilds to include new task

---

## Test Suite 6: Integration Scenarios

### 6.1 Full Workflow - Plan and Execute Session

**Scenario:** User plans work, starts session, completes tasks

**Steps:**

1. Call `obsidian_plan_session` → Get session ID
2. Call `obsidian_start_session` → Start work
3. Call `obsidian_task_next_actions` → Get work items
4. (Simulate) Update task status in vault
5. Call `obsidian_end_session` → Complete work

**Success Criteria:**

- [ ] Session progresses through states (planned → active → completed)
- [ ] All COD validations pass
- [ ] Task status updates reflected in graph
- [ ] Session metrics calculated

---

### 6.2 Dependency Blocking Scenario

**Scenario:** Task cannot start because dependency is incomplete

**Steps:**

1. Identify two dependent tasks (A depends on B)
2. Ensure B is "todo"
3. Call `obsidian_task_next_actions`
4. Verify A is NOT in unblocked list

**Success Criteria:**

- [ ] Blocked task filtered from next actions
- [ ] Dependency prevents task from being selectable
- [ ] Only leaf/unblocked tasks available

---

## Test Results Tracking

### Execution Log

| Test                     | Start Time | End Time | Status     | Notes |
| ------------------------ | ---------- | -------- | ---------- | ----- |
| 1.1 - MCP Health         |            |          | ⏳ Pending |       |
| 2.1 - Task Graph         |            |          | ⏳ Pending |       |
| 2.2 - Next Actions       |            |          | ⏳ Pending |       |
| 2.3 - Dependencies       |            |          | ⏳ Pending |       |
| 3.1 - Plan Session       |            |          | ⏳ Pending |       |
| 3.2 - Start Session      |            |          | ⏳ Pending |       |
| 4.1 - Task Validation    |            |          | ⏳ Pending |       |
| 4.2 - Session Validation |            |          | ⏳ Pending |       |
| 5.1 - Git Sync           |            |          | ⏳ Pending |       |
| 5.2 - Task Creation      |            |          | ⏳ Pending |       |
| 6.1 - Full Workflow      |            |          | ⏳ Pending |       |
| 6.2 - Dependency Block   |            |          | ⏳ Pending |       |

### Summary

- **Total Tests:** 12
- **Planned:** 12
- **Passed:** 0
- **Failed:** 0
- **Pending:** 12

---

## Success Criteria (Overall)

✅ **All Green Flags:**

- [ ] All 3 services running and responsive
- [ ] MCP tools responding with valid JSON
- [ ] COD validation gating operational on all EPs
- [ ] Next actions correctly filtered by validation
- [ ] Session planning respects constraints
- [ ] Git sync maintaining vault state
- [ ] No errors in service logs

---

## Notes & Observations

_(To be filled during testing)_

---

## Conclusion

_(To be filled after testing)_

**Status:** ⏳ Ready to Execute
**Next Step:** Run Test Suite 1 - Service Connectivity
