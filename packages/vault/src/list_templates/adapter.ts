import { createMcpTool } from '@vault/mcp-core';
import { handler, type ListTemplatesDeps } from './handler.js';
import { inputSchema, outputSchema } from './schema.js';

export const createListTemplatesTool = (deps: ListTemplatesDeps) =>
  createMcpTool(
    'obsidian_list_templates',
    {
      title: 'List Templates',
      description:
        'Discover all available templates in the vault with metadata including name, path, category, and description.',
      inputSchema,
      outputSchema,
    },
    async (input) => handler(input, deps)
  );

export const ListTemplatesTool = createListTemplatesTool;
