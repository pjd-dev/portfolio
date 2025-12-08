# Task System Note Templates

This directory contains templates for each interface in the task management system.

## Available Templates

### 1. Task Template
**File:** `task-template.md`  
**Interface:** `Task`  
**Purpose:** Main task note with full structure

**Variables:**
- `{{id}}` - Unique task identifier
- `{{title}}` - Task title
- `{{description}}` - Detailed description
- `{{priority}}` - Priority level (0-10)
- `{{dueDate}}` - Due date (YYYY-MM-DD)
- `{{effortScore}}` - Effort estimate (0-10)
- `{{focusCost}}` - Focus requirement (0-10)
- `{{estimatedTimeMin}}` - Estimated time in minutes
- `{{started}}` - Start timestamp (ISO 8601)
- `{{linkedNote}}` - Related note paths
- `{{tag1}}, {{tag2}}` - Tags for categorization

### 2. Checklist Item Template
**File:** `checklist-item-template.md`  
**Interface:** `ChecklistItem`  
**Purpose:** Individual checklist items (todo or task type)

**Variables:**
- `{{id}}` - Unique checklist item identifier
- `{{taskId}}` - Parent task ID
- `{{type}}` - "todo" or "task"
- `{{relatedTaskId}}` - Optional related task
- `{{text}}` - Item description
- `{{priority}}` - Weight for milestone calculation (0-10)
- `{{details}}` - Additional details

### 3. Need Template
**File:** `need-template.md`  
**Interface:** `Need`  
**Purpose:** Task dependencies and resource requirements

**Variables:**
- `{{id}}` - Unique need identifier
- `{{taskId}}` - Parent task ID
- `{{type}}` - "task" or "resource"
- `{{relatedTaskId}}` - Optional related task
- `{{description}}` - Need description
- `{{createdAt}}` - Creation timestamp
- `{{details}}` - Detailed explanation

### 4. Blocker Template
**File:** `blocker-template.md`  
**Interface:** `Blocker`  
**Purpose:** Issues blocking task progress

**Variables:**
- `{{id}}` - Unique blocker identifier
- `{{taskId}}` - Parent task ID
- `{{title}}` - Short blocker title
- `{{description}}` - Blocker description
- `{{since}}` - When blocker started (ISO 8601)

### 5. Reward Template
**File:** `reward-template.md`  
**Interface:** `Reward`  
**Purpose:** Milestone-based rewards

**Variables:**
- `{{id}}` - Unique reward identifier
- `{{taskId}}` - Parent task ID
- `{{title}}` - Short reward title
- `{{content}}` - Reward description
- `{{milestone}}` - Progress percentage trigger (0-100)
- `{{impactScore}}` - Motivational weight (0-10)

### 6. History Entry Template
**File:** `history-entry-template.md`  
**Interface:** `HistoryEntry`  
**Purpose:** Task timeline and state changes

**Variables:**
- `{{id}}` - Unique entry identifier
- `{{taskId}}` - Parent task ID
- `{{title}}` - Short entry title
- `{{note}}` - Entry content
- `{{timestamp}}` - Entry timestamp (ISO 8601)

## Usage

1. Copy the appropriate template for the note type you want to create
2. Replace all `{{variable}}` placeholders with actual values
3. Remove any conditional blocks (e.g., `{{#if ...}}`) based on your needs
4. Fill in the markdown content sections
5. Save the file with an appropriate name (e.g., `task-001.md`, `need-n1.md`)

## TypeScript Interface Reference

All templates correspond to interfaces defined in:
```
/apps/mcp/src/core/task.ts
```

## Template Syntax

These templates use Handlebars-style syntax for variables:
- `{{variable}}` - Simple variable substitution
- `{{#if variable}}...{{/if}}` - Conditional blocks (remove if not needed)
- Comments with `<!-- -->` indicate sections to fill in

## Naming Conventions

- Tasks: `task-{id}.md`
- Checklist Items: `checklist-{id}.md`
- Needs: `need-{id}.md`
- Blockers: `blocker-{id}.md`
- Rewards: `reward-{id}.md`
- History Entries: `history-{id}.md`
