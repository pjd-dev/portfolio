export declare function readNote(relPath: string): Promise<{
  path: string;
  frontmatter: {
    [key: string]: any;
  };
  content: string;
}>;
export declare function readNoteText(relPath: string): Promise<string>;
//# sourceMappingURL=readNote.d.ts.map
