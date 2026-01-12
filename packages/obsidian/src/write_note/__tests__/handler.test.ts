import { describe, expect, it, vi } from 'vitest';
import { handler } from '../handler.js';
import { inputSchema } from '../schema.js';

describe('write_note handler', () => {
  it('writes content and commits on success', async () => {
    const writeNote = vi.fn().mockResolvedValue(undefined);
    const writeNoteText = vi.fn().mockResolvedValue(undefined);
    const gitCommitAndPush = vi.fn().mockResolvedValue(undefined);

    const result = await handler(
      {
        path: 'notes/write.md',
        frontmatter: { title: 'Note' },
        content: 'Hello',
      },
      { writeNote, writeNoteText, gitCommitAndPush }
    );

    expect(writeNote).toHaveBeenCalledWith('notes/write.md', {
      frontmatter: { title: 'Note' },
      content: 'Hello',
    });
    expect(gitCommitAndPush).toHaveBeenCalledWith(
      'notes/write.md',
      'Create/update note: notes/write.md',
      { author: 'MCP Bot', email: 'mcp@vault.local' }
    );
    expect(result.content[0]?.text).toContain('committed and pushed');
  });

  it('returns a warning when git commit fails', async () => {
    const writeNote = vi.fn().mockResolvedValue(undefined);
    const writeNoteText = vi.fn().mockResolvedValue(undefined);
    const gitCommitAndPush = vi.fn().mockRejectedValue(new Error('git down'));

    const result = await handler(
      {
        path: 'notes/write.md',
        content: 'Hello',
        frontmatter: {},
      },
      { writeNote, writeNoteText, gitCommitAndPush }
    );

    expect(result.content[0]?.text).toContain('git commit failed: git down');
  });

  it('writes base64 payloads directly', async () => {
    const writeNote = vi.fn().mockResolvedValue(undefined);
    const writeNoteText = vi.fn().mockResolvedValue(undefined);
    const gitCommitAndPush = vi.fn().mockResolvedValue(undefined);

    const raw = '---\nkey: value\n---\nBody';
    const base64 = Buffer.from(raw, 'utf8').toString('base64');

    const result = await handler(
      { path: 'notes/base64.md', base64, frontmatter: {} },
      { writeNote, writeNoteText, gitCommitAndPush }
    );

    expect(writeNoteText).toHaveBeenCalledWith('notes/base64.md', raw);
    expect(result.content[0]?.text).toContain('from base64');
  });

  it('surfaces base64 write errors', async () => {
    const writeNote = vi.fn().mockResolvedValue(undefined);
    const writeNoteText = vi.fn().mockRejectedValue(new Error('disk full'));
    const gitCommitAndPush = vi.fn().mockResolvedValue(undefined);

    const result = await handler(
      { path: 'notes/base64.md', base64: 'Zm9v', frontmatter: {} },
      { writeNote, writeNoteText, gitCommitAndPush }
    );

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('disk full');
  });

  it('rejects missing path in schema validation', () => {
    const result = inputSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
