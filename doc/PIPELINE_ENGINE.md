# Atomic Batch Pipeline Engine

The Pipeline Engine enables atomic batch execution of multiple vault operations with preview-before-apply workflow. Chain patches, moves, auto-links, metadata updates, and refactors into deterministic workflows.

## Core Concepts

### Atomic Execution
All changes are simulated in-memory first, then applied atomically. If any write fails, all changes are rolled back.

### In-Memory Simulation
Operations are executed against an in-memory file system, generating a unified diff without touching disk.

### Pipeline Steps
A pipeline is composed of steps that execute sequentially:
- **Patch**: Apply structured content operations
- **Move**: Rename or move files with link updates
- **AutoLink**: Automatically create wiki links
- **Metadata**: Update frontmatter
- **Refactor**: Rename/delete sections

## MCP Tools

### obsidian_run_pipeline_simulation

Simulate a pipeline and generate diff preview.

**Input:**
```json
{
  "name": "Optional pipeline name",
  "steps": [
    {
      "type": "patch",
      "path": "projects/X.md",
      "operations": [
        {
          "type": "replace",
          "search": "old text",
          "replacement": "new text",
          "matchCount": 1
        }
      ]
    },
    {
      "type": "autoLink",
      "path": "projects/X.md",
      "options": {
        "scope": "folder",
        "mode": "all"
      }
    },
    {
      "type": "move",
      "from": "projects/X.md",
      "to": "archive/2024/X.md",
      "updateLinks": true,
      "updateBacklinks": true
    }
  ],
  "stopOnError": true
}
```

**Output:**
```json
{
  "pipelineId": "uuid-here",
  "mutations": [
    {
      "path": "projects/X.md",
      "before": "original content",
      "after": "modified content"
    }
  ],
  "diff": "unified diff string",
  "stats": {
    "filesChanged": 3,
    "totalInserts": 15,
    "totalDeletes": 8,
    "stepsExecuted": 3
  },
  "errors": []
}
```

### obsidian_apply_pipeline

Apply a simulated pipeline atomically.

**Input:**
```json
{
  "pipelineId": "uuid-from-simulation",
  "confirm": true
}
```

**Output:**
```json
{
  "applied": true,
  "mutations": [...],
  "journalEntryId": "uuid-here",
  "errors": []
}
```

### obsidian_list_pipelines

List all simulated but not-yet-applied pipelines.

**Output:**
```json
{
  "pipelines": [
    {
      "id": "uuid",
      "name": "Project refactor",
      "filesChanged": 5,
      "steps": 8
    }
  ]
}
```

### obsidian_get_pipeline_simulation

Get detailed information about a specific simulated pipeline.

**Input:**
```json
{
  "pipelineId": "uuid"
}
```

### obsidian_validate_pipeline

Validate pipeline structure before simulation.

**Input:**
```json
{
  "steps": [...]
}
```

**Output:**
```json
{
  "valid": true,
  "errors": [],
  "warnings": ["Step 2: Large file may take time to process"],
  "stepsCount": 5
}
```

## Step Types Reference

### Patch Step

Apply structured content operations.

```json
{
  "type": "patch",
  "path": "note.md",
  "operations": [
    {
      "type": "replace",
      "search": "old text",
      "replacement": "new text",
      "skipCodeBlocks": true,
      "matchCount": 1
    },
    {
      "type": "insert",
      "line": 10,
      "replacement": "new line content"
    },
    {
      "type": "delete",
      "search": "text to remove"
    },
    {
      "type": "update_frontmatter",
      "frontmatter": {
        "status": "done",
        "updated": "2024-12-06"
      }
    },
    {
      "type": "replace_section",
      "section": "Old Heading",
      "replacement": "New section content"
    }
  ]
}
```

### Move Step

Move or rename files with automatic link updates.

```json
{
  "type": "move",
  "from": "projects/X.md",
  "to": "archive/2024/X.md",
  "updateLinks": true,
  "updateBacklinks": true
}
```

### AutoLink Step

Automatically create wiki links.

```json
{
  "type": "autoLink",
  "path": "note.md",
  "options": {
    "scope": "folder",
    "scopeValue": "projects",
    "matchMode": "all",
    "minConfidence": 0.8,
    "maxLinksPerParagraph": 3,
    "maxTotalLinks": 20,
    "includeTags": ["project"],
    "excludeTags": ["archive"],
    "excludeExistingLinks": true,
    "caseSensitive": false
  }
}
```

### Metadata Step

Update frontmatter.

```json
{
  "type": "metadata",
  "path": "note.md",
  "frontmatter": {
    "status": "active",
    "tags": ["project", "urgent"],
    "updated": "2024-12-06"
  },
  "merge": true
}
```

Set `merge: false` to replace all frontmatter instead of merging.

### Refactor Step

Rename or delete sections.

```json
{
  "type": "refactor",
  "path": "note.md",
  "operations": [
    {
      "type": "renameSection",
      "section": "Old Heading",
      "newName": "New Heading"
    },
    {
      "type": "deleteSection",
      "section": "Deprecated Section"
    }
  ]
}
```

## Typical Workflows

### Project Archival Pipeline

Move project to archive, update metadata, apply final auto-links:

```json
{
  "name": "Archive Project X",
  "steps": [
    {
      "type": "metadata",
      "path": "projects/X.md",
      "frontmatter": {
        "status": "archived",
        "archived_date": "2024-12-06"
      },
      "merge": true
    },
    {
      "type": "autoLink",
      "path": "projects/X.md",
      "options": {
        "scope": "vault",
        "mode": "all"
      }
    },
    {
      "type": "move",
      "from": "projects/X.md",
      "to": "archive/2024/projects/X.md"
    }
  ]
}
```

### Multi-Note Refactor Pipeline

Update multiple notes with consistent changes:

```json
{
  "name": "Refactor task workflow",
  "steps": [
    {
      "type": "patch",
      "path": "tasks/task-1.md",
      "operations": [
        {
          "type": "replace_section",
          "section": "Status",
          "replacement": "## Progress\n\nCurrent status here"
        }
      ]
    },
    {
      "type": "refactor",
      "path": "tasks/task-1.md",
      "operations": [
        {
          "type": "renameSection",
          "section": "Notes",
          "newName": "Working Notes"
        }
      ]
    },
    {
      "type": "metadata",
      "path": "tasks/task-1.md",
      "frontmatter": {
        "schema_version": "2.0"
      }
    }
  ]
}
```

### Template Instantiation Pipeline

Create from template, fill content, set metadata:

```json
{
  "name": "New project from template",
  "steps": [
    {
      "type": "patch",
      "path": "projects/new-project.md",
      "operations": [
        {
          "type": "replace",
          "search": "{{PROJECT_NAME}}",
          "replacement": "My New Project"
        },
        {
          "type": "replace",
          "search": "{{START_DATE}}",
          "replacement": "2024-12-06"
        }
      ]
    },
    {
      "type": "metadata",
      "path": "projects/new-project.md",
      "frontmatter": {
        "title": "My New Project",
        "status": "active",
        "created": "2024-12-06"
      }
    },
    {
      "type": "autoLink",
      "path": "projects/new-project.md",
      "options": {
        "scope": "folder",
        "scopeValue": "projects"
      }
    }
  ]
}
```

## Safety Guarantees

### Atomic
All changes are applied together or none at all. Partial failures trigger rollback.

### Consistent
Operations are validated before execution. Invalid operations are caught early.

### Isolated
Pipeline uses vault locking to prevent concurrent modifications.

### Durable
Journal entries record all changes for future undo support.

## Implementation Details

### In-Memory File System
- Files are loaded into memory before simulation
- All operations execute against memory copies
- Original content is preserved for diff generation
- No disk writes until apply phase

### Locking Mechanism
- Creates `.vault-lock` file during apply
- Prevents concurrent pipeline execution
- Auto-expires stale locks after 5 minutes
- Released after apply completes or fails

### Journal System
- Writes entry to `.vault-journal/` directory
- Records all mutations with before/after content
- Enables future undo functionality
- JSON format for easy inspection

### Error Handling
- Validates each step before execution
- Collects errors without stopping (unless `stopOnError: true`)
- Provides detailed error messages with step numbers
- Rolls back on write failure

## Performance Considerations

### File Loading
Only files referenced by pipeline steps are loaded into memory. Large pipelines touching many files may take longer to simulate.

### Diff Generation
Unified diffs are generated for all modified files. Very large files or many changes may produce large diff output.

### Link Updates
Move operations that update backlinks scan all vault files. This can be slow for large vaults (1000+ files).

### Optimization Tips
- Group related operations on the same file into one patch step
- Use `updateBacklinks: false` if you don't need automatic link updates
- Validate pipelines before simulation to catch errors early
- Split very large pipelines into smaller logical units

## Error Messages

### "File not loaded: path.md"
File wasn't in the initial load set. Check that the path is correct and the file exists.

### "Pipeline not found"
The pipeline ID doesn't exist or was already applied. Run simulation again.

### "Failed to acquire vault lock"
Another pipeline is running. Wait for it to complete or remove `.vault-lock` file.

### "Step X failed: ..."
Specific step encountered an error. Check the error message for details.

### "Source file not found: path.md"
Move operation references a file that doesn't exist.

## Future Enhancements

### Undo Support
Journal entries will enable reverting applied pipelines.

### Named Pipelines
Save and reuse pipelines with `obsidian_save_pipeline`.

### Pipeline Templates
Common workflows (archive, refactor, migrate) as reusable templates.

### Dry-Run Mode
Execute pipeline against live vault without writing changes.

### Conflict Detection
Check for conflicting pipelines before apply.

### Progress Streaming
Real-time progress updates for long-running pipelines.

## Related Features

- **Diff Preview**: Powers the unified diff generation
- **Structured Patch**: Used by patch steps
- **File Operations**: Used by move steps
- **Auto-Link**: Used by autoLink steps
- **Metadata Model**: Can validate metadata steps

## Quick Reference

| Tool | Purpose | Risk Level |
|------|---------|-----------|
| `obsidian_run_pipeline_simulation` | Preview changes | Safe (no writes) |
| `obsidian_apply_pipeline` | Execute changes | High (writes to disk) |
| `obsidian_list_pipelines` | Show pending | Safe (read-only) |
| `obsidian_get_pipeline_simulation` | Inspect details | Safe (read-only) |
| `obsidian_validate_pipeline` | Check validity | Safe (no execution) |

**Recommended workflow:**
1. Validate → 2. Simulate → 3. Review diff → 4. Apply

## Examples

See the "Typical Workflows" section above for complete examples.

For more examples and advanced patterns, see the main project documentation.
