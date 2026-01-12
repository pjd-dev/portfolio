import fs from 'node:fs/promises';
import path from 'node:path';
import { VAULT_ROOT } from './index.js';
export function resolveNotePath(relPath) {
  const cleaned = relPath.replace(/^[/\\]+/, '');
  const normalized = cleaned.endsWith('.md') ? cleaned : `${cleaned}.md`;
  const full = path.resolve(VAULT_ROOT, normalized);
  if (!full.startsWith(VAULT_ROOT)) {
    throw new Error('Path escapes vault root');
  }
  return full;
}
export async function deleteNote(relPath) {
  const full = resolveNotePath(relPath);
  try {
    await fs.unlink(full);
    return true;
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      // file already gone
      return false;
    }
    throw err;
  }
}
//# sourceMappingURL=deleteNote.js.map
