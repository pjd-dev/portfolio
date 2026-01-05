import { z } from 'zod';

export const inputSchema = z.object({
  path: z.string(),
});

export const outputSchema = z.object({
  path: z.string(),
  frontmatter: z.record(z.string(), z.unknown()),
  content: z.string(),
});

type ToolContent = { type: 'text'; text: string };

export type ReadNoteInput = z.infer<typeof inputSchema>;
export type ReadNoteStructuredContent = z.infer<typeof outputSchema>;
export type ReadNoteOutput = {
  content: ToolContent[];
  structuredContent?: ReadNoteStructuredContent;
  isError?: boolean;
};
