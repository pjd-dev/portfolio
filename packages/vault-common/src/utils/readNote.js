import fs from 'fs-extra';
import matter from 'gray-matter';
import { resolveNotePath } from './resolveNotePath.js';
export async function readNote(relPath) {
  const full = resolveNotePath(relPath);
  const raw = await fs.readFile(full, 'utf8');
  const parsed = matter(raw);
  return {
    path: relPath,
    frontmatter: parsed.data ?? {},
    content: parsed.content ?? '',
  };
}
export async function readNoteText(relPath) {
  const full = resolveNotePath(relPath);
  const raw = await fs.readFile(full, 'utf8');
  return raw;
}
//# sourceMappingURL=readNote.js.map
