# Pipeline Engine — Quick Reference

## One-Page Cheatsheet

### Basic Flow
```
Validate → Simulate → Review Diff → Apply
```

### Five Core Tools

```typescript
// 1. Validate structure
obsidian_validate_pipeline({ steps: [...] })

// 2. Simulate and preview
obsidian_run_pipeline_simulation({
  name: "My Pipeline",
  steps: [...],
  stopOnError: true
})
// Returns: pipelineId, diff, stats

// 3. Review details
obsidian_get_pipeline_simulation({ pipelineId: "..." })

// 4. List pending
obsidian_list_pipelines({})

// 5. Apply atomically
obsidian_apply_pipeline({
  pipelineId: "...",
  confirm: true
})
```

### Five Step Types

| Type | Purpose | Key Fields |
|------|---------|------------|
| `patch` | Edit content | `path`, `operations[]` |
| `move` | Rename/move | `from`, `to`, `updateLinks` |
| `autoLink` | Create links | `path`, `options` |
| `metadata` | Update frontmatter | `path`, `frontmatter`, `merge` |
| `refactor` | Restructure | `path`, `operations[]` |

### Minimal Examples

#### Patch Step
```json
{
  "type": "patch",
  "path": "note.md",
  "operations": [
    { "type": "replace", "search": "old", "replacement": "new", "matchCount": 1 }
  ]
}
```

#### Move Step
```json
{
  "type": "move",
  "from": "note.md",
  "to": "archive/note.md",
  "updateLinks": true
}
```

#### AutoLink Step
```json
{
  "type": "autoLink",
  "path": "note.md",
  "options": { "scope": "vault", "matchMode": "all" }
}
```

#### Metadata Step
```json
{
  "type": "metadata",
  "path": "note.md",
  "frontmatter": { "status": "done" },
  "merge": true
}
```

#### Refactor Step
```json
{
  "type": "refactor",
  "path": "note.md",
  "operations": [
    { "type": "renameSection", "section": "Old", "newName": "New" }
  ]
}
```

### Complete Pipeline Example

Archive a project with cleanup:

```json
{
  "name": "Archive Project X",
  "steps": [
    {
      "type": "patch",
      "path": "projects/X.md",
      "operations": [
        {
          "type": "replace_section",
          "section": "Status",
          "replacement": "Archived on 2024-12-06"
        }
      ]
    },
    {
      "type": "metadata",
      "path": "projects/X.md",
      "frontmatter": { "status": "archived", "archived_date": "2024-12-06" },
      "merge": true
    },
    {
      "type": "autoLink",
      "path": "projects/X.md",
      "options": { "scope": "vault", "maxTotalLinks": 10 }
    },
    {
      "type": "move",
      "from": "projects/X.md",
      "to": "archive/2024/X.md",
      "updateBacklinks": true
    }
  ],
  "stopOnError": true
}
```

### Patch Operations Reference

| Operation | Purpose | Required Fields |
|-----------|---------|-----------------|
| `replace` | Find & replace | `search`, `replacement` |
| `insert` | Add line at position | `line`, `replacement` |
| `delete` | Remove text | `search` |
| `update_frontmatter` | Merge frontmatter | `frontmatter` |
| `replace_section` | Replace entire section | `section`, `replacement` |

### AutoLink Options

```typescript
{
  scope: 'folder' | 'vault' | 'tag' | 'graphCluster',
  scopeValue?: string,           // folder path or tag name
  matchMode: 'exact' | 'prefix' | 'fuzzy' | 'all',
  minConfidence: 0.7,            // 0.0 - 1.0
  maxLinksPerParagraph: 3,
  maxTotalLinks: 20,
  includeTags: ['project'],
  excludeTags: ['archive'],
  excludeExistingLinks: true,
  caseSensitive: false
}
```

### Refactor Operations

| Operation | Purpose | Fields |
|-----------|---------|--------|
| `renameSection` | Change heading | `section`, `newName` |
| `deleteSection` | Remove section | `section` |
| `moveSection` | Reorder (future) | `section`, `newPosition` |

### Safety Features

✅ **Atomic**: All-or-nothing writes  
✅ **Rollback**: Auto-restore on failure  
✅ **Locking**: Prevents concurrent changes  
✅ **Journal**: Records all changes  
✅ **Validation**: Catches errors early  
✅ **Diff Preview**: See before apply  

### Error Handling

```json
{
  "stopOnError": true   // Stop on first error
}
```

If `stopOnError: false`, pipeline continues and collects all errors.

### Output Structure

#### Simulation Result
```typescript
{
  pipelineId: string,
  mutations: FileMutation[],
  diff: string,                 // Unified diff
  stats: {
    filesChanged: number,
    totalInserts: number,
    totalDeletes: number,
    stepsExecuted: number
  },
  errors: Array<{ step: number, message: string }>
}
```

#### Application Result
```typescript
{
  applied: boolean,
  mutations: FileMutation[],
  journalEntryId: string,      // For future undo
  errors: string[]
}
```

### File Mutation
```typescript
{
  path: string,
  before: string,              // Original content
  after: string                // Modified content
}
```

### Performance Tips

1. **Group operations** on same file into one patch step
2. **Disable backlinks** if not needed: `updateBacklinks: false`
3. **Validate first** to catch errors before simulation
4. **Use scoped autoLink** instead of `scope: 'vault'`
5. **Split large pipelines** into logical chunks

### Common Patterns

#### Multi-File Update
```json
{
  "steps": [
    { "type": "patch", "path": "file1.md", "operations": [...] },
    { "type": "patch", "path": "file2.md", "operations": [...] },
    { "type": "patch", "path": "file3.md", "operations": [...] }
  ]
}
```

#### Template → Instance
```json
{
  "steps": [
    {
      "type": "patch",
      "path": "new-note.md",
      "operations": [
        { "type": "replace", "search": "{{TITLE}}", "replacement": "Real Title" },
        { "type": "replace", "search": "{{DATE}}", "replacement": "2024-12-06" }
      ]
    },
    {
      "type": "metadata",
      "path": "new-note.md",
      "frontmatter": { "title": "Real Title", "created": "2024-12-06" }
    }
  ]
}
```

#### Bulk Archive
```json
{
  "steps": [
    { "type": "move", "from": "active/A.md", "to": "archive/A.md" },
    { "type": "move", "from": "active/B.md", "to": "archive/B.md" },
    { "type": "move", "from": "active/C.md", "to": "archive/C.md" }
  ]
}
```

### Troubleshooting

| Error | Solution |
|-------|----------|
| "File not loaded" | Check path exists and is correct |
| "Pipeline not found" | Re-run simulation |
| "Failed to acquire lock" | Wait or remove `.vault-lock` |
| "Step X failed" | Check step validation |

### File Locations

- Lock file: `.vault-lock` (auto-created)
- Journal: `.vault-journal/*.json` (auto-created)

### Related Tools

- `obsidian_preview_diff` - Preview single file changes
- `obsidian_structured_patch` - Apply patches without pipeline
- `obsidian_move_file` - Move single file
- `obsidian_auto_link` - Auto-link single file
- `obsidian_batch_move` - Batch moves without full pipeline

### When to Use Pipeline vs. Individual Tools

**Use Pipeline when:**
- Multiple files need coordinated changes
- Operations depend on each other
- You need atomic all-or-nothing behavior
- Changes should be previewed as a unit

**Use Individual Tools when:**
- Single file, single operation
- Interactive/exploratory changes
- Immediate feedback needed
- Operation is independent

### Pipeline vs. Batch Tools

| Feature | Pipeline | Batch Tools |
|---------|----------|-------------|
| Atomicity | ✅ All-or-nothing | ❌ Best effort |
| Diff Preview | ✅ Unified for all | ❌ Per operation |
| Rollback | ✅ Automatic | ❌ Manual |
| Mixed Operations | ✅ Patches + moves + links | ❌ Single type |
| Journal | ✅ Yes | ❌ No |

### Next Steps

1. Read [PIPELINE_ENGINE.md](./PIPELINE_ENGINE.md) for full documentation
2. Try validating a simple pipeline
3. Run simulation and review diff
4. Apply small pipeline to test
5. Build complex workflows

### Support

- Full docs: `PIPELINE_ENGINE.md`
- API reference: `PIPELINE_ENGINE_API.md` (coming soon)
- Examples: See "Typical Workflows" section in main docs
