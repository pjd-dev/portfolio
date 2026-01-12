import { describe, expect, it } from 'vitest';
import { handler } from '../handler.js';
import { inputSchema } from '../schema.js';

describe('read_note handler', () => {
  it('returns rendered text and structured content', async () => {
    const deps = {
      readNote: async (relPath: string) => ({
        path: relPath,
        frontmatter: { title: 'Test' },
        content: 'Hello world',
      }),
    };

    const result = await handler({ path: 'notes/test.md' }, deps);

    expect(result.structuredContent?.path).toBe('notes/test.md');
    expect(result.content[0]?.text).toContain('# notes/test.md');
    expect(result.content[0]?.text).toContain('Hello world');
  });

  it('is deterministic for identical inputs', async () => {
    const deps = {
      readNote: async (relPath: string) => ({
        path: relPath,
        frontmatter: {},
        content: 'Same',
      }),
    };

    const first = await handler({ path: 'notes/same.md' }, deps);
    const second = await handler({ path: 'notes/same.md' }, deps);

    expect(first).toEqual(second);
  });

  it('propagates read errors', async () => {
    const deps = {
      readNote: async () => {
        throw new Error('Not found');
      },
    };

    await expect(handler({ path: 'missing.md' }, deps)).rejects.toThrow(
      'Not found'
    );
  });

  it('rejects missing path in schema validation', () => {
    const result = inputSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
