---
id: {{id}}
taskId: {{taskId}}
type: {{type}}
relatedTaskId: {{relatedTaskId}}
description: {{description}}
fulfilled: false
createdAt: {{createdAt}}
fulfilledAt: null
---

# Need: {{description}}

**Task:** [[{{taskId}}]]
**Type:** {{type}}
**Status:** ⏳ Pending

## Details

{{details}}

## Related Task

{{#if relatedTaskId}}
This need depends on [[{{relatedTaskId}}]] being completed.
{{else}}
This is a resource need with no task dependency.
{{/if}}

## Timeline

- **Created:** {{createdAt}}
- **Fulfilled:** Not yet

## Parent Task

This need belongs to [[{{taskId}}]].

## Actions Required

<!-- List specific actions needed to fulfill this need -->
