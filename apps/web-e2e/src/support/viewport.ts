import type { Page } from '@playwright/test';

/** Viewport size of the current project (every project in playwright.config.mts sets one). */
export function viewportOf(page: Page): { width: number; height: number } {
  return page.viewportSize() ?? { width: 0, height: 0 };
}
