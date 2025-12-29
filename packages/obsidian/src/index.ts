import type { McpToolDef } from '@vault/mcp-core';
import {
  ReadNoteTool,
  createReadNoteTool,
  type ReadNoteDeps,
} from './read_note/index.js';
import {
  WriteNoteTool,
  createWriteNoteTool,
  type WriteNoteDeps,
} from './write_note/index.js';
import {
  SearchNotesTool,
  createSearchNotesTool,
  type SearchNotesDeps,
} from './search_notes/index.js';

export type ObsidianToolsDeps = {
  readNote?: ReadNoteDeps;
  writeNote?: WriteNoteDeps;
  searchNotes: SearchNotesDeps;
};

export const createObsidianTools = (deps: ObsidianToolsDeps): McpToolDef[] => [
  createReadNoteTool(deps.readNote),
  createWriteNoteTool(deps.writeNote),
  createSearchNotesTool(deps.searchNotes),
];

export default createObsidianTools;
export {
  ReadNoteTool,
  WriteNoteTool,
  SearchNotesTool,
  createReadNoteTool,
  createWriteNoteTool,
  createSearchNotesTool,
};
