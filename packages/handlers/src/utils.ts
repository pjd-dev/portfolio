import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

export function getVaultRoot(): string {
  return process.env.VAULT_ROOT || process.env.VAULT_PATH || '/vault';
}

export function globToRegExp(pattern: string): RegExp {
  // Very small glob -> regex converter supporting ** and *
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*');
  return new RegExp(`^${escaped}$`, 'i');
}

export async function walkMarkdownFiles(
  dir: string,
  base = ''
): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    const rel = path.join(base, entry.name);
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await walkMarkdownFiles(full, rel);
      results.push(...sub);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      results.push(rel.replace(/\\/g, '/'));
    }
  }
  return results;
}

export function parseFrontmatter(raw: string): Record<string, any> {
  const parsed = matter(raw);
  return (parsed.data as Record<string, any>) || {};
}

export async function readMarkdownFile(relPath: string): Promise<{
  frontmatter: Record<string, any>;
  content: string;
  raw: string;
}> {
  const full = path.join(getVaultRoot(), relPath);
  const raw = await fs.readFile(full, 'utf8');
  const parsed = matter(raw);
  return {
    frontmatter: (parsed.data as Record<string, any>) || {},
    content: parsed.content,
    raw,
  };
}

export async function writeMarkdownFile(
  relPath: string,
  data: {
    frontmatter?: Record<string, any>;
    content?: string;
  }
): Promise<void> {
  const full = path.join(getVaultRoot(), relPath);
  const dir = path.dirname(full);
  await fs.mkdir(dir, { recursive: true });
  // yaml-stringify will throw on undefined values; strip them out
  const fm = Object.fromEntries(
    Object.entries(data.frontmatter ?? {}).filter(([, v]) => v !== undefined)
  );
  const body = data.content ?? '';
  const rendered = matter.stringify(body, fm);
  await fs.writeFile(full, rendered, 'utf8');
}

export function normalizeTags(value: any): string[] {
  if (Array.isArray(value)) {
    return value.map((t) => String(t)).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

export function extractWikiLinks(content: string): string[] {
  const matches = content.match(/\[\[([^\]]+)\]\]/g) || [];
  return matches.map((m) => m.slice(2, -2).trim()).filter(Boolean);
}
