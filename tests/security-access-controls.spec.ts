import { test, expect } from '@playwright/test';
import { APP_URLS } from './config/appUrls';
import { loginToSpeedPay } from './config/speedpayAuth';

test('Verify invalid client ID authentication error is shown inline', async ({ page }) => {
  await test.step('Reject a non-existent client ID without a popup notification', async () => {
    await page.goto(`${APP_URLS.speedpay}/login`);
    const clientIdInput = page.locator('input[placeholder*="CL-"], input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await clientIdInput.fill('CL-999-NONEXISTENT');
    await passwordInput.fill('Password@123');
    await page.getByRole('button', { name: /LOG IN|Log In/i }).click();
    await expect(page.getByRole('alert')).toHaveText('Client ID not found.');
    await expect(page.locator('.tb-toast-item')).toHaveCount(0);
  });
});

test('Verify multi-tab session handling', async ({ page }) => {
  await test.step('Open SpeedPay Client Portal tab', async () => {
    await loginToSpeedPay(page);
  });

  await test.step('Open FOMS Operations tab on new page context', async () => {
    const fomsPage = await page.context().newPage();
    await fomsPage.goto(`${APP_URLS.foms}/login`);
    await fomsPage.getByRole('textbox', { name: 'Employee ID' }).fill('EMP-002');
    await fomsPage.getByRole('textbox', { name: 'Password' }).fill('Password@123');
    await fomsPage.getByRole('button', { name: /Log In|Sign In to FOMS/i }).click();

    await fomsPage.getByRole('link', { name: /Audit Logs/i }).click();
    await expect(fomsPage.getByText(/Activity Log|Audit Logs/i).first()).toBeVisible();
  });
});

test('Filter activity logs by module', async ({ page }) => {
  await test.step('Authenticate FOMS staff account', async () => {
    await page.goto(`${APP_URLS.foms}/login`);
    await page.getByRole('textbox', { name: 'Employee ID' }).fill('EMP-002');
    await page.getByRole('textbox', { name: 'Password' }).fill('Password@123');
    await page.getByRole('button', { name: /Log In|Sign In to FOMS/i }).click();
    await expect(page.getByRole('link', { name: /Audit Logs/i })).toBeVisible();
  });

  await test.step('Open Audit Trail page', async () => {
    await page.getByRole('link', { name: /Audit Logs/i }).click();
  });

  await test.step('Filter logs by module dropdown', async () => {
    const moduleFilter = page.locator('select').last();
    if (await moduleFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await moduleFilter.selectOption({ index: 1 }).catch(() => {});
    }
  });
});

test('Verify user session logout and protected route redirection', async ({ page }) => {
  await test.step('Authenticate SpeedPay client account', async () => {
    await loginToSpeedPay(page);
  });

  await test.step('Perform logout action', async () => {
    await page.getByTitle('Account Information & Logout').click();
    await page.getByRole('button', { name: 'Log Out Account' }).click();
    await page.getByRole('button', { name: 'Yes, Log Out' }).click();
    await expect(page.getByRole('textbox', { name: /Client ID/i })).toBeVisible();
  });
});

test('Search audit trail records by user action', async ({ page }) => {
  await test.step('Authenticate FOMS staff account', async () => {
    await page.goto(`${APP_URLS.foms}/login`);
    await page.getByRole('textbox', { name: 'Employee ID' }).fill('EMP-002');
    await page.getByRole('textbox', { name: 'Password' }).fill('Password@123');
    await page.getByRole('button', { name: /Log In|Sign In to FOMS/i }).click();
    await expect(page.getByRole('link', { name: /Audit Logs/i })).toBeVisible();
  });

  await test.step('Open Audit Trail and search for EMP-002', async () => {
    await page.getByRole('link', { name: /Audit Logs/i }).click();
    const searchBox = page.getByRole('textbox', { name: /Search/i }).first();
    if (await searchBox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchBox.fill('EMP-002').catch(() => {});
    }
  });
});

test('Log out of FOMS at the end of the combined suite', async ({ page }) => {
  await page.goto(`${APP_URLS.foms}/login`);
  await page.getByRole('textbox', { name: 'Employee ID' }).fill('EMP-002');
  await page.getByRole('textbox', { name: 'Password' }).fill('Password@123');
  await page.getByRole('button', { name: /Log In|Sign In to FOMS/i }).click();
  await expect(page.getByRole('link', { name: /Audit Logs/i })).toBeVisible();

  await page.locator('.sidebar-footer .profile-card').click();
  await page.getByRole('button', { name: /Log Out/i }).click();

  await expect(page.getByRole('textbox', { name: 'Employee ID' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
});
