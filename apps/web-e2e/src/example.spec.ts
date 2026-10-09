import { expect, test } from '@playwright/test';

test('shows the application title', async ({ page }) => {
  // Arrange & Act
  await page.goto('/');

  // Assert
  await expect(page.locator('h1')).toContainText('Starter');
});
