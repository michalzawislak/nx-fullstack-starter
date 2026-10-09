import { expect, test } from '@playwright/test';

import { register, uniqueEmail } from './support/auth';
import { viewportOf } from './support/viewport';

test.describe('responsive shell (FE-21)', () => {
  test(
    'uses a bottom bar on narrow screens',
    { tag: '@mobile' },
    async ({ page }) => {
      // Arrange
      await register(page, uniqueEmail());
      const viewport = viewportOf(page);

      // Act
      const nav = await page
        .getByRole('navigation', { name: 'Main' })
        .boundingBox();

      // Assert
      expect((nav?.y ?? 0) + (nav?.height ?? 0)).toBeGreaterThan(
        viewport.height - 2,
      );
      expect(nav?.width).toBeCloseTo(viewport.width, 0);
    },
  );

  test(
    'uses a side panel on wide screens',
    { tag: '@desktop' },
    async ({ page }) => {
      // Arrange
      await register(page, uniqueEmail());
      const viewport = viewportOf(page);

      // Act
      const nav = await page
        .getByRole('navigation', { name: 'Main' })
        .boundingBox();

      // Assert
      expect(nav?.x).toBe(0);
      expect(nav?.width).toBeLessThan(300);
      expect(nav?.height).toBeGreaterThan(viewport.height / 2);
    },
  );

  test('keeps touch targets at least 44 px high (FE-19)', async ({ page }) => {
    // Arrange
    await page.goto('/login');

    // Act
    const button = await page
      .getByRole('button', { name: 'Sign in' })
      .boundingBox();
    const input = await page.getByLabel('Email').boundingBox();

    // Assert
    expect(button?.height).toBeGreaterThanOrEqual(44);
    expect(input?.height).toBeGreaterThanOrEqual(44);
  });

  test('shows the offline banner when the network drops (FE-16)', async ({
    page,
    context,
  }) => {
    // Arrange
    await page.goto('/login');

    // Act
    await context.setOffline(true);

    // Assert
    await expect(page.getByRole('status')).toContainText('You are offline');
    await context.setOffline(false);
    await expect(page.getByRole('status')).toHaveText('');
  });
});
