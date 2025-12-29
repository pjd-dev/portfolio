import { z } from 'zod';

const TaskStatusEnum = z.enum([
  'todo',
  'in_progress',
  'done',
  'blocked',
  'dropped',
]);

export const inputSchema = z.object({
  projectId: z.string().optional().describe('Filter by project ID'),
  max: z.number().optional().describe('Maximum number of results'),
  maxEffort: z.number().optional().describe('Maximum effort level'),
  maxFocusCost: z.number().optional().describe('Maximum focus cost'),
  statusFilter: z
    .array(TaskStatusEnum)
    .optional()
    .describe("Status filter (default: ['todo', 'in_progress'])"),
});

export const outputSchema = z.object({
  content: z.array(
    z.object({
      type: z.literal('text'),
      text: z.string(),
    })
  ),
  structuredContent: z.any().optional(),
  isError: z.boolean().optional(),
});

export type TaskNextActionsInput = z.infer<typeof inputSchema>;
export type TaskNextActionsOutput = z.infer<typeof outputSchema>;
