import fs from 'fs-extra';
import path from 'node:path';
import matter from 'gray-matter';
import { resolveNotePath } from './resolveNotePath.js';

export async function writeNote(relPath: string, data: any) {
  const full = resolveNotePath(relPath);
  await fs.ensureDir(path.dirname(full));
  const composed = matter.stringify(data.content, data.frontmatter);
  await fs.writeFile(full, composed, 'utf8');
}

export async function writeNoteText(
  relPath: string,
  content: string
): Promise<void> {
  const full = resolveNotePath(relPath);
  await fs.ensureDir(path.dirname(full));
  await fs.writeFile(full, content, 'utf8');
}
