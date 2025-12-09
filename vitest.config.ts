import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['apps/**/__tests__/**/*.test.{ts,tsx,js}', 'apps/**/src/**/__tests__/**/*.test.{ts,tsx,js}'],
    threads: false,
    clearMocks: true,
    watch: false,
    coverage: {
      provider: 'v8'
    }
  },
  resolve: {
    alias: {
      '@root': path.resolve(__dirname, '.'),
      '@apps': path.resolve(__dirname, 'apps')
    }
  }
})
