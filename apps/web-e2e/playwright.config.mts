import { workspaceRoot } from '@nx/devkit';
import { nxE2EPreset } from '@nx/playwright/preset';
import { defineConfig, devices } from '@playwright/test';

/**
 * E2E tests of the web app against the real API and PostgreSQL (PRD section 9.1):
 * `npm run db:up` first, then `npx nx e2e web-e2e`. Both dev servers start automatically.
 */
const baseURL = process.env['BASE_URL'] ?? 'http://localhost:4200';
const isCi = Boolean(process.env['CI']);
// Optional: a Chromium build installed outside Playwright (e.g. in containers).
const executablePath = process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH'];

export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  retries: isCi ? 1 : 0,
  use: {
    baseURL,
    trace: 'on-first-retry',
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  webServer: [
    {
      command: 'npx nx run api:serve',
      url: 'http://localhost:3000/health',
      reuseExistingServer: !isCi,
      cwd: workspaceRoot,
      timeout: 120_000,
    },
    {
      command: 'npx nx run web:serve',
      url: baseURL,
      reuseExistingServer: !isCi,
      cwd: workspaceRoot,
      timeout: 120_000,
    },
  ],
  projects: [
    // Tests tagged @desktop or @mobile run only in the matching project.
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grepInvert: /@desktop/ },
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
      grepInvert: /@mobile/,
    },
  ],
});
