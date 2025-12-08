# Task Dependency Graph & Session Planner — Quick Reference

## Task Graph Service

### Basic Usage

```typescript
import { taskGraphService } from './services/task-graph.service.js';

// Build full graph
const graph = await taskGraphService.buildGraph({
  projectId: 'project_x',        // optional filter
  tag: 'important',               // optional filter
  status: ['todo', 'in_progress'], // optional filter
  includeDropped: false,          // default false
});

// Get next actions
const actions = await taskGraphService.getNextActions({
  projectId: 'project_x',
  max: 5,
  maxEffort: 3,
  maxFocusCost: 2,
  statusFilter: ['todo'],
});

// Add dependency (from is prerequisite, to is dependent)
const result = await taskGraphService.setDependency(
  'task_A',  // from: prerequisite
  'task_B',  // to: dependent (B depends on A)
  'add',     // action: 'add' | 'remove'
  true,      // bidirectional: also update 'blocks' field
  false      // allowCycle: reject if creates cycle
);

// Get task dependencies
const deps = await taskGraphService.getTaskDependencies(
  'task_id',
  2,         // depth: how many levels to traverse
  'both'     // direction: 'upstream' | 'downstream' | 'both'
);

// Get critical path
const path = await taskGraphService.getCriticalPath(
  'goal_task_id',
  true  // useEffort: weight by effort or count tasks
);
```

### Task Note Format

```markdown
---
id: task_2024_001
type: task
status: todo
effort: 3
reward: 10
focus_cost: 2
depends_on:
  - task_2024_000
  - task_2023_999
blocks:
  - task_2024_002
projectId: project_alpha
tags:
  - backend
  - critical
---

# Task Title

Task description...
```

### Graph Output

```typescript
interface TaskGraph {
  nodes: TaskNode[];
  edges: TaskEdge[];
  stats: {
    total: number;
    done: number;
    blocked: number;
    unblocked: number;
    inProgress: number;
    dropped: number;
  };
  cycles?: string[][];  // detected cycles
}
```

### Ranked Tasks Output

```typescript
interface RankedTask {
  task: TaskNode;
  blocked: boolean;
  unmetDependencies: string[];
  score: number;  // reward / (effort × focusCost)
}
```

## Session Planner Service

### Basic Usage

```typescript
import { sessionPlannerService } from './services/session-planner.service.js';

// Plan a session
const result = await sessionPlannerService.planSession({
  durationMinutes: 90,
  maxFocusCost: 3,
  projectId: 'project_x',
  tags: ['backend'],
  maxTasks: 5,
});

if (result.noTasksAvailable) {
  console.log('No tasks fit the constraints');
} else {
  console.log('Session planned:', result.session);
}

// Start session
const started = await sessionPlannerService.startSession(sessionId);

// Update task in session
const updated = await sessionPlannerService.updateSessionTask(
  sessionId,
  taskId,
  'done',  // status: 'pending' | 'in_progress' | 'done' | 'skipped'
  true     // syncTaskStatus: update task note as well
);

// End session
const ended = await sessionPlannerService.endSession(
  sessionId,
  'completed'  // status: 'completed' | 'aborted'
);

// List sessions
const sessions = await sessionPlannerService.listSessions({
  status: 'active',  // filter by status
  limit: 10,
  since: '2024-01-01T00:00:00Z',
});

// Get session by ID
const session = await sessionPlannerService.getSession(sessionId);
```

### Session Object

```typescript
interface WorkSession {
  id: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  status: 'planned' | 'active' | 'completed' | 'aborted';
  params: {
    durationMinutes: number;
    maxFocusCost?: number;
    projectId?: string;
    tags?: string[];
    maxTasks?: number;
  };
  totals: {
    plannedEffort: number;
    plannedReward: number;
    plannedTasks: number;
    actualEffort?: number;      // computed on end
    actualReward?: number;      // computed on end
  };
  tasks: SessionTask[];
}

interface SessionTask {
  taskId: string;
  path: string;
  title: string;
  estimatedEffort: number;
  reward?: number;
  focusCost?: number;
  status: 'pending' | 'in_progress' | 'done' | 'skipped';
}
```

### Session Persistence

Sessions are stored in `.vault-sessions/<date>_session_<id>.json`:

```json
{
  "id": "uuid-here",
  "createdAt": "2024-12-06T10:00:00Z",
  "startedAt": "2024-12-06T10:05:00Z",
  "status": "active",
  "params": {
    "durationMinutes": 90,
    "maxFocusCost": 3
  },
  "totals": {
    "plannedEffort": 6,
    "plannedReward": 25,
    "plannedTasks": 3
  },
  "tasks": [
    {
      "taskId": "task_001",
      "path": "tasks/feature.md",
      "title": "Implement feature X",
      "estimatedEffort": 2,
      "reward": 10,
      "focusCost": 2,
      "status": "in_progress"
    }
  ]
}
```

## Configuration

### Time Mapping

Default: `15 minutes per effort unit`

This can be changed in `SessionPlannerService`:
```typescript
private readonly MINUTES_PER_EFFORT_UNIT = 15;
```

### Cache TTL

Task graph cache: `5 seconds`

Change in `TaskGraphService`:
```typescript
private readonly CACHE_TTL = 5000;
```

## Scoring Algorithm

Tasks are scored by:

```
score = reward / (effort × focusCost)
```

Where defaults are:
- `reward = 1` if not specified
- `effort = 1` if not specified
- `focusCost = 1` if not specified

Higher scores indicate better tasks to work on.

## Cycle Detection

When adding dependencies:
- By default, cycles are rejected
- Pass `allowCycle: true` to permit cycles (not recommended)
- Cycle detection uses DFS with O(V + E) complexity
- Existing cycles are preserved but warned about

## Status Semantics

### Task Status
- `todo`: not started, can be worked on if unblocked
- `in_progress`: actively being worked on
- `done`: completed, unblocks dependents
- `blocked`: manually flagged as blocked
- `dropped`: cancelled, treated as unblocking

### Session Status
- `planned`: session created but not started
- `active`: session in progress
- `completed`: session finished successfully
- `aborted`: session cancelled

## Testing

Run tests:
```bash
npm test -- task-graph.service.test.ts
npm test -- session-planner.service.test.ts
```

All 37 tests should pass.

## Common Patterns

### Daily Planning

```typescript
// Plan morning session (high focus)
const morning = await sessionPlannerService.planSession({
  durationMinutes: 120,
  maxFocusCost: 5,
  maxTasks: 3,
});

// Plan afternoon session (lower focus)
const afternoon = await sessionPlannerService.planSession({
  durationMinutes: 90,
  maxFocusCost: 2,
  maxTasks: 4,
});
```

### Project Sprint Planning

```typescript
// Get critical path for project
const path = await taskGraphService.getCriticalPath('project_goal');
console.log(`Total effort: ${path.totalEffort} units`);
console.log(`Critical tasks:`, path.path.map(t => t.title));

// Plan sessions for critical tasks
const session = await sessionPlannerService.planSession({
  durationMinutes: 180,
  projectId: 'project_alpha',
  maxTasks: 10,
});
```

### Task Management

```typescript
// Add new task as dependent on existing task
await taskGraphService.setDependency(
  'existing_task',  // prerequisite
  'new_task',       // dependent
  'add',
  true
);

// Check what's unblocked
const next = await taskGraphService.getNextActions({
  max: 10,
  maxFocusCost: 3,
});

// See what blocks a specific task
const deps = await taskGraphService.getTaskDependencies(
  'blocked_task',
  1,
  'upstream'
);
console.log('Waiting on:', deps.upstream);
```

## MCP Tool Integration (To Be Implemented)

These services will be exposed via MCP tools:

### Task Graph Tools
- `obsidian_task_graph` → `taskGraphService.buildGraph()`
- `obsidian_task_dependencies` → `taskGraphService.getTaskDependencies()`
- `obsidian_task_set_dependency` → `taskGraphService.setDependency()`
- `obsidian_task_next_actions` → `taskGraphService.getNextActions()`
- `obsidian_task_critical_path` → `taskGraphService.getCriticalPath()`

### Session Planner Tools
- `obsidian_plan_session` → `sessionPlannerService.planSession()`
- `obsidian_get_session` → `sessionPlannerService.getSession()`
- `obsidian_list_sessions` → `sessionPlannerService.listSessions()`
- `obsidian_start_session` → `sessionPlannerService.startSession()`
- `obsidian_end_session` → `sessionPlannerService.endSession()`
- `obsidian_update_session_task` → `sessionPlannerService.updateSessionTask()`

## Troubleshooting

### Tasks not appearing in graph
- Check `type: task` in frontmatter
- Verify task has `id` field
- Use `includeDropped: true` if looking for dropped tasks

### Cycles not being detected
- Ensure `allowCycle: false` (default)
- Check edge direction: `from` is prerequisite, `to` is dependent
- Verify `setDependency` parameters are correct

### Session has no tasks
- Check if tasks are blocked by dependencies
- Reduce `maxFocusCost` constraint
- Increase `durationMinutes`
- Check `projectId` and `tags` filters

### Stats don't match expectations
- Dropped tasks filtered by default (use `includeDropped: true`)
- Status filter applies before counting
- Cache may be stale (wait 5s or invalidate manually)

