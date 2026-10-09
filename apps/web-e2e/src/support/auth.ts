import { expect, type Page } from '@playwright/test';

export const PASSWORD = 'correct-horse-battery';

/** A fresh account per test, so tests do not depend on each other or on the seed. */
export const uniqueEmail = (): string =>
  `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

export async function register(page: Page, email: string): Promise<void> {
  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
}

export async function signIn(
  page: Page,
  email: string,
  password = PASSWORD,
): Promise<void> {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}
