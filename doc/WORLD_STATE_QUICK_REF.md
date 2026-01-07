# World State Quick Reference

## MCP Tools (2)

| Tool                          | Purpose                              | Key Inputs                        |
| ----------------------------- | ------------------------------------ | --------------------------------- |
| `obsidian_get_world_state`    | Read world state note + warnings     | `path?`                           |
| `obsidian_update_world_state` | Merge frontmatter updates into world | `patch`, `path?`, `touchUpdated?` |

## Defaults

- Default note: `core/world/World.md`
- Override path with `WORLD_NOTE_PATH` env var or `path` input.

## Example: Read World State

```typescript
obsidian_get_world_state({});
```

```typescript
obsidian_get_world_state({ path: 'core/world/World.md' });
```

## Example: Update World State

```typescript
obsidian_update_world_state({
  patch: {
    context: { pov: { interests: ['vaulty'], source: 'avatar' } },
    signals: { weather: 'snow', temperatureC: -6, noiseLevel: 'low' },
    cycles: { dayPart: 'morning', weekday: 'mon', weekOfYear: 2 },
    availability: {
      windows: [{ start: '09:00', end: '12:00', mode: 'deep' }],
    },
    forecast: { travelFriction: 'medium' },
  },
});
```

```typescript
obsidian_update_world_state({
  path: 'core/world/World.md',
  patch: { flags: { disrupted: false } },
  touchUpdated: true,
});
```

## Files

- `apps/mcp/src/services/world.service.ts`
- `apps/mcp/src/mcp/obsidian/tools/world-state.ts`
- `specs/world-state.md`
