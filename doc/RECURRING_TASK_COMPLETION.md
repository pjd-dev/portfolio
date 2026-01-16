# Recurring Task Completion — Implementation

## Overview

Recurring tasks are now fully integrated with the MCP system. When a recurring task is completed, the system automatically calculates its next run date based on the cadence pattern and updates the task note.

## Features

### ✅ What's Supported

1. **Cadence Patterns**
   - Daily (`daily`)
   - Weekly (`weekly`)
   - Bi-weekly (`biweekly`, `bi-weekly`)
   - Monthly (`monthly`)
   - Quarterly (`quarterly`)
   - Yearly (`yearly`)

2. **Task Completion**
   - Mark recurring task as complete
   - Automatically calculate next run date
   - Track streak (consecutive completions)
   - Record `lastDone` date in `compound` field
   - Update `nextRun` date for task scheduler

3. **Batch Operations**
   - Complete multiple recurring tasks at once
   - Bulk update nextRun dates
   - Dry-run support to preview changes

4. **Integration**
   - Works with existing `compound` field structure
   - Syncs to git automatically
   - Tracks in task history

## Task Template Structure

Recurring tasks use the `compound` field:

```yaml
compound:
  kind: leverage
  multiplier: 1.0
  cadence: daily # ← Define recurrence pattern
  streak: 0 # ← Incremented on completion
  lastDone: # ← Updated on completion
  nextRun: # ← Calculated automatically
  decayDays: 7
```

## MCP Tools

### `obsidian_complete_recurring_task`

Complete a single recurring task and calculate its next run date.

**Parameters:**

- `taskPath` (required) - Path to the task note
- `completedDate` (optional) - Completion date (ISO format, default: today)
- `resetStreak` (optional) - Reset streak to 0 if breaking pattern (default: false)
- `dryRun` (optional) - Preview changes without writing (default: false)

**Returns:**

- Task title and cadence
- Completed date
- Next run date
- Updated streak count
- Git commit status

**Example:**

```typescript
// Complete daily standup for today
await mcp.call('obsidian_complete_recurring_task', {
  taskPath: 'tasks/recurring/daily-standup.md',
});

// Complete task with specific date
await mcp.call('obsidian_complete_recurring_task', {
  taskPath: 'tasks/recurring/weekly-review.md',
  completedDate: '2025-01-13',
  dryRun: true, // Preview only
});

// Reset streak if task was missed
await mcp.call('obsidian_complete_recurring_task', {
  taskPath: 'tasks/recurring/exercise.md',
  resetStreak: true,
});
```

### `obsidian_batch_complete_recurring_tasks`

Complete multiple recurring tasks at once.

**Parameters:**

- `taskPaths` (required) - Array of task paths
- `completedDate` (optional) - Completion date for all tasks (ISO format)
- `dryRun` (optional) - Preview changes without writing (default: false)

**Returns:**

- Summary of successful/failed completions
- List of updated tasks with next run dates
- Error details for any failed tasks

**Example:**

```typescript
// Complete multiple daily tasks
await mcp.call('obsidian_batch_complete_recurring_tasks', {
  taskPaths: [
    'tasks/recurring/daily-standup.md',
    'tasks/recurring/daily-checkin.md',
    'tasks/recurring/daily-review.md',
  ],
  completedDate: '2025-01-13',
});

// Batch with dry-run
await mcp.call('obsidian_batch_complete_recurring_tasks', {
  taskPaths: [
    'tasks/recurring/weekly-review.md',
    'tasks/recurring/weekly-planning.md',
  ],
  dryRun: true,
});
```

## Integration with Task System

### Workflow

1. **Define Recurring Task**

   ```markdown
   ---
   type: task
   title: Daily Standup
   compound:
     cadence: daily
     streak: 0
   ---
   ```

2. **Task Appears in Scheduler**
   - Task graph includes `nextRun` field
   - Scheduler shows when task is due
   - `obsidian_task_next_actions` supports `recurringMode`

3. **Complete Task**

   ```typescript
   await obsidian_complete_recurring_task({
     taskPath: 'tasks/recurring/daily-standup.md',
   });
   ```

4. **Automatic Updates**
   - `compound.lastDone` → "2025-01-13"
   - `compound.nextRun` → "2025-01-14" (next day)
   - `compound.streak` → incremented
   - Git committed automatically

5. **Next Run Scheduled**
   - Task appears in scheduler on `nextRun` date
   - Process repeats

## Cadence Calculation

### Algorithm

```
nextRunDate = baseDate + interval
setTime(nextRunDate, 00:00:00 UTC)
```

### Examples

- **Daily**: Add 1 day, reset to midnight
- **Weekly**: Add 7 days, reset to midnight
- **Monthly**: Add 1 month, reset to 1st of month at midnight
- **Quarterly**: Add 3 months, reset to 1st of month at midnight
- **Yearly**: Add 1 year, reset to Jan 1 at midnight

### Custom Intervals

For intervals > 1 year, use `compound.multiplier`:

```yaml
compound:
  cadence: yearly
  multiplier: 4 # Every 4 years
```

(Note: Current implementation doesn't apply multiplier; can be enhanced)

## Streak Tracking

### Usage

Streaks track consecutive completions:

```yaml
compound:
  cadence: daily
  streak: 14 # 14 consecutive days
```

### Resetting Streaks

If a recurring task is missed, reset the streak on next completion:

```typescript
await obsidian_complete_recurring_task({
  taskPath: 'tasks/recurring/exercise.md',
  resetStreak: true, // Start fresh
});
```

### Avatar Rewards with Streaks

Combine with avatar rewards for streak bonuses:

```yaml
avatar_rewards:
  vitals:
    notoriety: 1 # Base reward
    # Could add: 0.5 * streak for streak bonus
  progression:
    xp: 10 # Base XP
```

(Note: Streak bonus calculation not yet implemented in rewards system)

## Validation

### Before Completing

Ensures:

- Task exists and is readable
- Task type is `task`
- Task has `compound.cadence` defined
- Date is valid ISO format (if provided)

### After Completion

Updates:

- `compound.lastDone` (YYYY-MM-DD)
- `compound.nextRun` (YYYY-MM-DD)
- `compound.streak` (number)
- Git commit with completion info

## Error Handling

### Common Errors

| Error                  | Cause                    | Solution                         |
| ---------------------- | ------------------------ | -------------------------------- |
| "Not a task note"      | File type != task        | Ensure type: task in frontmatter |
| "No cadence pattern"   | Missing compound.cadence | Add cadence: daily (or other)    |
| "Could not parse task" | Invalid markdown         | Check YAML frontmatter syntax    |
| "File not found"       | Task path doesn't exist  | Verify task path is correct      |

### Dry Run

Use `dryRun: true` to preview changes before writing:

```typescript
const preview = await obsidian_complete_recurring_task({
  taskPath: 'tasks/recurring/weekly-review.md',
  dryRun: true,
});

console.log(preview.structuredContent.nextRun);
// Returns: "2025-01-20" (without writing)
```

## Edge Cases

### Task Completed Late

If completing a task after its original next-run date:

```typescript
// Task was due on Jan 13, but completed on Jan 15
await obsidian_complete_recurring_task({
  taskPath: 'tasks/recurring/weekly-review.md',
  completedDate: '2025-01-15', // Task scheduled from this date
});

// nextRun calculated from Jan 15
// Result: 2025-01-22 (next week from actual completion)
```

### Catching Up

Complete multiple past instances:

```typescript
// Complete each missed week
const weeks = ['2025-01-06', '2025-01-13', '2025-01-20'];

for (const date of weeks) {
  await obsidian_complete_recurring_task({
    taskPath: 'tasks/recurring/weekly-review.md',
    completedDate: date,
  });
}
```

## Future Enhancements

Potential improvements:

1. **Custom Interval Multiplier**
   - Support `cadence: daily, multiplier: 3` for every 3 days
   - Currently only works for yearly+

2. **Streak Bonuses**
   - Auto-apply avatar reward bonuses for streaks
   - Implement streak-based point multiplier

3. **Skipped Occurrences**
   - Mark task as "skipped" rather than "completed"
   - Maintain streak/reset options

4. **Time-of-Day Scheduling**
   - Support `cadence.time: "09:00"` for specific times
   - Currently calculated to midnight UTC

5. **Batch Recurring Template Generation**
   - Auto-create recurring tasks from templates
   - Integrate with `obsidian_run_recurring_templates`

## Testing

Check recurring task completion:

```bash
# Create a recurring task
obsidian_create_from_template {
  templateName: 'task-template',
  notePath: 'tasks/test-daily.md',
  variables: {
    title: 'Test Daily Task',
    compound_kind: 'leverage',
    compound_cadence: 'daily'
  }
}

# Complete it
obsidian_complete_recurring_task {
  taskPath: 'tasks/test-daily.md'
}

# Check nextRun was updated
obsidian_get_task {
  path: 'tasks/test-daily.md'
}
# Should show compound.nextRun = tomorrow's date
```

## Architecture

### Files

- `apps/mcp/src/mcp/obsidian/tools/recurring-task-completion.ts` - Tool implementation
- `apps/vaulty/src/seeds/_system/templates/tasks/task-template.md` - Task template with cadence
- `apps/mcp/src/services/task-graph.service.ts` - Task parsing includes nextRun

### Dependencies

- `readNote` - Load task
- `writeNote` - Save updated task
- `gitCommitAndPush` - Persist to git
- `calculateNextRun()` - Internal cadence calculation

### No Breaking Changes

- Existing tasks without cadence are unaffected
- Backward compatible with all existing task operations
- Optional fields (cadence, nextRun, lastDone, streak)

## Conclusion

Recurring tasks are now fully automated:

1. Define cadence in task template
2. Complete task with one tool call
3. System automatically calculates next run
4. Track streaks and completions
5. Integrate with avatar rewards (future)
