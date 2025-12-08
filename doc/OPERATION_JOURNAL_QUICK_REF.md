# Operation Journal — Quick Reference

## One-Command Cheatsheet

```bash
# List recent operations
obsidian_list_operations({ limit: 10 })

# Get details
obsidian_get_operation({ id: "uuid" })

# Undo with preview
obsidian_undo_operation({ id: "uuid", dryRun: true })

# Undo for real
obsidian_undo_operation({ id: "uuid" })

# Undo last
obsidian_undo_last_operation({})

# Journal stats
obsidian_journal_stats({})

# Prune old entries
obsidian_prune_operations({ dryRun: false })
```

## Data Structure

```
.vault-ops/
  journal/
    2024-12-06.jsonl
    .index.json
  config.json
```

## Operation Entry

```typescript
{
  id: "uuid",
  timestamp: "2024-12-06T14:00:00Z",
  type: "single_tool" | "pipeline" | "system",
  toolName: "obsidian_structured_patch",
  pipelineId: "uuid",              // If pipeline
  description: "Human-friendly",
  files: [
    {
      path: "note.md",
      beforeHash: "sha256...",
      afterHash: "sha256...",
      beforeContentRef: { type: "inline", content: "..." },
      afterContentRef: { type: "inline", content: "..." }
    }
  ],
  meta: {
    tags: ["important"],
    sessionId: "uuid",
    undoOf: "uuid",                // If this is an undo
    forced: true                   // If conflicts ignored
  }
}
```

## Six Tools

### 1. list_operations
```typescript
obsidian_list_operations({
  limit: 20,
  beforeId: "uuid",              // Pagination
  toolName: "obsidian_structured_patch",
  path: "projects/X.md",         // Filter by file
  since: "2024-12-01T00:00:00Z",
  until: "2024-12-07T00:00:00Z"
})
```

### 2. get_operation
```typescript
obsidian_get_operation({
  id: "uuid",
  includeDiff: true              // Show unified diff
})
```

### 3. undo_operation
```typescript
obsidian_undo_operation({
  id: "uuid",
  dryRun: false,                 // Preview first
  force: false                   // Ignore conflicts
})
```

### 4. undo_last_operation
```typescript
obsidian_undo_last_operation({
  toolName: "obsidian_structured_patch",  // Optional
  path: "projects/X.md",                  // Optional
  dryRun: false,
  force: false
})
```

### 5. prune_operations
```typescript
obsidian_prune_operations({
  dryRun: true                   // Preview what gets removed
})
```

### 6. journal_stats
```typescript
obsidian_journal_stats({})

// Returns:
{
  totalEntries: 1543,
  totalFiles: 7,
  sizeBytes: 2457600,
  oldestEntry: "2024-09-01T00:00:00Z",
  newestEntry: "2024-12-06T14:00:00Z"
}
```

## Conflict Handling

### Without Force
```typescript
const result = await obsidian_undo_operation({ id: "uuid" });

if (result.conflicts && result.conflicts.length > 0) {
  // Files changed since operation
  console.log("Cannot undo - conflicts:", result.conflicts);
  // Must use force: true
}
```

### With Force
```typescript
await obsidian_undo_operation({
  id: "uuid",
  force: true    // Overwrites current content
});
```

## Common Workflows

### Preview → Undo
```typescript
// 1. Preview
const preview = await obsidian_undo_operation({
  id: "uuid",
  dryRun: true
});

// 2. Review diff
console.log(preview.diff);

// 3. Apply
await obsidian_undo_operation({ id: "uuid" });
```

### Undo Last Pipeline
```typescript
const ops = await obsidian_list_operations({
  limit: 1,
  toolName: "obsidian_apply_pipeline"
});

await obsidian_undo_operation({ id: ops[0].id });
```

### Undo All Changes to File
```typescript
const ops = await obsidian_list_operations({
  path: "projects/X.md",
  limit: 100
});

// Undo in reverse order (most recent first)
for (const op of ops) {
  await obsidian_undo_operation({ id: op.id });
}
```

### Monthly Cleanup
```typescript
const stats = await obsidian_journal_stats({});
console.log(`Journal size: ${stats.sizeBytes / 1024 / 1024} MB`);

if (stats.sizeBytes > 100_000_000) {
  await obsidian_prune_operations({ dryRun: false });
}
```

## Configuration

`.vault-ops/config.json`:
```json
{
  "maxDays": 90,
  "maxEntries": 5000
}
```

## Journal Format

JSONL (one operation per line):
```
{"id":"uuid-1","timestamp":"...","type":"single_tool",...}
{"id":"uuid-2","timestamp":"...","type":"pipeline",...}
```

## Index Format

`.journal/.index.json`:
```json
{
  "uuid-1": { "file": "2024-12-06.jsonl", "offset": 0 },
  "uuid-2": { "file": "2024-12-06.jsonl", "offset": 423 }
}
```

## Integration

### Pipeline Auto-Journaling
```typescript
// Pipeline apply automatically creates journal entry
const result = await pipelineService.apply(pipelineId, true);

// result.journalEntryId available

// Undo entire pipeline
await journalService.undo(result.journalEntryId);
```

### Manual Journaling
```typescript
await journalService.applyMutationsWithJournal(
  'my_custom_tool',
  'Description of what changed',
  [
    { path: 'note.md', before: '...', after: '...' }
  ],
  { tags: ['custom'], sessionId: 'xyz' }
);
```

## Hashing

SHA-256 of file content:
```typescript
beforeHash: createHash('sha256').update(beforeContent).digest('hex');
afterHash: createHash('sha256').update(afterContent).digest('hex');
```

Used for conflict detection.

## Performance

| Operation | Complexity | Notes |
|-----------|------------|-------|
| Append | O(1) | Fast append |
| Get by ID | O(1) | With index |
| List recent | O(1) | Stream backwards |
| Undo | O(n) | n = files in operation |
| Prune | O(m) | m = old journal files |

## Storage

### Space Used
- Inline content: ~2x vault size
- One journal file per day
- Index: ~100 bytes per operation

### Optimization
1. Prune regularly
2. Future: external snapshots
3. Future: delta patches
4. Future: compression

## Safety

✅ **Atomic**: Journal write before filesystem  
✅ **Durable**: JSONL survives crashes  
✅ **Consistent**: Hash-based conflict detection  
✅ **Auditable**: Complete operation trail  
✅ **Reversible**: Every mutation can be undone  

## Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "Operation not found" | Not in journal | May be pruned |
| "Conflicts detected" | Files changed | Use `force: true` |
| "Failed to undo" | Filesystem error | Check permissions |

## Best Practices

1. **Preview first**: Always use `dryRun: true`
2. **Check conflicts**: Review before forcing
3. **Prune monthly**: Keep journal size manageable
4. **Backup .vault-ops**: Include in vault backups
5. **Tag milestones**: Use `meta.tags` for important ops
6. **Session tracking**: Pass consistent `sessionId`

## Tool Risk Levels

| Tool | Risk | Notes |
|------|------|-------|
| `list_operations` | ✅ Safe | Read-only |
| `get_operation` | ✅ Safe | Read-only |
| `undo_operation` | ⚠️ High | Modifies files |
| `undo_last_operation` | ⚠️ High | Modifies files |
| `prune_operations` | ⚠️ Medium | Deletes history |
| `journal_stats` | ✅ Safe | Read-only |

## When to Use

### Use Journal When:
- You need to track all changes
- Undo capability is critical
- Auditing/compliance required
- Running risky automation
- Debugging complex workflows

### Use Undo When:
- Operation had unexpected results
- Need to revert experiment
- Mistake was made
- Testing different approaches

## Related Tools

- `obsidian_run_pipeline_simulation` - Preview before commit
- `obsidian_preview_diff` - See changes before apply
- `obsidian_structured_patch` - Apply validated patches
- `obsidian_batch_move` - Multi-file operations

## Typical Flow

```
1. Run operation (e.g., structured patch)
   ↓
2. Journal entry created automatically
   ↓
3. Later: list operations to find it
   ↓
4. Get details to inspect changes
   ↓
5. Undo with dryRun to preview
   ↓
6. Undo for real if needed
   ↓
7. Undo itself is journaled
```

## Advanced: Content Refs

### Inline (Current)
```typescript
{ type: 'inline', content: '...' }
```

### File (Future)
```typescript
{ type: 'file', path: 'snapshots/<hash>.md' }
```

### Patch (Future)
```typescript
{ type: 'patch', fromHash: '...', patch: '...' }
```

## Maintenance

### Check Size
```typescript
const stats = await obsidian_journal_stats({});
console.log(`${(stats.sizeBytes / 1024 / 1024).toFixed(2)} MB`);
```

### Prune Old
```typescript
// Preview
await obsidian_prune_operations({ dryRun: true });

// Execute
await obsidian_prune_operations({ dryRun: false });
```

### Rebuild Index
Delete `.journal/.index.json` and restart - will rebuild.

## Troubleshooting

**Index out of sync:**
```bash
rm .vault-ops/journal/.index.json
# Restart MCP server
```

**Journal too large:**
```typescript
await obsidian_prune_operations({ dryRun: false });
```

**Can't undo:**
```typescript
// Check for conflicts first
const result = await obsidian_undo_operation({
  id: "uuid",
  dryRun: true
});

// Review and force if needed
```

## Next Steps

1. Read [OPERATION_JOURNAL.md](./OPERATION_JOURNAL.md) for details
2. Try listing operations: `obsidian_list_operations({})`
3. Inspect one: `obsidian_get_operation({ id: "..." })`
4. Preview undo: `obsidian_undo_operation({ id: "...", dryRun: true })`
5. Get comfortable with preview workflow before real undos

---

**Remember:** Every undo is itself a journal entry. You can undo an undo!
