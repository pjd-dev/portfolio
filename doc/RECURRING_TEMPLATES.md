# Recurring Task Templates

Recurring templates let the MCP server generate notes on a schedule by scanning
markdown files under the vault templates directory.

## Location

- Templates live under `VAULT_PATH/templates/**/*.md`.
- A template must include `recurrence` in frontmatter to be picked up.
- Output notes are always written inside the vault (paths outside are rejected).

## Frontmatter Schema

```yaml
id: daily-review
title: Daily Review
recurrence:
  interval: daily | weekly | monthly | interval
  intervalMinutes: 90 # required when interval: interval
  startDate: 2025-01-01 # optional (YYYY-MM-DD)
  time: '09:00' # optional (HH:MM, treated as UTC)
  timezone: 'UTC' # reserved, not currently used
outputPath: tasks/recurring/{{date}}-daily-review.md
# or
output:
  folder: tasks/recurring
  name: daily-review-{{date}}.md
```

Notes:

- `id` is optional but recommended for stable state tracking.
- `title` is used as the display name; fallback is the file name.
- `intervalMinutes` overrides `interval` when provided.
- If neither `outputPath` nor `output` is set, output defaults to
  `tasks/recurring/<slug>-{{date}}.md`.
- Frontmatter values are copied into the output note (except `recurrence`,
  `output`, and `outputPath`) with variable substitution applied.

## Template Variables

Variables are substituted in both frontmatter values and content:

- `{{date}}` (YYYY-MM-DD)
- `{{time}}` (HH:MM:SS)
- `{{datetime}}` (ISO 8601)
- `{{timestamp}}` (milliseconds since epoch)
- `{{template}}`, `{{templateName}}`, `{{templatePath}}`

Unknown variables are replaced with an empty string.

## Example: Daily Review

```markdown
---
title: Daily Review
type: task
status: todo
tags: [recurring, review]
recurrence:
  interval: daily
  startDate: 2025-01-01
outputPath: tasks/recurring/{{date}}-daily-review.md
---

## Description

Daily review for {{date}}
```

## Example: Weekly Planning (Folder + Name)

```markdown
---
title: Weekly Planning
type: task
status: todo
recurrence:
  interval: weekly
  time: '08:00'
output:
  folder: tasks/recurring/weekly
  name: weekly-plan-{{date}}.md
---

## Description

Plan the week starting {{date}}
```

## Runtime & State

- State is stored in `VAULT_PATH/.vault-schedules/recurring-templates.json`.
- Each entry tracks `lastRunAt`, `lastStatus`, and `lastOutputPath`.

## MCP Tools

- `obsidian_list_recurring_templates`: list templates and next run time.
- `obsidian_run_recurring_templates`: run due templates.

Run options:

- `dryRun`: no writes, status = `dry_run`
- `force`: run even if not due
- `now`: override current time (ISO string)
- `maxRuns`: limit number of templates executed
- `overwrite`: allow writing over existing output
- `templatePaths`: only run specific template paths (relative to `templates/`)
- `variables`: custom variables to merge into template substitutions

## Scheduler Environment

When enabled, the MCP server runs the recurring template scheduler on a timer:

```bash
RECURRING_TEMPLATE_SCHEDULER_ENABLED=true
RECURRING_TEMPLATE_SCHEDULER_INTERVAL_MS=60000
```
