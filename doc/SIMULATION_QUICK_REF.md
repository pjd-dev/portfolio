# Simulation Quick Reference

## MCP Tools (3)

| Tool                                    | Purpose                                  | Key Inputs                                                                   |
| --------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| `obsidian_simulate_avatar_rewards`      | Compute avatar reward deltas (no writes) | `taskIds?`, `taskPaths?`, `goalIds?`, `goalPaths?`, `applyOn?`, `milestone?` |
| `obsidian_simulate_world_constraints`   | Evaluate tasks vs world constraints      | `worldPath?`, `worldOverride?`, `statusFilter?`, `projectId?`                |
| `obsidian_simulate_interest_projection` | Project interest strengths (no writes)   | `interestPaths?`, `asOf?`, `targetDate?`, `horizonDays?`                     |

## Avatar Reward Simulation

```typescript
obsidian_simulate_avatar_rewards({
  taskPaths: ['tasks/daily-review.md'],
  goalPaths: ['Goals/focus.md'],
});
```

```typescript
obsidian_simulate_avatar_rewards({
  taskIds: ['task-123'],
  applyOn: 'milestone',
  milestone: 50,
});
```

## World Constraint Simulation

```typescript
obsidian_simulate_world_constraints({});
```

```typescript
obsidian_simulate_world_constraints({
  worldOverride: {
    constraints: { connectivity: 'poor', tagsBlocked: ['travel'] },
  },
});
```

## Interest Projection Simulation

```typescript
obsidian_simulate_interest_projection({
  horizonDays: 30,
});
```

## Files

- `apps/mcp/src/services/avatar-reward-simulation.service.ts`
- `apps/mcp/src/services/interest-simulation.service.ts`
- `apps/mcp/src/services/world-simulation.service.ts`
- `apps/mcp/src/mcp/obsidian/tools/avatar-simulation.ts`
- `apps/mcp/src/mcp/obsidian/tools/interest-simulation.ts`
- `apps/mcp/src/mcp/obsidian/tools/world-simulation.ts`
