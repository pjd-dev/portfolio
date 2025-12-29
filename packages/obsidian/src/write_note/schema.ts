import { z } from 'zod';

export const inputSchema = z.object({
  path: z.string(),
  frontmatter: z.record(z.string(), z.any()).optional().default({}),
  content: z
    .string()
    .describe('Markdown content (body only, frontmatter added separately)')
    .optional(),
  base64: z
    .string()
    .describe(
      'Base64-encoded complete note including frontmatter. If provided, frontmatter parameter is ignored.'
    )
    .optional(),
});

export const outputSchema = z.object({
  content: z.array(
    z.object({
      type: z.literal('text'),
      text: z.string(),
    })
  ),
  isError: z.boolean().optional(),
});

export type WriteNoteInput = z.infer<typeof inputSchema>;
export type WriteNoteOutput = z.infer<typeof outputSchema>;
