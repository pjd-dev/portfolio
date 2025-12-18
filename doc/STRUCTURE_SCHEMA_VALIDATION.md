# Section-Level Schema Validation

Enforce structural contracts on note bodies. Define required headings, content rules, and validation logic for each note type (meeting, project, research, etc.).

## Core Concept

Every note type can have a schema that defines:

- **Required headings** - Sections that must exist
- **Content rules** - What each section must contain
- **Structure validation** - Heading hierarchy and order
- **Auto-fix capability** - Insert missing sections automatically

This bridges the gap between "PKM" and "structured knowledge system" by enforcing consistent note structure.

## Architecture

### Schema Storage

```
.vault-schemas/
  meeting.json
  project.json
  research-note.json
  index.json (optional)
```

### Schema Model

```typescript
interface NoteStructureSchema {
  id: string;
  title: string;
  description?: string;

  appliesTo?: {
    frontmatter?: {
      type?: string | string[];
      tags?: string | string[];
      status?: string | string[];
    };
    pathPattern?: string; // glob pattern
  };

  headings: HeadingRule[];
  allowUnknownHeadings?: boolean;
}
```

### Heading Rules

```typescript
interface HeadingRule {
  id: string;
  title: string;
  level: number; // 1-6 for # to ######
  text: string; // Heading text to match
  matchMode?: 'equals' | 'startsWith' | 'regex';
  required?: boolean;
  unique?: boolean;
  order?: number;
  children?: HeadingRule[]; // Nested headings
  contentRules?: ContentRule[];
}
```

### Content Rules

```typescript
interface ContentRule {
  id: string;
  type:
    | 'nonEmpty'
    | 'regex'
    | 'todoList'
    | 'bulletList'
    | 'numberedList'
    | 'codeBlock'
    | 'maxLength'
    | 'minLength';
  message?: string;
  pattern?: string; // for regex
  language?: string; // for codeBlock
  minItems?: number; // for lists
  maxItems?: number;
  maxLength?: number;
  minLength?: number;
}
```

## MCP Tools

### obsidian_list_schemas

List all available structure schemas.

**Input:**

```json
{}
```

**Output:**

```json
{
  "schemas": [
    {
      "id": "meeting",
      "title": "Meeting Note",
      "description": "Standard structure for meeting notes"
    }
  ]
}
```

### obsidian_get_schema

Get complete schema definition.

**Input:**

```json
{
  "id": "meeting"
}
```

**Output:**
Full `NoteStructureSchema` with all heading rules and content validation.

### obsidian_validate_note_structure

Validate note against its schema.

**Input:**

```json
{
  "path": "meetings/2024-12-06-standup.md",
  "schemaId": "meeting" // optional, auto-detected if omitted
}
```

**Output:**

```json
{
  "schemaId": "meeting",
  "valid": false,
  "issues": [
    {
      "severity": "error",
      "code": "MISSING_HEADING",
      "message": "Required heading \"Decisions\" not found",
      "path": "meetings/2024-12-06-standup.md",
      "sectionId": "decisions",
      "headingText": "Decisions",
      "headingLevel": 2
    }
  ]
}
```

### obsidian_fix_note_structure

Auto-fix note structure to match schema.

**Input:**

```json
{
  "path": "meetings/2024-12-06-standup.md",
  "schemaId": "meeting",
  "fixOptions": {
    "insertMissingHeadings": true,
    "reorderHeadings": true,
    "createEmptySections": true,
    "removeUnknownHeadings": false
  },
  "previewOnly": true
}
```

**Output (preview):**

```json
{
  "schemaId": "meeting",
  "previewDiff": "unified diff...",
  "issuesBefore": [...]
}
```

**Output (applied):**

```json
{
  "schemaId": "meeting",
  "applied": true,
  "issuesBefore": [...],
  "issuesAfter": []
}
```

## Validation Rules

### Match Modes

**equals** (default)

```json
{
  "text": "Context",
  "matchMode": "equals"
}
```

Matches: `## Context` exactly (case-insensitive)

**startsWith**

```json
{
  "text": "Meeting",
  "matchMode": "startsWith"
}
```

Matches: `## Meeting Notes`, `## Meeting Summary`, etc.

**regex**

```json
{
  "text": "^(Context|Background)$",
  "matchMode": "regex"
}
```

Matches: `## Context` or `## Background`

### Content Rule Types

**nonEmpty**

```json
{
  "type": "nonEmpty",
  "message": "Section must not be empty"
}
```

**regex**

```json
{
  "type": "regex",
  "pattern": "^Date:\\s*\\d{4}-\\d{2}-\\d{2}",
  "message": "Must contain date in format YYYY-MM-DD"
}
```

**todoList**

```json
{
  "type": "todoList",
  "minItems": 1,
  "message": "At least one action item required"
}
```

Validates: `- [ ] task` or `- [x] completed`

**bulletList**

```json
{
  "type": "bulletList",
  "minItems": 2,
  "message": "List at least two items"
}
```

Validates: `- item` or `* item`

**numberedList**

```json
{
  "type": "numberedList",
  "minItems": 1
}
```

Validates: `1. item`, `2. item`, etc.

**codeBlock**

```json
{
  "type": "codeBlock",
  "language": "typescript",
  "message": "Must include TypeScript code example"
}
```

Validates: ` ```typescript ... ``` `

**maxLength / minLength**

```json
{
  "type": "minLength",
  "minLength": 50,
  "message": "Overview should be at least 50 characters"
}
```

## Schema Examples

### Meeting Note Schema

```json
{
  "id": "meeting",
  "title": "Meeting Note",
  "appliesTo": {
    "frontmatter": {
      "type": "meeting"
    }
  },
  "headings": [
    {
      "id": "context",
      "level": 2,
      "text": "Context",
      "required": true,
      "contentRules": [{ "type": "nonEmpty" }]
    },
    {
      "id": "decisions",
      "level": 2,
      "text": "Decisions",
      "required": true,
      "contentRules": [{ "type": "nonEmpty" }]
    },
    {
      "id": "actions",
      "level": 2,
      "text": "Actions",
      "required": true,
      "contentRules": [
        {
          "type": "todoList",
          "minItems": 1
        }
      ]
    }
  ]
}
```

### Project Note Schema

```json
{
  "id": "project",
  "title": "Project Note",
  "appliesTo": {
    "frontmatter": {
      "type": "project"
    }
  },
  "headings": [
    {
      "id": "overview",
      "level": 2,
      "text": "Overview",
      "required": true,
      "contentRules": [
        { "type": "nonEmpty" },
        { "type": "minLength", "minLength": 50 }
      ]
    },
    {
      "id": "scope",
      "level": 2,
      "text": "Scope",
      "required": true,
      "children": [
        {
          "id": "in_scope",
          "level": 3,
          "text": "In Scope",
          "required": true,
          "contentRules": [{ "type": "bulletList", "minItems": 1 }]
        }
      ]
    },
    {
      "id": "risks",
      "level": 2,
      "text": "Risks",
      "required": true,
      "contentRules": [{ "type": "bulletList", "minItems": 1 }]
    },
    {
      "id": "next_actions",
      "level": 2,
      "text": "Next Actions",
      "required": true,
      "contentRules": [{ "type": "todoList", "minItems": 1 }]
    }
  ]
}
```

## Usage Examples

### Example 1: Validate Meeting Note

```typescript
// Auto-detect schema from frontmatter
const result = await obsidian_validate_note_structure({
  path: 'meetings/2024-12-06-standup.md',
});

if (!result.valid) {
  console.log('Issues found:', result.issues);

  // Preview fix
  const preview = await obsidian_fix_note_structure({
    path: 'meetings/2024-12-06-standup.md',
    previewOnly: true,
  });

  // Apply fix
  await obsidian_fix_note_structure({
    path: 'meetings/2024-12-06-standup.md',
  });
}
```

### Example 2: Validate Project Structure

```typescript
const result = await obsidian_validate_note_structure({
  path: 'projects/vault-platform.md',
  schemaId: 'project',
});

// Check specific issues
const missingHeadings = result.issues.filter(
  (i) => i.code === 'MISSING_HEADING'
);

const emptySections = result.issues.filter((i) => i.code === 'EMPTY_SECTION');
```

### Example 3: Validate All Notes of Type

```typescript
// Get all meeting notes
const meetings = await obsidian_list_notes({
  filter: { type: 'meeting' },
});

// Validate each
for (const note of meetings) {
  const result = await obsidian_validate_note_structure({
    path: note.path,
    schemaId: 'meeting',
  });

  if (!result.valid) {
    console.log(`${note.path}: ${result.issues.length} issues`);
  }
}
```

### Example 4: Create and Validate

```typescript
// Create note from template
await obsidian_conversational_template({
  type: "meeting",
  variables: { ... }
});

// Validate structure
const result = await obsidian_validate_note_structure({
  path: "meetings/new-meeting.md"
});

// Auto-fix if needed
if (!result.valid) {
  await obsidian_fix_note_structure({
    path: "meetings/new-meeting.md"
  });
}
```

## Integration Points

### With Templates

```typescript
// After template creation, validate
const created = await obsidian_conversational_template({ ... });

await obsidian_validate_note_structure({
  path: created.path
});
```

### With Pipelines

Add validation as pipeline step:

```json
{
  "type": "validateStructure",
  "path": "projects/X.md",
  "schemaId": "project",
  "onFail": "abort"
}
```

### With Refactor

```typescript
// Validate before refactor
const before = await obsidian_validate_note_structure({ path });

// Refactor
await obsidian_refactor_note({ ... });

// Validate after
const after = await obsidian_validate_note_structure({ path });

if (after.issues.length > before.issues.length) {
  console.warn("Refactor introduced new issues");
}
```

## Validation Codes

| Code                          | Severity | Meaning                     |
| ----------------------------- | -------- | --------------------------- |
| `MISSING_HEADING`             | error    | Required heading not found  |
| `DUPLICATE_HEADING`           | error    | Heading should be unique    |
| `EMPTY_SECTION`               | error    | Required section is empty   |
| `CONTENT_PATTERN_MISMATCH`    | error    | Content doesn't match regex |
| `INSUFFICIENT_TODO_ITEMS`     | error    | Not enough todo items       |
| `INSUFFICIENT_BULLET_ITEMS`   | error    | Not enough bullet items     |
| `INSUFFICIENT_NUMBERED_ITEMS` | error    | Not enough numbered items   |
| `MISSING_CODE_BLOCK`          | error    | Required code block missing |
| `CONTENT_TOO_LONG`            | warning  | Content exceeds max length  |
| `CONTENT_TOO_SHORT`           | warning  | Content below min length    |
| `UNKNOWN_HEADING`             | warning  | Heading not in schema       |

## Auto-Fix Capabilities

### What Can Be Fixed

✅ **Missing headings** - Insert at appropriate location  
✅ **Heading order** - Reorder to match schema  
✅ **Empty sections** - Create placeholder content  
⚠️ **Unknown headings** - Can remove if configured

### What Cannot Be Fixed

❌ **Empty required content** - Needs manual input  
❌ **Missing todo items** - Needs user decisions  
❌ **Wrong content type** - Needs restructuring

### Fix Preview

Always use `previewOnly: true` first:

```typescript
const preview = await obsidian_fix_note_structure({
  path: 'note.md',
  previewOnly: true,
});

console.log(preview.previewDiff); // Review changes

// Then apply
await obsidian_fix_note_structure({
  path: 'note.md',
});
```

## Schema Detection

### Auto-Detection

Schema automatically detected from:

1. **Frontmatter type:**

```yaml
---
type: meeting
---
```

Matches schema with `appliesTo.frontmatter.type: "meeting"`

2. **Frontmatter tags:**

```yaml
---
tags: [meeting, standup]
---
```

Matches schema with `appliesTo.frontmatter.tags: "meeting"`

3. **Path pattern:**

```json
{
  "appliesTo": {
    "pathPattern": "meetings/**"
  }
}
```

Matches any note in `meetings/` directory

### Manual Override

```typescript
// Force specific schema
await obsidian_validate_note_structure({
  path: 'note.md',
  schemaId: 'meeting', // Override auto-detection
});
```

## Performance

### Schema Loading

- **Lazy**: Loaded on first use
- **Cached**: Kept in memory after load
- **Fast**: JSON parsing only

### Validation

- **Single pass**: O(n) where n = sections
- **Efficient matching**: Regex compiled once
- **Minimal memory**: Sections flattened

### Auto-Fix

- **Preview**: Uses diff-preview service
- **Apply**: Single file write
- **Fast**: O(m) where m = missing headings

## Best Practices

### Schema Design

1. **Start simple** - Add rules incrementally
2. **Use required sparingly** - Only critical sections
3. **Provide good messages** - Help users understand issues
4. **Allow flexibility** - Set `allowUnknownHeadings: true`
5. **Test thoroughly** - Validate against real notes

### Validation Workflow

1. **Validate on creation** - Check new notes immediately
2. **Validate before commit** - Ensure quality
3. **Batch validate** - Check all notes periodically
4. **Auto-fix cautiously** - Preview before applying

### Content Rules

1. **nonEmpty for critical sections** - Context, decisions
2. **todoList for actions** - Ensure actionability
3. **minLength for overviews** - Encourage detail
4. **bulletList for lists** - Structure consistency

## Error Handling

### Schema Not Found

```typescript
try {
  await obsidian_validate_note_structure({ path });
} catch (error) {
  // "No schema detected for note"
  // Either add frontmatter type or specify schemaId
}
```

### Invalid Schema File

- Logged to console
- Schema skipped
- Other schemas still load

### Validation Errors

- Returned as structured issues
- Grouped by severity
- Include line numbers

## Future Enhancements

### Planned

- Heading order enforcement
- Section reordering in auto-fix
- Custom validators (JavaScript functions)
- Schema inheritance
- Conditional rules

### Possible

- Multi-schema support (note matches multiple)
- Schema versioning and migration
- Visual schema editor
- Validation reports/dashboards
- Pre-commit hooks

## Why This Matters

### Before Structure Schemas

- Inconsistent note structure
- Missing critical sections
- Hard to query/analyze
- Manual quality checks
- Template drift

### After Structure Schemas

- ✅ Enforced structure
- ✅ Complete required sections
- ✅ Queryable and analyzable
- ✅ Automated validation
- ✅ Consistent templates

This bridges PKM → Structured Knowledge System.

---

**With section-level schema validation, your vault becomes a structured knowledge base with enforceable contracts on note types.**
