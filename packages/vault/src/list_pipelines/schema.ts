import { z } from 'zod';

export const inputSchema = z.object({});

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

export type ListPipelinesInput = z.infer<typeof inputSchema>;
export type ListPipelinesOutput = z.infer<typeof outputSchema>;
