import { test, expect } from '@playwright/test';

test.describe('Storefront E2E tests', () => {
  test('should load the homepage correctly', async ({ page }) => {
    // Navigate to the local server
    await page.goto('/');

    // Validate the page title exists implicitly, this is an ecommerce
    await expect(page).toHaveTitle(/TCG|Magic|Pokemon|Store/i);
    
    // Optionally check if a typical navbar identifier is visible
    // As we don't know the exact DOM yet, we'll just check body
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
