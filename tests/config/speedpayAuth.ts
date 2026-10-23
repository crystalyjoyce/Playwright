import { expect, type Page } from '@playwright/test';
import { APP_URLS } from './appUrls';

export async function loginToSpeedPay(page: Page) {
  await page.goto(`${APP_URLS.speedpay}/login`);
  await page.locator('input[placeholder*="CL-"], input[placeholder*="ID"], input[type="text"]').first().fill('CL-007');
  await page.locator('input[type="password"]').first().fill('Password@123');
  await page.getByRole('button', { name: /LOG IN|Sign In/i }).click();

  await expect(page.getByRole('link', { name: /My Invoices/i })).toBeVisible();
  await expect(
    page.locator('.tb-toast-item').filter({ hasText: /Client ID not found|Invalid password/i })
  ).toHaveCount(0);
}

export async function expectAndDismissSpeedPayError(page: Page, message: string | RegExp) {
  const toast = page.locator('.tb-toast-item').filter({ hasText: message });
  await expect(toast).toBeVisible();
  await toast.getByRole('button', { name: 'Close notification' }).click();
  await toast.waitFor({ state: 'detached' });
}
