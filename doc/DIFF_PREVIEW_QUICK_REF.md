# Diff Preview - Quick Reference

## MCP Tools (5)

| Tool | Purpose | Key Inputs |
|------|---------|-----------|
| `obsidian_preview_diff` | Preview operations as unified diff | `path`, `operations`, `mode?`, `contextLines?` |
| `obsidian_apply_with_diff` | Apply operations with diff preview | `path`, `operations`, `dryRun?` |
| `obsidian_validate_operations` | Validate operations pre-flight | `path`, `operations` |
| `obsidian_compare_versions` | Compare current with previous | `path`, `previousContent` |
| `obsidian_generate_structured_diff` | Structured line-by-line diff | `path`, `operations` |

## Operation Types

```json
// Replace text
{ "type": "replace", "search": "old", "replacement": "new" }

// Insert at line
{ "type": "insert", "line": 10, "replacement": "text" }

// Delete text
{ "type": "delete", "search": "remove this" }

// Update frontmatter
{ "type": "update_frontmatter", "frontmatter": { "key": "value" } }

// Replace section
{ "type": "replace_section", "section": "Title", "replacement": "content" }
```

## Diff Modes

- `full` - Entire note (default)
- `frontmatter` - YAML only
- `content` - Content only (no frontmatter)
- `section` - Specific section

## Quick Examples

### Preview Simple Replace
```json
{
  "path": "notes/doc.md",
  "operations": [
    { "type": "replace", "search": "draft", "replacement": "published" }
  ]
}
```

### Apply with Dry Run
```json
{
  "path": "tasks/task.md",
  "operations": [
    { "type": "update_frontmatter", "frontmatter": { "status": "done" } }
  ],
  "dryRun": true
}
```

### Validate Before Apply
```json
{
  "path": "blog/post.md",
  "operations": [
    { "type": "replace", "search": "{{title}}", "replacement": "My Post", "matchCount": 1 }
  ]
}
```

### Compare Versions
```json
{
  "path": "docs/readme.md",
  "previousContent": "# Old Content\n...",
  "contextLines": 5
}
```

## Sample Diff Output

```diff
--- notes/project.md	original
+++ notes/project.md	modified
@@ -1,7 +1,7 @@
 ---
 id: proj-001
 title: My Project
-status: draft
+status: published
 ---
 
 # My Project
@@ -10,6 +10,8 @@
 
 Description here.
 
+## New Section
+
 ## Tasks
```

## Safety Features

✅ **Pre-flight validation** - Check before applying  
✅ **Match count verification** - Ensure expected matches  
✅ **Line range validation** - Prevent out-of-bounds  
✅ **Section existence check** - Verify sections exist  
✅ **Code block protection** - Skip code when needed  
✅ **Dry run mode** - Preview without applying

## Workflow

1. **Validate** operations → `obsidian_validate_operations`
2. **Preview** diff → `obsidian_preview_diff`
3. **Review** output (user confirms)
4. **Apply** changes → `obsidian_apply_with_diff`

## Common Patterns

### Safe Batch Edit
```typescript
// 1. Validate
const validation = await validateOperations(path, operations);
if (!validation.valid) throw new Error('Invalid');

// 2. Preview
const preview = await previewDiff(path, operations);
console.log(preview.unified);

// 3. Apply
await applyWithDiff(path, operations, { dryRun: false });
```

### AI Edit Review
```typescript
const aiOps = generateAIEdits(content);
const diff = await previewDiff(path, aiOps);
if (userApproves(diff)) {
  await applyWithDiff(path, aiOps);
}
```

## Error Prevention

```json
{
  "type": "replace",
  "search": "text",
  "replacement": "new text",
  "matchCount": 1,          // Ensures exactly 1 match
  "skipCodeBlocks": true    // Protects code blocks
}
```

## Performance

- **Diff generation:** 5-20ms
- **Validation:** 1-3ms per operation
- **Simulation:** 1-5ms per operation
- **Memory:** Minimal (in-memory only)

## Implementation

**Service:** `apps/mcp/src/services/diff-preview.service.ts`  
**Tools:** `apps/mcp/src/mcp/obsidian/tools/diff_preview.ts`  
**Library:** `diff` v8.0.2 (BSD-3-Clause)

## Status

✅ **Fully Implemented**  
✅ **Type-checked**  
✅ **Built and Ready**  
✅ **5 Tools Active**

---

See `DIFF_PREVIEW_API.md` for complete documentation.
