import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import { glob } from 'glob';
import os from 'node:os';
import path from 'node:path';
import { handler } from '../handler.js';
import { inputSchema } from '../schema.js';

describe('search_notes handler', () => {
  let vaultRoot: string;

  beforeEach(async () => {
    vaultRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vault-search-'));
    await fs.ensureDir(path.join(vaultRoot, 'nested'));

    await fs.writeFile(path.join(vaultRoot, 'alpha.md'), 'Hello World', 'utf8');
    await fs.writeFile(
      path.join(vaultRoot, 'nested', 'beta.md'),
      'Another world',
      'utf8'
    );
    await fs.writeFile(path.join(vaultRoot, 'other.txt'), 'nope', 'utf8');
  });

  afterEach(async () => {
    await fs.remove(vaultRoot);
  });

  it('finds matching notes case-insensitively', async () => {
    const deps = {
      vaultRoot,
      listFiles: (pattern: string) => glob.sync(pattern, { cwd: vaultRoot }),
      readFile: (fullPath: string) => fs.readFile(fullPath, 'utf8'),
      joinPath: path.join,
    };

    const result = await handler({ query: 'world', pattern: '**/*.md' }, deps);

    expect(result.structuredContent.matches).toEqual(
      expect.arrayContaining(['alpha.md', 'nested/beta.md'])
    );
  });

  it('returns empty matches when nothing is found', async () => {
    const deps = {
      vaultRoot,
      listFiles: (pattern: string) => glob.sync(pattern, { cwd: vaultRoot }),
      readFile: (fullPath: string) => fs.readFile(fullPath, 'utf8'),
      joinPath: path.join,
    };

    const result = await handler(
      { query: 'missing', pattern: '**/*.md' },
      deps
    );

    expect(result.structuredContent.matches).toEqual([]);
    expect(result.content[0]?.text).toBe('');
  });

  it('is deterministic for identical inputs', async () => {
    const deps = {
      vaultRoot,
      listFiles: (pattern: string) => glob.sync(pattern, { cwd: vaultRoot }),
      readFile: (fullPath: string) => fs.readFile(fullPath, 'utf8'),
      joinPath: path.join,
    };

    const first = await handler({ query: 'world', pattern: '**/*.md' }, deps);
    const second = await handler({ query: 'world', pattern: '**/*.md' }, deps);

    expect(first).toEqual(second);
  });

  it('rejects missing query in schema validation', () => {
    const result = inputSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
