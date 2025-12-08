# Content-Level Unified Diff Previews

**Status:** ✅ Implemented and Active  
**Impact:** High  
**Complexity:** Low-Medium

## Overview

The Unified Diff Preview system provides Git-style patch visualization for all note editing operations before they're applied. This eliminates "silent vault breakage" by showing exactly what will change across the entire file or targeted sections.

## What It Provides

Before applying any edit to a note, the system can show:
- **Unified diff format** (classic +/- patch format)
- **Full visibility** into what will be added, removed, or modified
- **Context lines** around changes for better understanding
- **Validation** of operations before application
- **Multi-operation** batch preview
- **Different modes**: full note, frontmatter only, content only, or section only

## Available MCP Tools

### 1. `obsidian_preview_diff`
**Purpose:** Preview operations as a unified diff without applying changes

**Input:**
- `path` (required): Relative path to the note
- `operations` (required): Array of operations to preview
- `mode` (optional, default: 'full'): Diff mode - 'full', 'frontmatter', 'content', or 'section'
- `contextLines` (optional, default: 3): Number of context lines around changes

**Returns:**
- Unified diff in Git patch format
- Statistics (additions, deletions, changes)
- Validation warnings
- Original and modified content

**Example:**
```json
{
  "path": "projects/my-project.md",
  "operations": [
    {
      "type": "replace",
      "search": "status: draft",
      "replacement": "status: published"
    },
    {
      "type": "insert",
      "line": 10,
      "replacement": "## New Section"
    }
  ],
  "mode": "full",
  "contextLines": 3
}
```

**Sample Output:**
```diff
--- projects/my-project.md	original
+++ projects/my-project.md	modified
@@ -1,7 +1,7 @@
 ---
 id: proj-001
 title: My Project
-status: draft
+status: published
 ---
 
 # My Project
@@ -8,6 +8,8 @@
 
 Project description here.
 
+## New Section
+
 ## Tasks
```

---

### 2. `obsidian_apply_with_diff`
**Purpose:** Apply operations and return both the diff preview and confirmation

**Input:**
- `path` (required): Relative path to the note
- `operations` (required): Array of operations to apply
- `mode` (optional, default: 'full'): Diff mode for preview
- `dryRun` (optional, default: false): If true, only preview without applying

**Returns:**
- Unified diff showing what was changed
- Confirmation of application
- Validation results
- Statistics

**Workflow:**
1. Validates all operations
2. Generates diff preview
3. If `dryRun: false`, applies changes
4. Returns diff and confirmation

**Example:**
```json
{
  "path": "notes/meeting.md",
  "operations": [
    {
      "type": "update_frontmatter",
      "frontmatter": {
        "date": "2024-12-06",
        "attendees": ["Alice", "Bob"]
      }
    }
  ],
  "dryRun": false
}
```

---

### 3. `obsidian_validate_operations`
**Purpose:** Validate operations without previewing or applying

**Input:**
- `path` (required): Relative path to the note
- `operations` (required): Array of operations to validate

**Returns:**
- Validation status (valid/invalid)
- List of errors (if any)
- List of warnings (if any)

**Checks:**
- Required fields present
- Search patterns exist in content
- Line numbers in valid range
- Sections exist
- Match counts accurate

**Example:**
```json
{
  "path": "tasks/task-001.md",
  "operations": [
    {
      "type": "replace",
      "search": "priority: 5",
      "replacement": "priority: 8",
      "matchCount": 1
    }
  ]
}
```

---

### 4. `obsidian_compare_versions`
**Purpose:** Compare current note content with a previous version

**Input:**
- `path` (required): Relative path to the note
- `previousContent` (required): Previous version of the note content
- `contextLines` (optional, default: 3): Number of context lines
- `mode` (optional, default: 'full'): What to compare

**Returns:**
- Unified diff between versions
- Statistics (additions, deletions)

**Use Cases:**
- Review changes after AI edits
- Compare with backups
- Audit modifications
- Track document evolution

**Example:**
```json
{
  "path": "docs/readme.md",
  "previousContent": "# Old Title\n\nOld content here.",
  "contextLines": 5,
  "mode": "full"
}
```

---

### 5. `obsidian_generate_structured_diff`
**Purpose:** Generate structured line-by-line diff for programmatic processing

**Input:**
- `path` (required): Relative path to the note
- `operations` (required): Array of operations to preview

**Returns:**
- Detailed line-by-line change information
- Summary statistics
- Structured data for each change (added/removed/unchanged)

**Use Cases:**
- Programmatic diff analysis
- Custom diff visualization
- Integration with external tools
- Detailed change tracking

---

## Operation Types

### replace
Replace text in the note
```json
{
  "type": "replace",
  "search": "old text",
  "replacement": "new text",
  "skipCodeBlocks": true,
  "matchCount": 1
}
```

### insert
Insert text at a specific line
```json
{
  "type": "insert",
  "line": 10,
  "replacement": "Text to insert"
}
```

### delete
Delete matching text
```json
{
  "type": "delete",
  "search": "text to remove",
  "matchCount": 1
}
```

### update_frontmatter
Update YAML frontmatter
```json
{
  "type": "update_frontmatter",
  "frontmatter": {
    "status": "published",
    "tags": ["updated", "reviewed"]
  }
}
```

### replace_section
Replace entire section content
```json
{
  "type": "replace_section",
  "section": "Overview",
  "replacement": "New section content here"
}
```

---

## Diff Modes

### full
Shows diff for the entire note (frontmatter + content)
```json
{ "mode": "full" }
```

### frontmatter
Shows diff for YAML frontmatter only
```json
{ "mode": "frontmatter" }
```

### content
Shows diff for content only (excludes frontmatter)
```json
{ "mode": "content" }
```

### section
Shows diff for specific section (future enhancement)
```json
{ "mode": "section" }
```

---

## Service Architecture

### DiffPreviewService
**Location:** `apps/mcp/src/services/diff-preview.service.ts`

**Key Features:**
- **Operation Simulation**: Simulates operations without writing to disk
- **Unified Diff Generation**: Uses `diff` library for proper patch format
- **Multi-mode Support**: Full, frontmatter, content, section
- **Validation**: Pre-flight checks for all operations
- **Context Lines**: Configurable context around changes
- **Structured Output**: Line-by-line change tracking

**Core Methods:**
```typescript
// Preview operations and generate diff
previewOperations(path, operations, mode, contextLines): Promise<DiffPreview>

// Simulate operations without writing
simulateOperations(content, operations, mode): Promise<string>

// Generate unified diff
generateDiff(original, modified, filename, contextLines, mode): DiffPreview

// Validate operations
validateOperations(content, operations): { valid, errors, warnings }

// Generate structured diff
generateStructuredDiff(original, modified): Change[]
```

---

## Why It Matters

### Before Diff Previews
- ❌ No visibility into global effects of multiple operations
- ❌ Risk of accidental content destruction
- ❌ Difficult to review AI-driven changes
- ❌ No way to audit batch edits
- ❌ Silent vault breakage during automation
- ❌ Hard to debug unexpected changes

### After Diff Previews
- ✅ **Safety**: See exactly what will change before applying
- ✅ **Visibility**: Full auditing for AI-driven changes
- ✅ **Git-Compatible**: Standard unified diff format
- ✅ **Batch Editing**: Preview multiple operations together
- ✅ **Debugging**: Clear visualization of changes
- ✅ **Confidence**: Apply changes with certainty
- ✅ **Rollback**: Easy to verify before committing

---

## Use Cases

### 1. Safe Batch Refactoring
```typescript
// Preview multiple tag updates
const preview = await previewDiff('notes/project.md', [
  { type: 'replace', search: '#old-tag', replacement: '#new-tag' },
  { type: 'replace', search: '[[Old Link]]', replacement: '[[New Link]]' },
  { type: 'update_frontmatter', frontmatter: { updated: '2024-12-06' } }
]);

// Review diff, then apply
if (userApproves(preview.unified)) {
  await applyWithDiff('notes/project.md', operations);
}
```

### 2. AI Edit Auditing
```typescript
// AI suggests edits
const aiOperations = generateAIEdits(note);

// Show diff to user before applying
const preview = await previewDiff(notePath, aiOperations);
console.log(preview.unified);

// User confirms
await applyWithDiff(notePath, aiOperations, { dryRun: false });
```

### 3. Template Variable Expansion
```typescript
// Preview template instantiation
const operations = [
  { type: 'replace', search: '{{title}}', replacement: 'My Document' },
  { type: 'replace', search: '{{date}}', replacement: '2024-12-06' },
  { type: 'replace', search: '{{author}}', replacement: 'John Doe' }
];

const preview = await previewDiff('templates/document.md', operations);
```

### 4. Metadata Cleanup
```typescript
// Bulk update frontmatter across notes
for (const note of notes) {
  const preview = await previewDiff(note.path, [
    { type: 'update_frontmatter', frontmatter: { 
      schema_version: '2.0',
      migrated: true 
    }}
  ]);
  
  if (preview.hasChanges) {
    await applyWithDiff(note.path, operations);
  }
}
```

### 5. Link Refactoring
```typescript
// Preview link updates
const preview = await previewDiff('index.md', [
  { type: 'replace', search: '[[oldpage]]', replacement: '[[newpage]]', matchCount: 5 },
  { type: 'replace', search: '[[another-old]]', replacement: '[[another-new]]', matchCount: 2 }
], { mode: 'content' });
```

---

## Integration with Git Workflows

### Commit Message Generation
```typescript
const diff = await previewDiff(path, operations);
const commitMessage = `Update ${path}\n\n${diff.unified}`;
```

### Pre-commit Hooks
```typescript
// Validate all pending operations before commit
for (const change of pendingChanges) {
  const validation = await validateOperations(change.path, change.operations);
  if (!validation.valid) {
    throw new Error(`Invalid operations: ${validation.errors.join(', ')}`);
  }
}
```

### Change Review
```typescript
// Generate diffs for all modified notes
const reviews = await Promise.all(
  modifiedNotes.map(note => 
    compareVersions(note.path, note.previousContent)
  )
);
```

---

## Error Prevention

### Match Count Validation
```typescript
{
  type: 'replace',
  search: 'status: draft',
  replacement: 'status: published',
  matchCount: 1  // Ensures exactly one match
}
```

### Line Range Validation
```typescript
{
  type: 'insert',
  line: 100,  // Validated against actual line count
  replacement: 'New content'
}
```

### Section Existence Check
```typescript
{
  type: 'replace_section',
  section: 'Overview',  // Validates section exists
  replacement: 'Updated overview'
}
```

### Code Block Protection
```typescript
{
  type: 'replace',
  search: 'function',
  replacement: 'method',
  skipCodeBlocks: true  // Won't replace inside ```blocks```
}
```

---

## Performance

**Diff Generation:** ~5-20ms per note (depends on size)  
**Operation Simulation:** ~1-5ms per operation  
**Validation:** ~1-3ms per operation  
**Memory:** Minimal (operations simulate in-memory)

**Optimization Tips:**
1. Use targeted modes (`frontmatter`, `content`) for faster diffs
2. Reduce `contextLines` for large files
3. Batch operations together
4. Validate once before previewing

---

## Examples

### Example 1: Simple Text Replace with Preview
```json
{
  "path": "docs/api.md",
  "operations": [
    {
      "type": "replace",
      "search": "Version 1.0",
      "replacement": "Version 2.0",
      "matchCount": 3
    }
  ]
}
```

**Output:**
```diff
--- docs/api.md	original
+++ docs/api.md	modified
@@ -5,7 +5,7 @@
 # API Documentation
 
-Version 1.0
+Version 2.0
 
 ## Endpoints
```

### Example 2: Frontmatter Update
```json
{
  "path": "blog/post.md",
  "operations": [
    {
      "type": "update_frontmatter",
      "frontmatter": {
        "published": true,
        "date": "2024-12-06",
        "tags": ["announcement", "release"]
      }
    }
  ],
  "mode": "frontmatter"
}
```

**Output:**
```diff
--- blog/post.md	original
+++ blog/post.md	modified
@@ -1,5 +1,7 @@
 ---
 title: My Post
-published: false
+published: true
+date: 2024-12-06
+tags: [announcement, release]
 ---
```

### Example 3: Multi-Operation Batch
```json
{
  "path": "tasks/sprint.md",
  "operations": [
    {
      "type": "update_frontmatter",
      "frontmatter": { "status": "in-progress" }
    },
    {
      "type": "replace_section",
      "section": "Progress",
      "replacement": "50% complete\n\n- [x] Task 1\n- [ ] Task 2"
    },
    {
      "type": "insert",
      "line": 20,
      "replacement": "## Blockers\n\nNone currently."
    }
  ]
}
```

---

## Comparison with Other Tools

| Feature | Diff Preview | structured_patch | Direct Edit |
|---------|-------------|------------------|-------------|
| Unified diff format | ✅ | ⚠️ Basic | ❌ |
| Multiple operations | ✅ | ✅ | ❌ |
| Pre-flight validation | ✅ | ✅ | ❌ |
| Context lines | ✅ | ❌ | ❌ |
| Different modes | ✅ | ❌ | ❌ |
| Git-compatible | ✅ | ❌ | ❌ |
| Dry run | ✅ | ✅ | ❌ |
| Version comparison | ✅ | ❌ | ❌ |

---

## Future Enhancements

### Potential Additions
1. **Syntax Highlighting**: Colorized diff output
2. **Interactive Review**: Step-through changes with accept/reject
3. **Conflict Detection**: Identify overlapping operations
4. **Undo/Redo**: Track operation history
5. **Diff Export**: Save diffs to files
6. **Side-by-Side View**: Visual comparison mode
7. **Change Statistics**: Detailed metrics per operation
8. **Automatic Backup**: Create backups before applying

### API Extensions
- `suggestOperations(intent)` - AI-powered operation generation
- `optimizeOperations(operations)` - Merge redundant operations
- `revertDiff(path, diff)` - Undo changes from diff
- `applyPatch(path, patchFile)` - Apply standard patch files
- `generateChangeLog(diffs[])` - Summarize multiple diffs

---

## Dependencies

**Library:** `diff` (v8.0.2)  
**Type Definitions:** Built-in with library  
**Size:** ~15KB minified  
**License:** BSD-3-Clause

---

## Conclusion

The Content-Level Unified Diff Preview system provides enterprise-grade change visibility for all vault operations. By showing exactly what will change before applying modifications, it eliminates the risk of silent breakage and enables confident automation of complex editing workflows.

**Key Benefits:**
- 🛡️ Safety through visibility
- 📊 Full audit trail for changes
- 🔄 Git-compatible workflows
- 🤖 Safe AI-driven editing
- 🐛 Easy debugging
- ✅ Confident batch operations

**Status:** ✅ Production ready with 5 active MCP tools and comprehensive service layer.
