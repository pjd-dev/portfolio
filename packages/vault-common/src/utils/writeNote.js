import fs from 'fs-extra';
import path from 'node:path';
import matter from 'gray-matter';
import { resolveNotePath } from './resolveNotePath.js';
export async function writeNote(relPath, data) {
  const full = resolveNotePath(relPath);
  await fs.ensureDir(path.dirname(full));
  const composed = matter.stringify(data.content, data.frontmatter);
  await fs.writeFile(full, composed, 'utf8');
}
export async function writeNoteText(relPath, content) {
  const full = resolveNotePath(relPath);
  await fs.ensureDir(path.dirname(full));
  await fs.writeFile(full, content, 'utf8');
}
//# sourceMappingURL=writeNote.js.map
