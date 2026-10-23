import { expect, test } from '@playwright/test';
import { APP_URLS } from './config/appUrls';

const accounts = [
  { id: 'EMP-001', destination: '**/ai/dashboard' },
  { id: 'EMP-002', destination: '**/ai/dashboard' },
  { id: 'EMP-003', destination: '**/ai/dashboard' },
  { id: 'EMP-004', destination: '**/ai/dashboard' },
  { id: 'EMP-005', destination: '**/ai/dashboard' },
  { id: 'EMP-006', destination: '**/unauthorized' },
  { id: 'EMP-007', destination: '**/ai/dashboard' },
  { id: 'CA-001', destination: '**/unauthorized' },
  { id: 'CA-002', destination: '**/unauthorized' },
  { id: 'CA-003', destination: '**/unauthorized' },
];

for (const account of accounts) {
  test(`signs in seeded account ${account.id}`, async ({ page }) => {
    await page.goto(`${APP_URLS.ai}/login`);
    await page.locator('#ai-employee-id').fill(account.id);
    await page.locator('#ai-password').fill('Password@123');
    await page.locator('#ai-login-btn').click();

    await page.waitForURL(account.destination);

    if (account.destination === '**/unauthorized') {
      await expect(page.getByText('Access Restricted')).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/ai\/dashboard$/);
    }
  });
}
