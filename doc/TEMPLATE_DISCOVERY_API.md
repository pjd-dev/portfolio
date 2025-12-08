# Template Discovery API

**Status:** ✅ Implemented and Active  
**Impact:** High  
**Complexity:** Low–Medium

## Overview

The Template Discovery API provides a comprehensive set of MCP tools that allow clients to discover, inspect, validate, and preview all available templates in the vault without needing prior knowledge of template names or structures.

## What It Provides

A direct endpoint system that enables the MCP to:
- List all available templates with metadata
- Read template structures and analyze their components
- Surface required and optional fields/variables
- Preview templates with variable substitution
- Validate template integrity and structure

## Available MCP Tools

### 1. `obsidian_list_templates`
**Purpose:** Discover all available templates in the vault

**Input:**
- `category` (optional): Filter by category (e.g., 'tasks', 'notes')
- `forceRefresh` (optional, default: false): Force refresh template cache

**Returns:**
- List of templates with name, path, category, description, and tags
- Total count of templates found

**Example:**
```json
{
  "category": "tasks",
  "forceRefresh": false
}
```

---

### 2. `obsidian_get_templates_by_category`
**Purpose:** Get all templates organized by category for easier browsing

**Input:** None

**Returns:**
- Templates grouped by category
- List of all categories
- Count per category

---

### 3. `obsidian_get_template_info`
**Purpose:** Get detailed information about a specific template

**Input:**
- `template` (required): Template name or path

**Returns:**
- **Metadata:** Name, path, category, description, tags, author, version
- **Variables:** List of all template variables with:
  - Name
  - Type (string, number, date, boolean, array)
  - Required/optional status
  - Default values
  - Descriptions
- **Frontmatter Keys:** All YAML frontmatter fields
- **Sections:** Markdown heading structure with levels and placeholder indicators
- **Conditionals:** Whether template contains conditional logic

**Example:**
```json
{
  "template": "task-template"
}
```

**Sample Response Structure:**
```markdown
# Template: task-template

**Category:** tasks
**Path:** tasks/task-template.md
**Description:** Standard task template with full metadata

## Variables

### Required
- **{{id}}** (string)
- **{{title}}** (string)
- **{{description}}** (string)

### Optional
- **{{priority}}** (number)
  Default: 5
- **{{dueDate}}** (date)

## Frontmatter Keys
- id
- title
- description
- priority
- dueDate
- effortScore
- focusCost
- started
- completed

## Sections
- # {{title}}
- ## Overview 🔖
- ## Progress
  - ### Checklist 🔖
  - ### Dependencies
- ## Metrics
```

---

### 4. `obsidian_preview_template`
**Purpose:** Render a template preview with variable substitution without creating a note

**Input:**
- `template` (required): Template name or path
- `variables` (optional): Key-value pairs for variable substitution

**Returns:**
- Fully rendered template with variables substituted
- Original template name and provided variables

**Automatic Variables:**
- `date`: Current date (YYYY-MM-DD)
- `time`: Current time (HH:MM:SS)
- `datetime`: ISO 8601 timestamp
- `timestamp`: Unix timestamp

**Example:**
```json
{
  "template": "task-template",
  "variables": {
    "id": "TASK-001",
    "title": "Implement Authentication",
    "description": "Add user authentication system",
    "priority": "8",
    "effortScore": "7",
    "focusCost": "6"
  }
}
```

---

### 5. `obsidian_validate_template`
**Purpose:** Validate template structure and check for issues

**Input:**
- `template` (required): Template name or path to validate

**Returns:**
- **Valid:** Boolean indicating if template is valid
- **Errors:** Critical issues that prevent template usage:
  - Invalid YAML frontmatter
  - Unclosed placeholders (missing `}}`)
  - Unmatched closing braces
- **Warnings:** Non-critical issues:
  - Missing frontmatter
  - Required variables without defaults
  - Empty sections

**Example:**
```json
{
  "template": "task-template"
}
```

**Sample Response:**
```markdown
# Template Validation: task-template

✅ Template is valid

## Warnings
- Template requires 3 variable(s): id, title, description
```

---

### 6. `obsidian_search_templates`
**Purpose:** Search for templates by name, description, tags, or category

**Input:**
- `query` (required): Search query string

**Returns:**
- List of matching templates
- Total count of results

**Example:**
```json
{
  "query": "task"
}
```

---

## Service Architecture

### TemplateDiscoveryService
**Location:** `apps/mcp/src/services/template-discovery.service.ts`

**Key Features:**
- **Caching:** Templates are cached for 1 minute to reduce filesystem I/O
- **Auto-discovery:** Scans `vault-data/templates/` directory recursively
- **Variable Extraction:** Parses `{{variable}}` patterns from template content
- **Type Inference:** Automatically infers variable types from naming conventions
- **Section Parsing:** Extracts markdown heading hierarchy
- **Conditional Detection:** Identifies Handlebars-style conditionals
- **YAML Validation:** Parses and validates frontmatter

**Cache Strategy:**
- Cache TTL: 60 seconds
- Force refresh available via `forceRefresh` parameter
- Automatic invalidation on cache miss

### Variable Type Inference

The service automatically infers variable types based on naming conventions:

| Pattern | Type | Examples |
|---------|------|----------|
| Contains "date" or "time" | `date` | `dueDate`, `createdAt`, `timestamp` |
| Contains "count", "number", "priority" | `number` | `priority`, `itemCount`, `score` |
| Contains "enabled", "is", "has" | `boolean` | `isCompleted`, `hasNotes` |
| Contains "tags", "items", "list" | `array` | `tags`, `linkedItems` |
| Default | `string` | `title`, `description`, `name` |

---

## Template Structure

### Standard Template Format

```markdown
---
id: {{id}}
title: {{title}}
description: {{description}}
tags:
  - {{tag1}}
  - {{tag2}}
---

# {{title}}

{{description}}

## Section Name

<!-- Comment explaining variable -->
Content with {{placeholder}}

## Conditional Example

{{#if condition}}
This content appears if condition is true
{{else}}
Alternative content
{{/if}}
```

### Template Metadata

Templates can include metadata in their frontmatter:

```yaml
---
# Template Variables (placeholders)
id: {{id}}
title: {{title}}

# Template Documentation (optional)
description: "This template is for..."
tags: ["template", "category"]
author: "Your Name"
version: "1.0.0"
---
```

---

## Current Template Inventory

### Tasks Category (`vault-data/templates/tasks/`)

1. **task-template.md** - Complete task structure with all fields
2. **reward-template.md** - Milestone rewards for tasks
3. **blocker-template.md** - Task blockers and impediments
4. **need-template.md** - Task dependencies and prerequisites
5. **checklist-item-template.md** - Individual checklist items
6. **history-entry-template.md** - Task timeline entries

---

## Why It Matters

### Before Template Discovery
- ❌ Users had to memorize template names
- ❌ No visibility into required vs. optional fields
- ❌ Trial-and-error to discover variables
- ❌ Manual inspection of template files
- ❌ Difficult to ensure template correctness

### After Template Discovery
- ✅ **Speed:** Instant access to all templates and their requirements
- ✅ **Accuracy:** Prevent template-field mismatches with validation
- ✅ **Automation:** Enable intelligent template selection based on context
- ✅ **Discoverability:** Full template catalog without documentation
- ✅ **Reliability:** Validate templates before use
- ✅ **Developer Experience:** Build UIs with autocomplete and guided flows

---

## Use Cases

### 1. Interactive Note Creation
```
User: "Create a new task"
AI: *Lists available task templates*
User: "Use task-template"
AI: *Gets template info, identifies required fields*
AI: "I need: id, title, and description. What should they be?"
User: *Provides values*
AI: *Previews template, validates, then creates note*
```

### 2. Template Validation in CI/CD
```bash
# Validate all templates before deployment
for template in $(list_templates); do
  validate_template $template || exit 1
done
```

### 3. Auto-completion in IDEs
```typescript
// Get template variables for autocomplete
const info = await getTemplateInfo('task-template');
const requiredVars = info.variables.filter(v => v.required);
// Show autocomplete UI with required variables
```

### 4. Smart Template Selection
```typescript
// Find the best template based on context
const templates = await searchTemplates('task');
const filtered = templates.filter(t => 
  t.category === 'tasks' && 
  t.tags.includes('project')
);
```

### 5. Documentation Generation
```typescript
// Auto-generate template documentation
const byCategory = await getTemplatesByCategory();
for (const [category, templates] of Object.entries(byCategory)) {
  console.log(`## ${category}`);
  for (const template of templates) {
    const info = await getTemplateInfo(template.name);
    console.log(`### ${template.name}`);
    console.log(`Variables: ${info.variables.length}`);
  }
}
```

---

## Integration Points

### MCP Server Registration
Templates are registered in `apps/mcp/src/mcp/obsidian/tools/index.ts`:

```typescript
import { 
  ListTemplatesTool, 
  GetTemplatesByCategoryTool, 
  GetTemplateInfoTool, 
  PreviewTemplateTool, 
  ValidateTemplateTool, 
  SearchTemplatesTool 
} from "./template_discovery.js";

export default [
  // ... other tools
  ListTemplatesTool,
  GetTemplatesByCategoryTool,
  GetTemplateInfoTool,
  PreviewTemplateTool,
  ValidateTemplateTool,
  SearchTemplatesTool,
] as McpToolDef[];
```

### Service Singleton
```typescript
import { templateDiscoveryService } from '../services/template-discovery.service.js';

// Use throughout the application
const templates = await templateDiscoveryService.discoverTemplates();
const info = await templateDiscoveryService.getTemplateInfo('task-template');
```

---

## Future Enhancements

### Potential Additions
1. **Template Validation Rules:** Custom validation rules per template type
2. **Variable Constraints:** Min/max values, regex patterns, allowed values
3. **Template Versioning:** Track template changes and migrations
4. **Template Inheritance:** Base templates with extensions
5. **Dynamic Variables:** Computed variables based on other values
6. **Template Marketplace:** Share and download community templates
7. **Visual Template Editor:** GUI for creating/editing templates
8. **Template Analytics:** Usage tracking and popular templates

### API Extensions
- `getTemplateUsage(template)` - Track how often templates are used
- `suggestTemplateByContext(context)` - AI-powered template recommendation
- `compareTemplates(template1, template2)` - Diff two templates
- `mergeTemplates(templates[])` - Combine multiple templates
- `exportTemplate(template, format)` - Export to JSON, YAML, etc.

---

## Performance

### Caching Strategy
- **Initial Discovery:** ~50-100ms (depends on template count)
- **Cached Access:** ~1-5ms
- **Cache Duration:** 60 seconds
- **Memory Footprint:** ~1KB per template

### Optimization Tips
1. Use `forceRefresh: false` by default
2. Cache template info client-side when possible
3. Use category filtering to reduce result sets
4. Batch template operations when fetching multiple templates

---

## Error Handling

### Common Errors

**Template Not Found:**
```json
{
  "content": [{ "type": "text", "text": "Template not found: unknown-template" }],
  "isError": true
}
```

**Invalid YAML:**
```json
{
  "valid": false,
  "errors": ["Invalid frontmatter YAML: Unexpected token"],
  "warnings": []
}
```

**Missing Variables:**
```json
{
  "valid": true,
  "errors": [],
  "warnings": ["Template requires 3 variable(s): id, title, description"]
}
```

---

## Testing

### Manual Testing
```bash
# Start the MCP server
cd apps/mcp
pnpm dev

# In another terminal, use MCP client to test
curl -X POST http://localhost:4000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "obsidian_list_templates",
      "arguments": {}
    },
    "id": 1
  }'
```

### Automated Testing
```typescript
import { templateDiscoveryService } from './services/template-discovery.service';

// Test template discovery
const templates = await templateDiscoveryService.discoverTemplates();
console.assert(templates.length > 0, 'Should find templates');

// Test template info
const info = await templateDiscoveryService.getTemplateInfo('task-template');
console.assert(info !== null, 'Should find task template');
console.assert(info.variables.length > 0, 'Should have variables');

// Test validation
const validation = await templateDiscoveryService.validateTemplate('task-template');
console.assert(validation.valid, 'Task template should be valid');

// Test preview
const preview = await templateDiscoveryService.previewTemplate('task-template', {
  id: 'TEST-001',
  title: 'Test Task',
  description: 'Test description'
});
console.assert(preview.includes('TEST-001'), 'Should substitute variables');
```

---

## Conclusion

The Template Discovery API is now fully implemented and active. All six MCP tools are registered and available for use. The system provides comprehensive template introspection, validation, and preview capabilities that enable automated, intelligent note creation workflows.

**Next Steps:**
1. Build UI/UX tools leveraging the API
2. Implement guided note creation flows
3. Add template analytics and usage tracking
4. Consider template marketplace functionality
5. Develop visual template editor
