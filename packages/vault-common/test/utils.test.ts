import {
  resolveNotePath,
  readNote,
  writeNote,
  deleteNote,
  readNoteText,
  writeNoteText,
} from '../src/utils/index';
import fs from 'fs-extra';
import path from 'node:path';

describe('utils', () => {
  const testNote = 'test-note-utils.md';
  const testContent = 'Hello, utils!';
  const testFrontmatter = { foo: 'bar' };
  const testData = { content: testContent, frontmatter: testFrontmatter };
  const notePath = resolveNotePath(testNote);

  afterAll(async () => {
    await deleteNote(testNote);
    await fs.remove(path.dirname(notePath));
  });

  it('should resolve note path correctly', () => {
    expect(notePath.endsWith(testNote)).toBe(true);
    expect(notePath).toContain('.md');
  });

  it('should write and read note', async () => {
    await writeNote(testNote, testData);
    const note = await readNote(testNote);
    expect(note.content.trim()).toBe(testContent);
    expect(note.frontmatter.foo).toBe('bar');
  });

  it('should write and read note text', async () => {
    await writeNoteText(testNote, 'Raw text');
    const text = await readNoteText(testNote);
    expect(text).toBe('Raw text');
  });

  it('should delete note', async () => {
    await writeNoteText(testNote, 'To be deleted');
    const deleted = await deleteNote(testNote);
    expect(deleted).toBe(true);
    expect(fs.existsSync(notePath)).toBe(false);
  });
});
