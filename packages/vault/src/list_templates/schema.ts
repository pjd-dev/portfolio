import { z } from 'zod';

export const inputSchema = z.object({
  category: z
    .string()
    .optional()
    .describe("Filter by category (e.g., 'tasks', 'notes')"),
  forceRefresh: z
    .boolean()
    .default(false)
    .describe('Force refresh template cache'),
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

export type ListTemplatesInput = z.infer<typeof inputSchema>;
export type ListTemplatesOutput = z.infer<typeof outputSchema>;
