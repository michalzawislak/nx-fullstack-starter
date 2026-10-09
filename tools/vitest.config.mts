import { defineConfig } from 'vitest/config';

/** Tests of the repository tooling: AI context generator and lint rules (PRD sections 9.2, 10). */
export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../node_modules/.vite/tools',
  test: {
    name: 'tools',
    watch: false,
    environment: 'node',
    include: ['**/*.spec.mts'],
    // Lint tests start ESLint with the full Nx config; the first run builds the project graph.
    testTimeout: 60_000,
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../coverage/tools',
      provider: 'v8' as const,
      include: ['**/*.mts'],
      exclude: ['**/*.spec.mts', 'vitest.config.mts'],
      thresholds: { lines: 80 },
    },
  },
});
