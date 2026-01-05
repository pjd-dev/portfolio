import { z } from 'zod';

export const inputSchema = z.object({
  query: z.string(),
  pattern: z.string().default('**/*.md'),
});

export const outputSchema = z.object({
  matches: z.array(z.string()),
});

type ToolContent = { type: 'text'; text: string };

export type SearchNotesInput = z.infer<typeof inputSchema>;
export type SearchNotesStructuredContent = z.infer<typeof outputSchema>;
export type SearchNotesOutput = {
  content: ToolContent[];
  structuredContent?: SearchNotesStructuredContent;
  isError?: boolean;
};
