import { createMcpTool } from '@vault/mcp-core';
import { handler, type TaskNextActionsDeps } from './handler.js';
import { inputSchema, outputSchema } from './schema.js';

export const createTaskNextActionsTool = (deps: TaskNextActionsDeps) =>
  createMcpTool(
    'obsidian_task_next_actions',
    {
      title: 'Get Next Actions',
      description:
        'List unblocked tasks that can be started now. Ranked by score (reward / (effort * focusCost), adjusted by goal weights). Filter by project, effort, and focus cost.',
      inputSchema,
      outputSchema,
    },
    async (input) => handler(input, deps)
  );

export const TaskNextActionsTool = createTaskNextActionsTool;
