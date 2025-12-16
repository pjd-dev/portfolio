import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const WORKSPACE_ROOT = join(__dirname, '..', '..');
const VAULTY_SEEDS_DIR = join(WORKSPACE_ROOT, 'apps', 'vaulty', 'src', 'seeds');

describe('Vaulty Seeds - Obsidian config', () => {
  it('should include a minimal community-plugins.json in seeds', () => {
    const path = join(VAULTY_SEEDS_DIR, '.obsidian', 'community-plugins.json');
    expect(existsSync(path)).toBe(true);
    const content = JSON.parse(readFileSync(path, 'utf-8'));
    expect(Array.isArray(content)).toBe(true);
    // default seed should not force-enable obsidian-git
    expect(content.includes('obsidian-git')).toBe(false);
  });

  it('should include conservative default plugin data for obsidian-git', () => {
    const path = join(
      VAULTY_SEEDS_DIR,
      '.obsidian',
      'plugins',
      'obsidian-git',
      'data.json'
    );
    expect(existsSync(path)).toBe(true);
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    expect(data.autoPull).toBe(false);
    expect(data.autoPush).toBe(false);
  });
});
