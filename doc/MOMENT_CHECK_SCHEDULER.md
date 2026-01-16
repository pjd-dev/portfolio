# Moment Check Scheduler

## Overview

Automated moment-check scheduling system that ensures regular capacity updates throughout the day based on your morning check-in time.

## How It Works

### 1. Morning Check Triggers Schedule

When you complete a **morning-check** via `write_human_state`:

```
Morning Check: 8:00 AM
↓
Scheduled Moment Checks:
- 11:00 AM (3 hours later)
- 2:00 PM (6 hours later)
- 5:00 PM (9 hours later)
```

### 2. Automatic Scheduling

The system:

- Stores your morning check timestamp in `_state/cod/moment-schedule.json`
- Calculates moment-check intervals (default: every 3 hours)
- Schedules checks until end of day (23:00)

### 3. Status Checking

Use MCP tools to check if moment-check is due:

**Check Status:**

```typescript
obsidian_check_moment_check_status();
// Returns: isDue, nextCheck, missedChecks
```

**View Schedule:**

```typescript
obsidian_get_moment_check_schedule();
// Returns: Full day schedule with completion status
```

### 4. Recording Completion

When you complete a **moment-check** via `write_human_state`:

- Timestamp recorded in schedule state
- Status updated to prevent duplicate prompts
- Next scheduled check becomes active

## State Storage

**Location:** `_state/cod/moment-schedule.json`

**Structure:**

```json
{
  "lastMorningCheck": "2026-01-16T08:00:00.000Z",
  "lastMomentCheck": "2026-01-16T11:00:00.000Z",
  "scheduledChecks": [
    "2026-01-16T11:00:00.000Z",
    "2026-01-16T14:00:00.000Z",
    "2026-01-16T17:00:00.000Z"
  ],
  "timezone": "UTC",
  "intervalHours": 3
}
```

## MCP Tools

### `obsidian_check_moment_check_status`

Check if a moment-check is currently due.

**Returns:**

- Prompt text if check is due
- Next scheduled time
- Missed check count
- Last completion time

**Example Response (Due):**

```
⏰ **Moment Check Due** (2:00 PM)

Time for a quick capacity check-in. How are your energy, stress, and focus levels right now?

**Status:**
- Due: true
- Next: 2026-01-16T14:00:00.000Z
- Last: 2026-01-16T11:00:00.000Z
- Missed: 1
```

**Example Response (Not Due):**

```
✅ No moment check due

**Status:**
- Next: 2026-01-16T17:00:00.000Z
- Last: 2026-01-16T14:00:00.000Z
```

### `obsidian_get_moment_check_schedule`

View the complete moment-check schedule for today.

**Returns:**

- Morning check time
- All scheduled check times
- Completion status (✓ completed, ⏰ pending)
- Interval configuration

**Example Response:**

```
📅 **Moment Check Schedule**

**Morning Check:** 8:00 AM
**Last Moment Check:** 11:00 AM
**Interval:** Every 3 hours

**Scheduled Checks:**
- ✓ 11:00 AM
- ⏰ 2:00 PM
- ⏰ 5:00 PM
```

## Integration with COD Planning

Moment checks keep your **human-state** fresh throughout the day, ensuring:

1. **Avatar vitals stay current** - Updates sync to Avatar.md
2. **Planning uses real capacity** - Task recommendations reflect actual state
3. **Prevents stale data** - Regular check-ins override morning snapshot
4. **Adaptive scheduling** - Responds to how your day actually unfolds

## Workflow Example

### Morning (8:00 AM)

```bash
# Complete morning check
write_human_state(
  source: "morning-check",
  energy: 0.7,
  stress: 0.3,
  focusCapacity: "high",
  sleepHours: 7.5,
  timeAvailableMin: 480
)
# → Schedules: 11 AM, 2 PM, 5 PM checks
```

### Mid-Day (11:00 AM)

```bash
# AI checks status
check_moment_check_status()
# → "⏰ Moment Check Due (11:00 AM)"

# User completes check
write_human_state(
  source: "moment-check",
  energy: 0.6,
  stress: 0.4,
  focusCapacity: "med",
  timeAvailableMin: 240
)
# → Records completion, Avatar syncs
```

### Afternoon (2:00 PM)

```bash
# If missed, prompt shows
check_moment_check_status()
# → "⏰ Moment Check Overdue (2 missed)"
```

## Configuration

**Default Interval:** 3 hours  
**Customization:** Pass `intervalHours` to `scheduleMomentChecksForToday()`

**Timezone:** Currently UTC, can be customized per user

**End of Day:** 23:00 (11 PM) - no checks scheduled after this time

## Benefits

1. **No manual scheduling needed** - Automatically calculated from morning check
2. **Prevents capacity drift** - Regular updates catch energy/stress changes
3. **Flexible completion** - Can check in early or handle missed checks
4. **Lightweight prompts** - Quick status check, not full assessment
5. **Gamification aligned** - Avatar vitals stay synchronized all day

## Future Enhancements

- [ ] Adaptive intervals based on volatility (more checks on variable days)
- [ ] Timezone auto-detection from system or user profile
- [ ] Push notifications when moment-check is due
- [ ] Skip option for busy periods (with explicit confirmation)
- [ ] Machine learning: optimal check times based on historical patterns
- [ ] Integration with calendar: avoid checks during meetings
