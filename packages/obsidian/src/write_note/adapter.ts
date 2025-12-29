import { createMcpTool } from '@vault/mcp-core';
import {
  gitCommitAndPush,
  writeNote,
  writeNoteText,
} from '@vault/common/utils';
import { handler, type WriteNoteDeps } from './handler.js';
import { inputSchema, outputSchema } from './schema.js';

const defaultDeps: WriteNoteDeps = {
  writeNote,
  writeNoteText,
  gitCommitAndPush,
};

export const createWriteNoteTool = (deps: WriteNoteDeps = defaultDeps) =>
  createMcpTool(
    'obsidian_write_note',
    {
      title: 'Write Note',
      description:
        "Write or overwrite a note in the Obsidian vault. Use either 'content' for markdown body only (frontmatter added separately), or 'base64' for complete note with frontmatter already included.",
      inputSchema,
      outputSchema,
    },
    async (input) => handler(input, deps)
  );

export const tool = createWriteNoteTool();
export const WriteNoteTool = tool;
