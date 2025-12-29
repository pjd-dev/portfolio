import { z } from 'zod';

export const inputSchema = z.object({
  query: z.string(),
  pattern: z.string().default('**/*.md'),
});

export const outputSchema = z.object({
  content: z.array(
    z.object({
      type: z.literal('text'),
      text: z.string(),
    })
  ),
  structuredContent: z.object({
    matches: z.array(z.string()),
  }),
});

export type SearchNotesInput = z.infer<typeof inputSchema>;
export type SearchNotesOutput = z.infer<typeof outputSchema>;
