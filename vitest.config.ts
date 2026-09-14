import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  test: {
    coverage: {
      provider: 'v8',
      // 100% coverage gate on the logic layer (NASA practice).
      // UI files (src/components, src/pages, src/App.tsx) join the gate
      // when M12 lands component tests.
      all: true,
      include: ['src/core/**', 'src/state/**'],
      exclude: ['**/*.test.ts', '**/*.test.tsx'],
      thresholds: {
        100: true,
      },
    },
  },
})
