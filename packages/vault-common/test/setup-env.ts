import path from 'node:path';
import fs from 'fs-extra';

const testVaultDir = path.resolve(__dirname, 'test-vault');
process.env.VAULT_PATH = testVaultDir;
fs.ensureDirSync(testVaultDir);
