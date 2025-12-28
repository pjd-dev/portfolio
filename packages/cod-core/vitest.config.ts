import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  extends: path.resolve(__dirname, '../../vitest.config.base.ts'),
  test: {
    dir: 'src',
  },
});
