declare module 'fs-extra' {
  export function pathExists(path: string): Promise<boolean>;
  export function readJSON(path: string): Promise<any>;
  export function writeJSON(path: string, data: any): Promise<void>;
  export function ensureDir(path: string): Promise<void>;
  const defaultExport: {
    pathExists: typeof pathExists;
    readJSON: typeof readJSON;
    writeJSON: typeof writeJSON;
    ensureDir: typeof ensureDir;
  };
  export default defaultExport;
}
