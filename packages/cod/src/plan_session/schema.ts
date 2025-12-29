import { z } from 'zod';

export const inputSchema = z.object({
  durationMinutes: z
    .number()
    .describe('Session duration in minutes (e.g., 45, 90, 120)'),
  maxFocusCost: z
    .number()
    .optional()
    .describe(
      'Maximum focus cost per task (e.g., 3 for low focus, 5 for high focus)'
    ),
  projectId: z.string().optional().describe('Filter tasks to specific project'),
  tags: z.array(z.string()).optional().describe('Filter tasks by tags'),
  maxTasks: z
    .number()
    .optional()
    .describe('Maximum number of tasks to include'),
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

export type PlanSessionInput = z.infer<typeof inputSchema>;
export type PlanSessionOutput = z.infer<typeof outputSchema>;
