import { z } from 'zod';

export const inputSchema = z.object({
  path: z.string(),
});

export const outputSchema = z.object({
  content: z.array(
    z.object({
      type: z.literal('text'),
      text: z.string(),
    })
  ),
  structuredContent: z.object({
    path: z.string(),
    frontmatter: z.record(z.string(), z.any()),
    content: z.string(),
  }),
});

export type ReadNoteInput = z.infer<typeof inputSchema>;
export type ReadNoteOutput = z.infer<typeof outputSchema>;
