import type { SearchNotesInput, SearchNotesOutput } from './schema.js';

export type SearchNotesDeps = {
  vaultRoot: string;
  listFiles: (pattern: string) => string[];
  readFile: (fullPath: string) => Promise<string>;
  joinPath: (...parts: string[]) => string;
};

export async function handler(
  input: SearchNotesInput,
  deps: SearchNotesDeps
): Promise<SearchNotesOutput> {
  const files = deps.listFiles(input.pattern);
  const query = input.query.toLowerCase();
  const matches: string[] = [];

  for (const file of files) {
    const full = deps.joinPath(deps.vaultRoot, file);
    const raw = await deps.readFile(full);
    if (raw.toLowerCase().includes(query)) {
      matches.push(file);
    }
  }

  return {
    content: [{ type: 'text', text: matches.join('\n') }],
    structuredContent: { matches },
  };
}
