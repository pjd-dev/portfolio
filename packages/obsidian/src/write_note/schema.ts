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

const gitResultSchema = z.object({
  commit: z.string().optional(),
  push: z.string().optional(),
  error: z.string().optional(),
});

export const outputSchema = z.object({
  path: z.string(),
  mode: z.enum(['base64', 'frontmatter']).optional(),
  git: gitResultSchema.optional(),
  warning: z.string().optional(),
});

type ToolContent = { type: 'text'; text: string };

export type WriteNoteInput = z.infer<typeof inputSchema>;
export type WriteNoteStructuredContent = z.infer<typeof outputSchema>;
export type WriteNoteOutput = {
  content: ToolContent[];
  structuredContent?: WriteNoteStructuredContent;
  isError?: boolean;
};
