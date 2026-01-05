import { z } from 'zod';

export const inputSchema = z.object({});

const pipelineSummarySchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  steps: z.number(),
  filesChanged: z.number(),
});

export const outputSchema = z.object({
  pipelines: z.array(pipelineSummarySchema),
});

type ToolContent = { type: 'text'; text: string };

export type ListPipelinesInput = z.infer<typeof inputSchema>;
export type ListPipelinesStructuredContent = z.infer<typeof outputSchema>;
export type ListPipelinesOutput = {
  content: ToolContent[];
  structuredContent?: ListPipelinesStructuredContent;
  isError?: boolean;
};
