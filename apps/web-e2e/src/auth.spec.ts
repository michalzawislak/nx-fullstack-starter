import { expect, test } from '@playwright/test';

import { PASSWORD, register, signIn, uniqueEmail } from './support/auth';

test.describe('authentication', () => {
  test('registers a new account and lands on the home screen', async ({
    page,
  }) => {
    // Arrange
    const email = uniqueEmail();

    // Act
    await register(page, email);

    // Assert
    await expect(page).toHaveURL('/');
    await expect(page.getByText(`You are signed in as ${email}`)).toBeVisible();
  });

  test('keeps the session after a reload through the refresh cookie', async ({
    page,
  }) => {
    // Arrange
    const email = uniqueEmail();
    await register(page, email);

    // Act
    await page.reload();

    // Assert
    await expect(page.getByText(`You are signed in as ${email}`)).toBeVisible();
  });

  test('signs out and protects routes afterwards', async ({ page }) => {
    // Arrange
    await register(page, uniqueEmail());
    await page.getByRole('link', { name: 'Account' }).click();

    // Act
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/account');

    // Assert
    await expect(page).toHaveURL('/login?returnUrl=%2Faccount');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  test('rejects a wrong password and signs in with the right one, returning to the requested page', async ({
    page,
  }) => {
    // Arrange
    const email = uniqueEmail();
    await register(page, email);
    await page.getByRole('link', { name: 'Account' }).click();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.goto('/account');

    // Act
    await signIn(page, email, 'wrong-password');
    const error = page
      .getByRole('alert')
      .filter({ hasText: 'Incorrect email or password.' });
    await expect(error).toBeVisible();
    await signIn(page, email, PASSWORD);

    // Assert
    await expect(page).toHaveURL('/account');
    await expect(page.getByRole('heading', { name: 'Account' })).toBeVisible();
  });

  test('validates the form with the shared schema before calling the API', async ({
    page,
  }) => {
    // Arrange
    const apiCalls: string[] = [];
    page.on(
      'request',
      (request) =>
        request.url().includes('/v1/auth/login') &&
        apiCalls.push(request.url()),
    );
    await page.goto('/login');

    // Act
    await page.getByLabel('Email').fill('not-an-email');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Assert
    await expect(page.getByLabel('Email')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(apiCalls).toEqual([]);
  });
});
