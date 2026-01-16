# Template Usage Guide for MCP LLM Agents

## Overview

All note templates are stored in `_system/templates/` within the vault. The MCP server automatically discovers and loads these templates, ensuring any LLM using the MCP uses the correct, COD/Avatar/World-compliant templates.

## How It Works

1. **Template Discovery**: The `templateDiscoveryService` automatically scans `_system/templates/` and caches all available templates
2. **Template Creation**: The `obsidian_create_from_template` tool loads templates dynamically from the vault
3. **No Hardcoding**: Templates are not hardcoded in the MCP code - they're loaded from the vault at runtime

## Available Templates

### Task Management

- **task-template** (`tasks/task-template.md`)
  - Full COD/Avatar/World support
  - Fields: status, priority, effortScore, focusCost, avatar_rewards, adhd, compound
  - Use for: Any actionable work item

- **goal-template** (`goals/goal-template.md`)
  - COD/Avatar support with avatar_rewards
  - Fields: active, priority, avatar_rewards, compound, adhd
  - Use for: High-level objectives and outcomes

### Check-ins & Events

- **daily-checkin-template** (`checkins/daily-checkin-template.md`)
  - Captures human state and world signals
  - Fields: avatar vitals, world signals, availability windows
  - Use for: Daily morning/moment check-ins

- **event-template** (`events/event-template.md`)
  - Records significant events with avatar rewards
  - Fields: avatar_rewards, adhd, impacts
  - Use for: Milestone completion, important occurrences

### Learning & Knowledge

- **learning-template** (`learning/learning-template.md`)
  - Tracks learning objectives and progress
  - Fields: status, progress, objective, plan
  - Use for: Skill development, courses, tutorials

- **knowledge-template** (`knowledge/knowledge-template.md`)
  - Documents facts, decisions, patterns
  - Fields: status, summary, references
  - Use for: Knowledge base entries, decisions

### Documentation

- **tech-note-template** (`notes/tech-note-template.md`)
  - Technical documentation
  - Use for: Implementation notes, architecture decisions

- **research-note-template** (`notes/research-note-template.md`)
  - Research findings and analysis
  - Use for: Investigation results, analysis

- **implementation-summary-template** (`notes/implementation-summary-template.md`)
  - Project completion summaries
  - Use for: Feature delivery documentation

- **spec-template** (`specs/spec-template.md`)
  - Technical specifications
  - Use for: Detailed technical specs

- **product-spec-template** (`specs/product-spec-template.md`)
  - Product specifications
  - Use for: Product requirements, user stories

### Job Hunting

- **job-lead-template** (`job-hunting/job-lead-template.md`)
  - Job opportunity tracking
  - Fields: company, role, status, fit_score, application strategy
  - Use for: Job applications, opportunity tracking

- **outreach-template** (`job-hunting/outreach-template.md`)
  - Networking contact tracking
  - Fields: contact_name, company, platform, status, message
  - Use for: Networking, cold outreach

## Usage Examples

### Discovering Available Templates

```typescript
// List all templates by category
const result = await mcp.call('obsidian_get_templates_by_category', {});

// Get detailed info about a specific template
const info = await mcp.call('obsidian_get_template_info', {
  template: 'task-template',
});

// Search for templates
const search = await mcp.call('obsidian_search_templates', {
  query: 'job hunting',
});
```

### Creating Notes from Templates

```typescript
// Create a task
await mcp.call('obsidian_create_from_template', {
  templateName: 'task-template',
  notePath: 'tasks/implement-feature-x.md',
  variables: {
    title: 'Implement Feature X',
    status: 'todo',
    priority: '0.8',
    effortScore: '5',
    focusCost: '3',
    health_delta: '0',
    notoriety_delta: '2',
    money_delta: '0',
    money_currency: 'EUR',
    xp_delta: '50',
  },
});

// Create a job lead
await mcp.call('obsidian_create_from_template', {
  templateName: 'job-lead-template',
  notePath: 'job-hunting/leads/acme-corp-senior-dev.md',
  variables: {
    company: 'ACME Corp',
    role: 'Senior Developer',
    location: 'Remote',
    remote: 'true',
    salary_range: '€80k-100k',
    source: 'LinkedIn',
    fit_score: '8',
  },
});

// Create a goal
await mcp.call('obsidian_create_from_template', {
  templateName: 'goal-template',
  notePath: 'goals/launch-saas-product.md',
  variables: {
    title: 'Launch SaaS Product',
    priority: '0.9',
    health_delta: '5',
    notoriety_delta: '20',
    money_delta: '1000',
    money_currency: 'EUR',
    xp_delta: '500',
  },
});
```

### Default Variables

The following variables are automatically provided if not specified:

- `{{date}}` - Current date (YYYY-MM-DD)
- `{{time}}` - Current time (HH:MM:SS)
- `{{datetime}}` - ISO 8601 timestamp
- `{{title}}` - Derived from note filename
- `{{id}}` - Generated unique ID
- `{{created}}` - ISO 8601 creation timestamp
- `{{updated}}` - ISO 8601 update timestamp

## Template Structure

All COD/Avatar/World-compliant templates include:

### COD Fields (Task/Goal Planning)

```yaml
status: todo
priority: 0.8
effortScore: 5
focusCost: 3
estimatedTimeMin: 120
depends_on: []
blocks: []
```

### Avatar Rewards (Gamification)

```yaml
avatar_rewards:
  vitals:
    health: 0
    notoriety: 5
    money:
      default_currency: EUR
      balances:
        EUR: 0
      forms:
        cash: 0
        bank: 0
        investments: 0
  progression:
    xp: 50
```

### ADHD Fields (Engagement)

```yaml
adhd:
  reward: 3
  dread: 2
  novelty: 2
  clarity: 3
  friction: 2
  risk: 2
  energy: moderate
  mode: deep
  rewardType: achievement
  rescue: false
```

### Compound Fields (Leverage)

```yaml
compound:
  kind: leverage
  multiplier: 1.5
  cadence: daily
  streak: 0
  decayDays: 7
```

## Best Practices for LLM Agents

1. **Always use `obsidian_list_templates`** to discover available templates before creating notes
2. **Use template names, not paths** when calling `obsidian_create_from_template`
3. **Provide meaningful variable values** - don't leave placeholders like `{{variable}}`
4. **Use appropriate templates** for note types:
   - Tasks → `task-template`
   - Goals → `goal-template`
   - Job applications → `job-lead-template`
   - Networking → `outreach-template`
5. **Set avatar_rewards** when creating tasks/goals to enable gamification
6. **Fill in ADHD fields** to help with engagement and prioritization
7. **Use compound fields** for high-leverage activities

## Validation

Templates are validated to ensure:

- All required frontmatter fields are present
- Variable syntax is correct
- COD/Avatar/World fields are properly structured
- No broken variable references

Use `obsidian_validate_template` to check template validity:

```typescript
await mcp.call('obsidian_validate_template', {
  template: 'task-template',
});
```

## Adding New Templates

To add a new template:

1. Create the template file in `_system/templates/[category]/`
2. Use `.md` extension and include `-template` suffix
3. Include proper frontmatter with `type`, `template_type`, `cod_system: true`
4. Add `{{variable}}` placeholders for dynamic content
5. Test with `obsidian_preview_template` before use

The template discovery service automatically detects new templates on next refresh (1-minute cache TTL).

## Template Categories

Templates are organized by category:

- `tasks/` - Task management
- `goals/` - Goal tracking
- `events/` - Event logging
- `checkins/` - Daily check-ins
- `learning/` - Learning objectives
- `knowledge/` - Knowledge base
- `notes/` - Documentation
- `specs/` - Specifications
- `job-hunting/` - Job search

This organization ensures templates are easy to discover and use consistently across all LLM agents using the MCP.
