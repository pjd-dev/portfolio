export { VAULT_ROOT } from '@vault/common';

export { resolveNotePath } from './resolveNotePath.js';
export { readNote, readNoteText } from './readNote.js';
export { writeNote, writeNoteText } from './writeNote.js';
export { deleteNote } from './deleteNote.js';
export {
  stageFile,
  commitChanges,
  pushToRemote,
  gitCommitAndPush,
  type GitCommitOptions,
} from './gitOps.js';
