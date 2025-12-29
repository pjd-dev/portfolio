import type { ReadNoteInput, ReadNoteOutput } from './schema.js';

export type ReadNoteDeps = {
  readNote: (
    relPath: string
  ) => Promise<{
    path: string;
    frontmatter: Record<string, unknown>;
    content: string;
  }>;
};

export async function handler(
  input: ReadNoteInput,
  deps: ReadNoteDeps
): Promise<ReadNoteOutput> {
  const note = await deps.readNote(input.path);

  return {
    content: [
      {
        type: 'text',
        text: `# ${input.path}\n\n${note.content}`,
      },
    ],
    structuredContent: note,
  };
}
