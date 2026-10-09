import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/libs/api/database',
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'api-database',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    passWithNoTests: true,
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/api/database',
      provider: 'v8' as const,
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.spec.ts',
        'src/index.ts',
        'src/generated/**',
        'src/**/testing/**',
      ],
      // PRD QA-2: at least 80% of lines in libs/api/*.
      thresholds: { lines: 80 },
    },
  },
}));
