import type { WriteNoteInput, WriteNoteOutput } from './schema.js';

export type WriteNoteDeps = {
  writeNote: (
    relPath: string,
    data: { frontmatter: Record<string, unknown>; content: string }
  ) => Promise<void>;
  writeNoteText: (relPath: string, content: string) => Promise<void>;
  gitCommitAndPush: (
    relPath: string,
    message: string,
    options: { author: string; email: string }
  ) =>
    | { commit: string; push: string }
    | Promise<{ commit: string; push: string }>;
};

export async function handler(
  input: WriteNoteInput,
  deps: WriteNoteDeps
): Promise<WriteNoteOutput> {
  const rel = input.path;

  if (input.base64) {
    try {
      const completeNote = Buffer.from(input.base64, 'base64').toString('utf8');
      await deps.writeNoteText(rel, completeNote);

      return {
        content: [{ type: 'text', text: `Wrote note (from base64): ${rel}` }],
      };
    } catch (err: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: invalid base64 payload for note '${rel}' - ${err.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  const finalContent = input.content ?? '';
  await deps.writeNote(rel, {
    frontmatter: input.frontmatter ?? {},
    content: finalContent,
  });

  try {
    await deps.gitCommitAndPush(rel, `Create/update note: ${rel}`, {
      author: 'MCP Bot',
      email: 'mcp@vault.local',
    });

    return {
      content: [
        {
          type: 'text',
          text: `Wrote note: ${rel} (committed and pushed to git)`,
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Wrote note: ${rel} (local write successful, but git commit failed: ${error.message})`,
        },
      ],
    };
  }
}
