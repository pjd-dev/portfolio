# Auto-Claim Rewards System

## Overview

Automated reward claiming system that detects earned but unclaimed rewards based on task progress and processes them with optional Avatar integration.

## Features

1. **Automatic Reward Detection** - Scans task progress and identifies earned rewards
2. **Idempotent Claiming** - Skips already claimed rewards using history tracking
3. **Avatar Integration** - Optionally applies avatar_rewards when claiming
4. **Batch Processing** - Process multiple tasks in a single operation
5. **Dry-Run Mode** - Preview changes before applying

## How It Works

### Reward Milestones

Tasks can have milestone-based rewards defined:

```yaml
---
type: task
title: 'Build Authentication System'
rewards:
  - id: reward-123
    content: 'Coffee break ☕'
    milestone: 25
    impactScore: 3
  - id: reward-456
    content: 'Code review celebration 🎉'
    milestone: 50
    impactScore: 5
  - id: reward-789
    content: 'Ship it! 🚀'
    milestone: 100
    impactScore: 10
---
```

### Claiming Process

When a task reaches a milestone:

1. System calculates current progress (% of checklist completed)
2. Identifies earned rewards (milestone ≤ current progress)
3. Checks history for already claimed rewards
4. Claims new rewards by adding history entries
5. Optionally applies avatar_rewards to Avatar.md

### History Tracking

Claimed rewards are recorded in task history:

```markdown
## History

- [2026-01-16T14:30:00Z] **Claimed reward** reward-123: Coffee break ☕ (milestone: 25%)
- [2026-01-16T16:45:00Z] **Claimed reward** reward-456: Code review celebration 🎉 (milestone: 50%)
```

The system parses history entries to prevent duplicate claims (idempotent).

## MCP Tools

### `obsidian_auto_claim_rewards`

Auto-claim all earned rewards for a single task.

**Input:**

```typescript
{
  taskPath: string;              // Path to task note
  applyAvatarRewards?: boolean;  // Apply avatar_rewards (default: true)
  dryRun?: boolean;              // Preview only (default: false)
}
```

**Example:**

```typescript
// Claim rewards for a task
auto_claim_rewards({
  taskPath: 'tasks/auth-system.md',
  applyAvatarRewards: true,
  dryRun: false,
});
```

**Output:**

```
🎉 Successfully claimed 2 reward(s)!

Task: Build Authentication System
Progress: 75.0%

Claimed:
  ✓ Coffee break ☕ @ 25% (impact: 3)
  ✓ Code review celebration 🎉 @ 50% (impact: 5)

Avatar Rewards Applied:
  ✨ +50 XP
  📊 Applied from: tasks/auth-system.md
```

### `obsidian_batch_auto_claim_rewards`

Process multiple tasks in batch.

**Input:**

```typescript
{
  taskPaths: string[];           // Array of task paths
  applyAvatarRewards?: boolean;  // Apply avatar_rewards (default: true)
  dryRun?: boolean;              // Preview only (default: false)
}
```

**Example:**

```typescript
// Claim rewards for all in-progress tasks
batch_auto_claim_rewards({
  taskPaths: [
    'tasks/auth-system.md',
    'tasks/api-endpoints.md',
    'tasks/frontend-ui.md',
  ],
  applyAvatarRewards: true,
  dryRun: false,
});
```

**Output:**

```
🎉 Batch Reward Claim Complete

Processed: 3 tasks
Rewards claimed: 5
Total Avatar XP gained: +150

Details:
  - Build Authentication System: 2 reward(s) @ 75.0%
  - API Endpoints: 2 reward(s) @ 60.0%
  - Frontend UI: 1 reward(s) @ 30.0%
```

## Integration with Avatar System

When `applyAvatarRewards: true` and task has `avatar_rewards` defined:

### Task Definition

```yaml
---
type: task
title: 'Build Authentication System'
avatar_rewards:
  vitals:
    energy: -5
    stress: -3
  progression:
    xp: 50
---
```

### Auto-Claim Flow

```
1. Calculate Progress    → 75% (3/4 checklist items)
2. Find Earned Rewards   → 2 rewards (25%, 50% milestones)
3. Check History         → None claimed yet
4. Claim Rewards         → Add history entries
5. Apply Avatar Rewards  → Update Avatar.md
   - XP: 100 → 150 (+50)
   - Energy: 50 → 45 (-5)
   - Stress: 40 → 37 (-3)
6. Log Mutation Event    → Track in _state/avatar/mutations.jsonl
```

## Workflow Examples

### Daily Reward Check

Run batch claim on all active tasks:

```bash
# Get all in-progress tasks
tasks=$(find_tasks({ status: "in-progress" }))

# Auto-claim rewards
batch_auto_claim_rewards({
  taskPaths: tasks.map(t => t.path),
  dryRun: false
})
```

### Preview Before Claiming

Use dry-run to see what would be claimed:

```bash
auto_claim_rewards({
  taskPath: "tasks/feature-x.md",
  dryRun: true
})
```

Output:

```
🔍 DRY RUN: Would claim 1 reward(s)

Task: Feature X
Progress: 50.0%

Would claim:
  🎁 Midpoint celebration @ 50% (impact: 5)
```

### Automation with Cron

Schedule automatic reward claiming:

```bash
# In crontab or scheduler
0 */6 * * * pnpm tsx scripts/automation/auto-claim-all-tasks.mjs
```

## Benefits

1. **No Manual Tracking** - Rewards claimed automatically as progress happens
2. **Gamification Integration** - Avatar rewards sync seamlessly
3. **Motivation Boost** - Regular celebrations for progress
4. **History Audit Trail** - Complete record of claimed rewards
5. **Idempotent** - Safe to run repeatedly, won't duplicate claims
6. **Batch Efficiency** - Process many tasks at once

## Configuration

### Reward Impact Scores

Impact scores (0-10) represent motivational value:

- **1-3**: Small wins (checklist item, coffee break)
- **4-6**: Medium milestones (feature complete, code review)
- **7-10**: Major achievements (launch, epic complete)

Used for:

- Reward prioritization in task ranking
- Effort/reward ratio calculations
- Motivation analytics

### Avatar Reward Effects

Define effects in task frontmatter:

```yaml
avatar_rewards:
  vitals:
    energy: -5 # Cost/gain
    stress: -3 # Reduction
    health: +2 # Improvement
  progression:
    xp: 50 # Experience points
    money: 100 # Currency
  flags:
    auth_expert: true # Achievement flags
```

## Best Practices

1. **Regular Execution** - Run batch claim daily or after sessions
2. **Dry-Run First** - Preview on new tasks to verify milestone logic
3. **Milestone Spacing** - Use 25%, 50%, 75%, 100% for 4-milestone pattern
4. **Impact Calibration** - Align impact scores with actual effort
5. **Avatar Balance** - Ensure avatar_rewards don't break vitals ranges
6. **History Preservation** - Never edit claimed reward history entries

## Troubleshooting

### No Rewards Claimed

**Problem**: Tool says "No new rewards to claim" but progress shows milestone reached

**Solutions:**

1. Check milestone percentages align with progress calculation
2. Verify reward IDs are unique and valid
3. Look for existing history entries that may already claim the reward

### Avatar Rewards Not Applied

**Problem**: Rewards claimed but Avatar.md not updated

**Solutions:**

1. Verify `applyAvatarRewards: true` in tool input
2. Check task has `avatar_rewards` defined in frontmatter
3. Confirm Avatar.md exists at `core/avatar/Avatar.md`
4. Check avatar service logs for errors

### Duplicate Claims

**Problem**: Same reward claimed multiple times

**Solutions:**

1. Ensure history entries match format: `Claimed reward reward-{id}`
2. Check reward IDs are consistent and don't change
3. Verify history parsing regex is working correctly

## Future Enhancements

- [ ] Scheduled auto-claim via MCP scheduler integration
- [ ] Reward claim notifications (push to mobile)
- [ ] Analytics: most motivating reward types
- [ ] Reward streaks and combo bonuses
- [ ] Conditional rewards (only claim if avatar health > threshold)
- [ ] Reward templates for common patterns
