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

const templateInfoSchema = z.object({
  name: z.string(),
  category: z.string(),
  path: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const outputSchema = z.object({
  templates: z.array(templateInfoSchema),
  total: z.number(),
});

type ToolContent = { type: 'text'; text: string };

export type ListTemplatesInput = z.infer<typeof inputSchema>;
export type ListTemplatesStructuredContent = z.infer<typeof outputSchema>;
export type ListTemplatesOutput = {
  content: ToolContent[];
  structuredContent?: ListTemplatesStructuredContent;
  isError?: boolean;
};
