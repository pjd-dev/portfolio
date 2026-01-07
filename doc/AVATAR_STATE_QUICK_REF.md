# Avatar State Quick Reference

## MCP Tools (2)

| Tool                           | Purpose                               | Key Inputs                        |
| ------------------------------ | ------------------------------------- | --------------------------------- |
| `obsidian_get_avatar_state`    | Read avatar state note + warnings     | `path?`                           |
| `obsidian_update_avatar_state` | Merge frontmatter updates into avatar | `patch`, `path?`, `touchUpdated?` |

## Defaults

- Default note: `core/avatar/Avatar.md`
- Override path with `AVATAR_NOTE_PATH` env var or `path` input.

## Example: Read Avatar State

```typescript
obsidian_get_avatar_state({});
```

```typescript
obsidian_get_avatar_state({ path: 'core/avatar/Avatar.md' });
```

## Example: Update Avatar State

```typescript
obsidian_update_avatar_state({
  patch: {
    profile: {
      name: 'Darry',
      archetype: 'builder',
      location: 'Montreal',
      timezone: 'America/New_York',
      interests: ['vaulty', 'systems'],
    },
    vitals: { energy: 55, stress: 20, notoriety: 45 },
    progression: { xp: 120, level: 3 },
    baselines: { vitals: { energy: 65, sleepHours: 7 } },
    trends: { vitals7d: { energy: -3 } },
    capacity: { focusCostMax: 6, effortScoreMax: 7, timeBudgetMin: 240 },
    knowledge: {
      domains: { vaulty: 2 },
      learning: { now: ['vault-api'] },
      gaps: ['marketing'],
    },
  },
});
```

```typescript
obsidian_update_avatar_state({
  path: 'core/avatar/Avatar.md',
  patch: { flags: { stagnation: false } },
  touchUpdated: true,
});
```

## Files

- `apps/mcp/src/services/avatar.service.ts`
- `apps/mcp/src/mcp/obsidian/tools/avatar-state.ts`
- `specs/avatar-vitals-rewards.md`
