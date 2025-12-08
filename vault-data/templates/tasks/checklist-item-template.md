---
id: {{id}}
taskId: {{taskId}}
type: {{type}}
relatedTaskId: {{relatedTaskId}}
text: {{text}}
done: false
doneAt: null
priority: {{priority}}
---

# Checklist Item: {{text}}

**Task:** [[{{taskId}}]]
**Type:** {{type}}
**Priority:** {{priority}}/10
**Status:** ⏳ Pending

## Details

{{details}}

## Dependencies

<!-- If type is "task", specify related task -->
{{#if relatedTaskId}}
- **Related Task:** [[{{relatedTaskId}}]]
{{/if}}

## Parent Task

This checklist item belongs to [[{{taskId}}]].
