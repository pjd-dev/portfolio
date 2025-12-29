import { createMcpTool } from '@vault/mcp-core';
import { handler, type SearchNotesDeps } from './handler.js';
import { inputSchema, outputSchema } from './schema.js';

export const createSearchNotesTool = (deps: SearchNotesDeps) =>
  createMcpTool(
    'obsidian_search_notes',
    {
      title: 'Search Notes',
      description: 'Search for notes in the Obsidian vault containing a query',
      inputSchema,
      outputSchema,
    },
    async (input) => handler(input, deps)
  );

export const tool = createSearchNotesTool;
export const SearchNotesTool = tool;
