# Operation Journal & Undo System

Git-like versioning and undo capabilities for all vault operations. Every mutation is logged with full before/after snapshots, enabling inspection, auditing, and safe reversal.

## Core Concept

The journal is an append-only, structured log of every vault mutation. Each entry contains:

- What changed (files modified)
- Complete before/after content snapshots
- Tool that made the change
- Timestamp and metadata
- Correlation with pipelines/sessions

This enables:

1. **Inspection** - See what changed and when
2. **Undo** - Restore previous state
3. **Auditing** - Track all modifications
4. **Correlation** - Link operations to pipelines and tools

## Architecture

### Storage Structure

```
.vault-ops/
  journal/
    2024-12-06.jsonl      # One file per day
    2024-12-07.jsonl
    .index.json           # Fast lookup index
  snapshots/              # Future: external snapshots
    <hash>.md
  config.json             # Retention policy
```

### Journal Format

JSONL (JSON Lines) - one operation per line for streaming and tailing:

```json
{"id":"uuid","timestamp":"2024-12-06T14:00:00Z","type":"single_tool","toolName":"obsidian_structured_patch","files":[...]}
{"id":"uuid","timestamp":"2024-12-06T14:05:00Z","type":"pipeline","pipelineId":"...","files":[...]}
```

## Data Model

### Operation Entry

```typescript
{
  id: string;               // UUID
  timestamp: string;        // ISO 8601
  type: 'single_tool' | 'pipeline' | 'system';
  toolName: string;         // e.g., 'obsidian_structured_patch'
  pipelineId?: string;      // If part of a pipeline
  user?: string;            // Optional auth/session
  description?: string;     // Human-friendly summary

  files: FileChange[];

  meta?: {
    tags?: string[];
    sessionId?: string;
    mcpClient?: string;
    undoOf?: string;        // If this is an undo operation
    forced?: boolean;       // If conflicts were ignored
    extra?: Record<string, unknown>;
  };
}
```

### File Change

```typescript
{
  path: string;
  beforeHash: string; // SHA-256 of before content
  afterHash: string; // SHA-256 of after content
  beforeContentRef: ContentRef;
  afterContentRef: ContentRef;
}
```

### Content Reference

```typescript
type ContentRef =
  | { type: 'inline'; content: string } // v1: all inline
  | { type: 'file'; path: string } // Future: external
  | { type: 'patch'; fromHash: string; patch: string }; // Future: delta
```

## MCP Tools

### obsidian_list_operations

Browse the operation journal with filtering.

**Input:**

```json
{
  "limit": 20,
  "beforeId": "uuid", // Pagination cursor
  "toolName": "obsidian_structured_patch",
  "path": "projects/X.md", // Filter by file
  "since": "2024-12-01T00:00:00Z",
  "until": "2024-12-07T00:00:00Z"
}
```

**Output:**

```json
{
  "operations": [
    {
      "id": "uuid",
      "timestamp": "2024-12-06T14:00:00Z",
      "type": "pipeline",
      "toolName": "obsidian_apply_pipeline",
      "pipelineId": "uuid",
      "description": "Archive Project X",
      "files": [
        { "path": "projects/X.md", "beforeHash": "...", "afterHash": "..." }
      ]
    }
  ]
}
```

### obsidian_get_operation

Inspect a single operation in detail.

**Input:**

```json
{
  "id": "uuid",
  "includeDiff": true
}
```

**Output:**
Full operation entry with:

- Complete file list
- Unified diff for each file
- Metadata
- Undo instructions

### obsidian_undo_operation

Revert an operation by restoring previous content.

**Input:**

```json
{
  "id": "uuid",
  "dryRun": false,
  "force": false
}
```

**Process:**

1. Fetch operation from journal
2. For each file:
   - Load current content
   - Check hash matches `afterHash`
   - If mismatch → conflict (file changed)
3. If conflicts and not `force`:
   - Return error with conflict details
4. If `dryRun`:
   - Return diff preview
5. If not `dryRun`:
   - Restore all `beforeContent`
   - Create new journal entry (undo itself is an operation)

**Output:**

```json
{
  "undone": true,
  "inverseOperationId": "uuid",
  "conflicts": []
}
```

### obsidian_undo_last_operation

Convenience tool to undo most recent operation.

**Input:**

```json
{
  "toolName": "obsidian_structured_patch", // Optional filter
  "path": "projects/X.md", // Optional filter
  "dryRun": false,
  "force": false
}
```

### obsidian_prune_operations

Remove old journal entries per retention policy.

**Input:**

```json
{
  "dryRun": false
}
```

### obsidian_journal_stats

Get statistics about the journal.

**Output:**

```json
{
  "totalEntries": 1543,
  "totalFiles": 7,
  "sizeBytes": 2457600,
  "oldestEntry": "2024-09-01T00:00:00Z",
  "newestEntry": "2024-12-06T14:00:00Z"
}
```

## Conflict Detection

Critical for safety. Conflicts occur when a file was modified after the operation.

### Strategy

**Default Behavior:**

- Do not undo if file hash doesn't match `afterHash`
- Report conflicts
- Require explicit `force: true`

**With force=true:**

- Undo anyway (restore `beforeContent`)
- Log `forced: true` in metadata
- Record actual hash at time of undo

**Before Forced Undo:**
Generate multi-file diff showing what will be overwritten.

## Integration with Pipelines

Pipelines automatically use journaling:

```typescript
// Pipeline apply creates journal entry
const result = await pipelineService.apply(pipelineId, true);
// Returns: { journalEntryId: "uuid", ... }

// Undo entire pipeline atomically
await journalService.undo(result.journalEntryId);
```

Journal entry for pipeline:

```json
{
  "type": "pipeline",
  "toolName": "obsidian_apply_pipeline",
  "pipelineId": "uuid",
  "files": [
    /* all files modified by pipeline */
  ]
}
```

## Usage Examples

### Example 1: Undo Recent Patch

```typescript
// List recent operations
const ops = await obsidian_list_operations({ limit: 10 });

// Inspect one
const detail = await obsidian_get_operation({ id: ops[0].id });

// Preview undo
const preview = await obsidian_undo_operation({
  id: ops[0].id,
  dryRun: true,
});

// Apply undo
const result = await obsidian_undo_operation({
  id: ops[0].id,
});
```

### Example 2: Undo Last Pipeline

```typescript
// Find last pipeline operation
const ops = await obsidian_list_operations({
  limit: 1,
  toolName: 'obsidian_apply_pipeline',
});

// Undo it (with conflict check)
const result = await obsidian_undo_operation({
  id: ops[0].id,
  dryRun: false,
});
```

### Example 3: Undo All Changes to a File

```typescript
// List operations touching specific file
const ops = await obsidian_list_operations({
  path: 'projects/X.md',
  limit: 5,
});

// Undo most recent
await obsidian_undo_operation({ id: ops[0].id });
```

### Example 4: Forced Undo with Conflicts

```typescript
// Try undo
const result = await obsidian_undo_operation({
  id: 'uuid',
  dryRun: false,
});

// If conflicts:
if (result.conflicts && result.conflicts.length > 0) {
  console.log('Conflicts detected:', result.conflicts);

  // Review and force if needed
  await obsidian_undo_operation({
    id: 'uuid',
    force: true,
  });
}
```

## Retention & Maintenance

### Configuration

`.vault-ops/config.json`:

```json
{
  "maxDays": 90,
  "maxEntries": 5000
}
```

### Pruning

Manual or scheduled:

```typescript
// Preview
await obsidian_prune_operations({ dryRun: true });

// Execute
await obsidian_prune_operations({ dryRun: false });
```

Removes journal files older than `maxDays`.

## Performance

### Write Performance

- **Append-only**: O(1) writes
- **No locking**: Concurrent-safe (JSONL atomic appends)
- **Index update**: Every 10 entries

### Read Performance

- **By ID**: O(1) with index
- **List recent**: O(1) (stream backwards from latest file)
- **List with filters**: O(n) but early termination at `limit`

### Index

`.index.json` maps operation ID to location:

```json
{
  "uuid-1": { "file": "2024-12-06.jsonl", "offset": 0 },
  "uuid-2": { "file": "2024-12-06.jsonl", "offset": 423 }
}
```

Rebuilt on startup if missing. Updated incrementally.

### Space Optimization

**v1 (Current):** Inline content in journal

- Simple to implement
- No external dependencies
- Trade-off: larger journal files

**Future Options:**

1. **External snapshots**: Store content in `.vault-ops/snapshots/<hash>.md`
2. **Delta patches**: Store patches instead of full content
3. **Compression**: gzip JSONL files older than N days

## Safety Guarantees

### Atomicity

Each operation is atomic:

- Journal write happens first
- Filesystem writes happen second
- If filesystem write fails, journal entry exists but no file changes

### Durability

All changes persisted to disk:

- JSONL format survives crashes
- Each line is a complete JSON object
- Partial writes at end of file are safe (ignored)

### Consistency

Hashes ensure integrity:

- SHA-256 before/after content
- Conflict detection on undo
- Mismatches require explicit `force`

### Auditability

Complete trail:

- Every mutation logged
- Timestamps and metadata
- Tool/pipeline correlation
- Undo operations also logged

## Integration with Existing Tools

### Structured Patch

```typescript
await journalService.applyMutationsWithJournal(
  'obsidian_structured_patch',
  'Apply patches to note',
  [{ path, before, after }]
);
```

### File Operations

```typescript
await journalService.applyMutationsWithJournal(
  'obsidian_move_file',
  `Move ${from} to ${to}`,
  mutations
);
```

### Auto-Link

```typescript
await journalService.applyMutationsWithJournal(
  'obsidian_auto_link',
  'Apply auto-links',
  [{ path, before, after }]
);
```

## Error Handling

### Common Errors

**"Operation not found"**

- Journal entry doesn't exist
- May have been pruned

**"Conflicts detected"**

- Files modified since operation
- Use `force: true` to override

**"Failed to undo operation"**

- Filesystem error
- Permission issue
- File deleted

### Recovery

If undo fails mid-operation:

- Partial changes may be applied
- Check file states manually
- Use `obsidian_get_operation` to inspect

## Future Enhancements

### Planned

- External snapshot storage for large files
- Delta-based patches for space efficiency
- Selective undo (choose which files to revert)
- Undo ranges (undo operations N through M)
- Branch/tag operations for marking important states

### Possible

- Time-travel queries ("show vault as of date X")
- Diff between arbitrary operations
- Merge conflict resolution UI
- Export journal to Git repository
- Journal replication/backup

## Why This Matters

With journal and undo:

1. **Aggressive automation becomes safe** - Any operation can be reverted
2. **Experimentation is risk-free** - Try bold refactors, undo if needed
3. **Debugging is easier** - See exactly what changed
4. **Compliance/auditing** - Full trail of modifications
5. **Confidence in pipelines** - Complex workflows have safety net

This is the safety net that justifies running ambitious graph transforms, semantic linking, and multi-file pipelines spanning hundreds of notes.

## Quick Reference

| Tool                           | Purpose            | Risk   |
| ------------------------------ | ------------------ | ------ |
| `obsidian_list_operations`     | Browse journal     | Safe   |
| `obsidian_get_operation`       | Inspect details    | Safe   |
| `obsidian_undo_operation`      | Revert changes     | High\* |
| `obsidian_undo_last_operation` | Quick undo         | High\* |
| `obsidian_prune_operations`    | Remove old entries | Medium |
| `obsidian_journal_stats`       | View stats         | Safe   |

\*High risk only if using `force: true`

## Best Practices

1. **Always preview first**: Use `dryRun: true` before undo
2. **Check conflicts**: Review conflict list before forcing
3. **Regular pruning**: Schedule monthly prune to manage size
4. **Backup journal**: Include `.vault-ops/` in vault backups
5. **Tag important operations**: Use `meta.tags` for key milestones
6. **Session correlation**: Pass consistent `sessionId` in metadata

## Related Features

- **Pipeline Engine**: Atomic multi-operation workflows
- **Diff Preview**: Powers undo preview generation
- **Structured Patch**: Individual operations that get journaled
- **File Operations**: Move/rename operations that get journaled

---

With the Operation Journal & Undo system, your vault gains Git-like versioning without the complexity of actual Git. Every operation is tracked, inspectable, and reversible.
