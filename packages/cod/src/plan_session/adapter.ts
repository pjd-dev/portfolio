import { createMcpTool } from '@vault/mcp-core';
import { handler, type PlanSessionDeps } from './handler.js';
import { inputSchema, outputSchema } from './schema.js';

export const createPlanSessionTool = (deps: PlanSessionDeps) =>
  createMcpTool(
    'obsidian_plan_session',
    {
      title: 'Plan Work Session',
      description:
        'Create a time-bounded work session by selecting optimal unblocked tasks based on effort, reward, and focus cost. Tasks are scored and packed into the session duration.',
      inputSchema,
      outputSchema,
    },
    async (input) => handler(input, deps)
  );

export const PlanSessionTool = createPlanSessionTool;
