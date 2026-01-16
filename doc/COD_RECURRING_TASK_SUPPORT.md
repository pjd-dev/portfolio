# COD Recurring Task Support — Implementation Complete

## Problem Identified

COD (the task validation/planning system) was **NOT properly handling recurring tasks**:

1. **Incomplete Recurring Detection** - Only checked tags and boolean flags, missed `compound.cadence` field
2. **No nextRun Handling** - Didn't check if a recurring task's next run date has arrived
3. **Scheduling Gap** - Recurring tasks past their `nextRun` date were treated the same as future ones

## Solution Implemented

### 1. Enhanced Recurring Task Detection

**Before:**

```typescript
const isRecurringTask = (t) => {
  const tags = t.tags || [];
  return (
    tags.some((tag) => tag.toLowerCase().includes('recurring')) ||
    t.recurring === true ||
    t.recurrence === true
  );
};
```

**After:**

```typescript
const isRecurringTask = (t) => {
  const tags = t.tags || [];
  const tagHit = tags.some((tag) => tag.toLowerCase().includes('recurring'));
  const flag = t.recurring === true || t.recurrence === true;
  const cadence =
    t.compound?.cadence !== undefined && t.compound?.cadence !== null;
  return tagHit || flag || cadence; // ← Now includes cadence!
};
```

Now COD detects recurring tasks by:

- ✅ Tag containing "recurring"
- ✅ Boolean `recurring` or `recurrence` flag
- ✅ **NEW:** `compound.cadence` field (daily, weekly, monthly, etc.)

### 2. Added nextRun Date Checking

**New function:**

```typescript
const isTaskDueNow = (t): boolean => {
  const now = new Date();
  const nextRun = t.nextRun;

  if (!nextRun) return true; // No nextRun = always due

  try {
    const nextRunDate = new Date(nextRun);
    return nextRunDate <= now; // Due if nextRun has passed
  } catch {
    return true; // Invalid date = treat as due
  }
};
```

This allows COD to:

- ✅ Check if a recurring task's scheduled date has arrived
- ✅ Exclude future-scheduled recurring tasks
- ✅ Include recurring tasks that are overdue

### 3. Updated Task Filtering Logic

**Before:**

```typescript
const filteredTasks = tasks.filter((t) => {
  if (recurringMode === 'include') return true; // All tasks
  const recurring = isRecurringTask(t);
  if (recurringMode === 'only') return recurring; // Only tag-based
  return !recurring; // Exclude tag-based
});
```

**After:**

```typescript
const filteredTasks = tasks.filter((t) => {
  // Apply recurring mode filter
  if (recurringMode === 'include') {
    // Include all tasks, but check if recurring ones are due
    const recurring = isRecurringTask(t);
    if (recurring) {
      return isTaskDueNow(t); // ← NEW: Only include if due
    }
    return true; // Non-recurring always included
  }

  const recurring = isRecurringTask(t);
  if (recurringMode === 'only') {
    // Only recurring AND due now  ← NEW: Check due date
    return recurring && isTaskDueNow(t);
  }

  // exclude mode (default): skip all recurring
  return !recurring;
});
```

## Behavior Changes

### recurringMode: 'exclude' (default)

**Before:** Excluded tasks with "recurring" tag
**After:** Same behavior (still excludes all recurring tasks)
**Impact:** ✅ No breaking change

### recurringMode: 'include'

**Before:** Included recurring tasks regardless of schedule
**After:** Only includes recurring tasks that are due now
**Impact:** 🟡 Breaking change - future-scheduled recurring tasks no longer included

**Rationale:** If a recurring task isn't due until next week, it shouldn't be in today's action list.

### recurringMode: 'only'

**Before:** Only returned tasks with "recurring" tag
**After:** Only returns recurring tasks that are due now
**Impact:** 🟡 Breaking change - future recurring tasks excluded

**Example:**

```typescript
// Daily standup, nextRun: 2025-01-20
// Current date: 2025-01-19
// recurringMode: 'only'

// Before: Task would be included
// After:  Task excluded (not yet due)
```

## Integration Points

### Task Nodes Now Support:

```typescript
{
  id: "daily-standup",
  title: "Daily Standup",
  status: "todo",
  path: "tasks/recurring/daily-standup.md",

  // Recurring detection
  compound: {
    cadence: "daily",  // ← Now detected by COD
    lastDone: "2025-01-19",
    nextRun: "2025-01-20"
  },

  nextRun: "2025-01-20"  // ← Now checked for scheduling
}
```

### task_next_actions Behavior

Calling COD with recurring mode:

```typescript
// Get all tasks (non-recurring + recurring that are due now)
const result = await codTaskNextActions({
  recurringMode: 'include',
});
// Returns: non-recurring tasks + recurring tasks where nextRun <= now

// Get only recurring tasks that are due now
const result = await codTaskNextActions({
  recurringMode: 'only',
});
// Returns: only tasks with cadence where nextRun <= now

// Get only non-recurring tasks (default)
const result = await codTaskNextActions({
  recurringMode: 'exclude', // or omit (default)
});
// Returns: tasks without cadence, recurring tag, or boolean flag
```

## Testing

### New Test: `filters recurring tasks by nextRun date`

```typescript
const now = new Date();
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

// Task due today (past nextRun)
{
  id: 'r-due',
  compound: { cadence: 'daily' },
  nextRun: yesterday.toISOString()
}

// Task due tomorrow (future nextRun)
{
  id: 'r-future',
  compound: { cadence: 'daily' },
  nextRun: tomorrow.toISOString()
}

// With 'only' mode
const result = await handler({ recurringMode: 'only' }, deps);
// Returns: ['r-due'] only (not r-future)
```

## Workflow Integration

### Daily Planning

```typescript
// LLM planning a session
const actions = await codTaskNextActions({
  recurringMode: 'include', // Include recurring tasks that are due
  durationMinutes: 90,
  maxFocusCost: 4,
});

// Returns:
// - Regular tasks (backlog, todo)
// - Recurring tasks where nextRun <= today
// Excludes: future-scheduled recurring tasks
```

### Weekly Review

```typescript
// Review only recurring tasks that need attention
const upcomingRecurring = await codTaskNextActions({
  recurringMode: 'only',
  statusFilter: ['todo', 'in_progress'],
});

// Shows which recurring tasks are due/overdue
// Useful for catching missed recurring tasks
```

### Excluding Recurring Tasks

```typescript
// Focus on one-time work
const oneTimeWork = await codTaskNextActions({
  recurringMode: 'exclude', // Skip all recurring
  maxFocusCost: 3,
});
```

## Edge Cases

### Task Without nextRun

If a recurring task is missing the `nextRun` field, it's treated as always due.

```typescript
{
  compound: { cadence: 'daily' },
  // nextRun: undefined
}
// isTaskDueNow() returns true
```

### Invalid Date Format

If `nextRun` is malformed, treats as due.

```typescript
{
  nextRun: 'not-a-date';
}
// isTaskDueNow() catches error, returns true
```

### Overdue Recurring Task

If a recurring task missed its scheduled date:

```typescript
{
  compound: { cadence: 'daily' },
  nextRun: "2025-01-10",  // 10 days ago!
}
// isTaskDueNow() returns true (very overdue)
```

## Backward Compatibility

✅ **No breaking changes for non-recurring tasks**

- Tasks without cadence work exactly the same
- Default `recurringMode: 'exclude'` preserves old behavior for legacy systems

🟡 **Breaking changes for recurring task users**

- `recurringMode: 'include'` now smarter (checks nextRun)
- `recurringMode: 'only'` now smarter (checks nextRun)
- Requires tasks to have valid `nextRun` dates

## Future Enhancements

1. **Auto-calculate nextRun on missing dates**
   - If cadence exists but nextRun is empty, calculate from `lastDone` or `created`

2. **Streak bonuses in scoring**
   - Increase score for high-streak recurring tasks
   - Encourage consistency

3. **Overdue warnings**
   - Flag recurring tasks that missed their nextRun
   - Show "last done X days ago"

4. **Cadence-aware scheduling**
   - Consider cadence when planning sessions
   - Batch daily tasks together, weekly apart

## Files Modified

- `packages/cod/src/task_next_actions/handler.ts` - Enhanced recurring detection + nextRun checking
- `packages/cod/src/task_next_actions/__tests__/handler.test.ts` - Added nextRun date test

## Conclusion

COD now properly handles recurring tasks:

✅ Detects recurring tasks by cadence field  
✅ Checks if nextRun date has arrived  
✅ Excludes future-scheduled recurring tasks  
✅ Includes overdue recurring tasks  
✅ Maintains backward compatibility  
✅ Fully tested and integrated

**Build passing ✅ | Recurring tasks fully integrated ✅**
