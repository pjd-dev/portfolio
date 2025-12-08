# Session Planner — Quick Reference

## Core Concept

Time-bounded, focus-aware work sessions built from task graph optimization.

## Session Model

```typescript
interface WorkSession {
  id: string;                    // UUID
  status: "planned" | "active" | "completed" | "aborted";
  
  params: {
    durationMinutes: number;     // Time budget
    maxFocusCost?: number;       // Focus ceiling
    projectId?: string;
    tags?: string[];
    maxTasks?: number;
  };
  
  totals: {
    plannedEffort: number;
    plannedReward: number;
    plannedTasks: number;
    actualEffort?: number;       // After completion
    actualReward?: number;
  };
  
  tasks: SessionTask[];
}
```

## MCP Tools

### `obsidian_plan_session`

Create optimized work session.

```json
{
  "durationMinutes": 45,
  "maxFocusCost": 2,
  "projectId": "project-alpha",
  "tags": ["urgent"],
  "maxTasks": 5
}
```

**Algorithm**:
1. Get unblocked tasks from graph
2. Filter by `focusCost <= maxFocusCost`
3. Score: `reward / (effort * focusCost)`
4. Greedily pack into time budget

Returns:
```json
{
  "session": {
    "id": "sess_20241206_001",
    "status": "planned",
    "tasks": [...]
  },
  "notePath": "sessions/2024-12-06-session.md"
}
```

### `obsidian_get_session`

Retrieve session by ID.

```json
{
  "id": "sess_20241206_001"
}
```

### `obsidian_list_sessions`

Browse sessions.

```json
{
  "status": ["active", "planned"],
  "since": "2024-12-01T00:00:00Z",
  "limit": 20
}
```

### `obsidian_start_session`

Begin session timer.

```json
{
  "sessionId": "sess_20241206_001"
}
```

Updates: `status = "active"`, `startedAt = now`

### `obsidian_end_session`

Complete session.

```json
{
  "sessionId": "sess_20241206_001",
  "status": "completed"
}
```

Computes `actualEffort` and `actualReward` from done tasks.

### `obsidian_update_session_task`

Mark task progress.

```json
{
  "sessionId": "sess_20241206_001",
  "taskId": "task_123",
  "status": "done",
  "syncTaskStatus": true
}
```

**`syncTaskStatus = true`**: Also updates task note frontmatter.

## Task Selection

### Effort Budget

```
maxEffort = durationMinutes / minutesPerEffortUnit
```

Default: `minutesPerEffortUnit = 15`

Example:
- 45 minutes → 3 effort units
- 90 minutes → 6 effort units

### Scoring Formula

```
score = reward / (effort * focusCost)
```

**Higher score = higher priority**

Example:
- Task A: reward=10, effort=2, focus=2 → score = 10/(2*2) = 2.5
- Task B: reward=12, effort=4, focus=3 → score = 12/(4*3) = 1.0
- Task C: reward=5, effort=1, focus=1 → score = 5/(1*1) = 5.0

Order: C, A, B

### Greedy Packing

1. Sort candidates by score (descending)
2. Pick tasks until effort budget exhausted
3. Stop at `maxTasks` if specified

## Common Workflows

### Plan Low-Focus Session

```bash
obsidian_plan_session({
  durationMinutes: 45,
  maxFocusCost: 2,
  projectId: "project-alpha"
})
```

Good for afternoons or low-energy states.

### Plan High-Intensity Sprint

```bash
obsidian_plan_session({
  durationMinutes: 90,
  maxFocusCost: 5,
  tags: ["urgent", "high-impact"]
})
```

### Security-Focused Session

```bash
obsidian_plan_session({
  durationMinutes: 60,
  tags: ["security"],
  maxTasks: 3
})
```

### Full Session Lifecycle

```bash
# 1. Plan
const { session } = obsidian_plan_session({
  durationMinutes: 45,
  maxFocusCost: 3
});

# 2. Start
obsidian_start_session({ sessionId: session.id });

# 3. Work + mark tasks
for (task of session.tasks) {
  // Do work...
  obsidian_update_session_task({
    sessionId: session.id,
    taskId: task.taskId,
    status: "done",
    syncTaskStatus: true
  });
}

# 4. End
const final = obsidian_end_session({
  sessionId: session.id,
  status: "completed"
});

# 5. Review stats
console.log(final.session.totals);
// { actualEffort: 3, actualReward: 15, ... }
```

## Session Storage

```
.vault-sessions/
  2024-12-06_session_<uuid>.json
```

Example:
```json
{
  "id": "sess_20241206_001",
  "createdAt": "2024-12-06T10:00:00Z",
  "startedAt": "2024-12-06T10:05:00Z",
  "endedAt": "2024-12-06T10:50:00Z",
  "status": "completed",
  "params": {
    "durationMinutes": 45,
    "maxFocusCost": 2
  },
  "totals": {
    "plannedEffort": 3,
    "plannedReward": 15,
    "plannedTasks": 3,
    "actualEffort": 2,
    "actualReward": 10
  },
  "tasks": [...]
}
```

## Integration Points

### With Task Graph

Session planner calls:
```typescript
taskGraphService.getNextActions({
  projectId: params.projectId,
  tag: params.tags?.[0],
  maxFocusCost: params.maxFocusCost,
  statusFilter: ['todo', 'in_progress']
})
```

### With Pipeline Engine

Can create session notes via templates:
```json
{
  "type": "templateStep",
  "templateId": "session-note",
  "outputPath": "sessions/today.md",
  "context": {
    "sessionId": "sess_...",
    "tasks": [...]
  }
}
```

### With Security-as-Tasks

Filter by `tags: ["security"]` to create security-focused sessions.

## Configuration

### Environment

```bash
MINUTES_PER_EFFORT_UNIT=15  # Default: 15 minutes per unit
```

### Runtime

```typescript
// In session planner service
const config = {
  minutesPerEffortUnit: 15,
  defaultMaxFocusCost: 5,
  defaultDurationMinutes: 45
};
```

## Testing

```bash
cd apps/mcp
npm test -- session-planner
```

19 tests covering:
- Duration constraints
- Focus constraints
- Project/tag filtering
- Task packing
- Persistence
- Lifecycle transitions
- Stats computation

## Performance

- **Task selection**: O(n log n) sorting
- **Packing**: O(n) greedy
- **Session I/O**: O(1) file operations
- **Typical planning time**: <100ms for 1000 tasks

## Troubleshooting

### No tasks available

Check:
1. Are all tasks blocked? → `obsidian_task_graph` to inspect
2. `maxFocusCost` too low? → Increase or remove
3. All tasks done? → Create new tasks

### Session not including expected tasks

Debug:
```bash
# Get next actions with same filters
obsidian_task_next_actions({
  projectId: "...",
  maxFocusCost: 2,
  max: 20
})
```

Check:
- Task effort too high for duration?
- Task blocked by dependencies?
- Focus cost exceeds limit?

### Task sync not working

Ensure:
1. Task has valid `id` in frontmatter
2. `syncTaskStatus: true` passed
3. Task file writable

## Best Practices

### Focus Cost Guidelines

- **1-2**: Simple, routine tasks (email, quick fixes)
- **3-4**: Moderate concentration (writing, planning)
- **5**: Deep work (complex problem solving, design)

### Duration Guidelines

- **25 min**: Pomodoro, single task
- **45 min**: Standard session, 2-3 tasks
- **90 min**: Deep work block, major feature

### Session Planning Rhythm

- Morning: High focus (maxFocusCost: 5)
- Afternoon: Medium focus (maxFocusCost: 3)
- Evening: Low focus (maxFocusCost: 2)

## Example Session Types

### Quick Win Session
```json
{
  "durationMinutes": 25,
  "maxEffort": 1,
  "maxTasks": 1
}
```

### Balanced Session
```json
{
  "durationMinutes": 45,
  "maxFocusCost": 3,
  "maxTasks": 5
}
```

### Deep Work Block
```json
{
  "durationMinutes": 90,
  "maxFocusCost": 5,
  "maxTasks": 1
}
```

### Maintenance Batch
```json
{
  "durationMinutes": 60,
  "tags": ["maintenance", "refactor"],
  "maxTasks": 10
}
```

## Files

- **Service**: `apps/mcp/src/services/session-planner.service.ts`
- **Tests**: `apps/mcp/src/__tests__/services/session-planner.service.test.ts`
- **Storage**: `.vault-sessions/*.json`

---

**Quick Start**:
1. Ensure tasks have `id`, `effort`, `reward`, `focus_cost`
2. Call `obsidian_plan_session` with duration + focus limit
3. Use `obsidian_start_session` / `obsidian_update_session_task` / `obsidian_end_session`
4. Review `totals` for planned vs actual metrics
