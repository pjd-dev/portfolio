import { createMcpTool } from '@vault/mcp-core';
import { handler, type ListPipelinesDeps } from './handler.js';
import { inputSchema, outputSchema } from './schema.js';

export const createListPipelinesTool = (deps: ListPipelinesDeps) =>
  createMcpTool(
    'obsidian_list_pipelines',
    {
      title: 'List Active Pipelines',
      description:
        "List all simulated pipelines that haven't been applied yet. These are ready to be applied or discarded.",
      inputSchema,
      outputSchema,
    },
    async (input) => handler(input, deps)
  );

export const ListPipelinesTool = createListPipelinesTool;
