import { join } from 'node:path';

import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/libs/web/ui',
  plugins: [
    angular({ tsconfig: join(import.meta.dirname, 'tsconfig.spec.json') }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'web-ui',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    passWithNoTests: true,
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/web/ui',
      provider: 'v8' as const,
    },
  },
}));
