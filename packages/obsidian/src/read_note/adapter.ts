import { createMcpTool } from '@vault/mcp-core';
import { readNote } from '@vault/common/utils';
import { handler, type ReadNoteDeps } from './handler.js';
import { inputSchema, outputSchema } from './schema.js';

const defaultDeps: ReadNoteDeps = { readNote };

export const createReadNoteTool = (deps: ReadNoteDeps = defaultDeps) =>
  createMcpTool(
    'obsidian_read_note',
    {
      title: 'Read Note',
      description: 'Read a note from the Obsidian vault',
      inputSchema,
      outputSchema,
    },
    async (input) => handler(input, deps)
  );

export const tool = createReadNoteTool();
export const ReadNoteTool = tool;
