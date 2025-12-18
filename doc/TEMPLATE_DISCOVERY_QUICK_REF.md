# Template Discovery API - Quick Reference

## MCP Tools

| Tool                                 | Purpose                     | Key Inputs                   |
| ------------------------------------ | --------------------------- | ---------------------------- |
| `obsidian_list_templates`            | List all templates          | `category?`, `forceRefresh?` |
| `obsidian_get_templates_by_category` | Group templates by category | None                         |
| `obsidian_get_template_info`         | Get detailed template info  | `template`                   |
| `obsidian_preview_template`          | Preview with variables      | `template`, `variables?`     |
| `obsidian_validate_template`         | Validate template structure | `template`                   |
| `obsidian_search_templates`          | Search templates            | `query`                      |

## Quick Examples

### List all templates

```json
{ "category": "tasks" }
```

### Get template details

```json
{ "template": "task-template" }
```

### Preview with variables

```json
{
  "template": "task-template",
  "variables": {
    "id": "TASK-001",
    "title": "My Task",
    "description": "Task description"
  }
}
```

### Search templates

```json
{ "query": "reward" }
```

### Validate template

```json
{ "template": "task-template" }
```

## Template Info Response

Each template provides:

- ✅ **Metadata**: name, path, category, description, tags
- ✅ **Variables**: name, type, required/optional, defaults
- ✅ **Frontmatter**: all YAML keys
- ✅ **Sections**: heading structure with levels
- ✅ **Conditionals**: presence of logic
- ✅ **Validation**: errors and warnings

## Variable Types (Auto-inferred)

| Type      | Name Patterns                  | Examples              |
| --------- | ------------------------------ | --------------------- |
| `date`    | date, time, at                 | dueDate, createdAt    |
| `number`  | count, number, priority, score | priority, itemCount   |
| `boolean` | enabled, is, has               | isCompleted, hasNotes |
| `array`   | tags, items, list              | tags, linkedItems     |
| `string`  | (default)                      | title, description    |

## Available Templates

### Tasks (`vault-data/templates/tasks/`)

- `task-template` - Full task structure
- `reward-template` - Milestone rewards
- `blocker-template` - Task blockers
- `need-template` - Dependencies
- `checklist-item-template` - Checklist items
- `history-entry-template` - Timeline entries

## Automatic Variables

Always available in previews:

- `date` - Current date (YYYY-MM-DD)
- `time` - Current time (HH:MM:SS)
- `datetime` - ISO 8601 timestamp
- `timestamp` - Unix timestamp

## Implementation Details

**Service:** `apps/mcp/src/services/template-discovery.service.ts`  
**Tools:** `apps/mcp/src/mcp/obsidian/tools/template_discovery.ts`  
**Registration:** `apps/mcp/src/mcp/obsidian/tools/index.ts`

**Cache TTL:** 60 seconds  
**Template Root:** `vault-data/templates/`

## Status

✅ **Fully Implemented**  
✅ **Type-checked**  
✅ **Built and Ready**  
✅ **All 6 Tools Active**

## Documentation

See `TEMPLATE_DISCOVERY_API.md` for complete documentation.
