import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@nest/schema': fileURLToPath(new URL('./packages/schema/src/index.ts', import.meta.url)),
    },
  },
  test: {
    include: [
      'packages/**/*.test.ts',
      'site/**/*.test.ts',
      'scripts/**/*.test.ts',
      'contributors/**/*.test.ts',
    ],
    passWithNoTests: true,
  },
})
