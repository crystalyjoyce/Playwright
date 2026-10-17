import { test, expect } from '@playwright/test';

test('AI duplicate scan accepts receipt images and displays a result', async ({ page }) => {
  const duplicateScanAppUrl = process.env.FOMS_DUPLICATE_SCAN_URL || 'http://localhost:5173';
  await page.goto(`${duplicateScanAppUrl}/login`);
  await page.getByRole('textbox', { name: 'Employee ID' }).fill('EMP-003');
  await page.getByRole('textbox', { name: 'Password' }).fill('Password@123');
  await page.getByRole('button', { name: /Log In|Sign In to FOMS/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto(`${duplicateScanAppUrl}/duplicate-scan`);
  await expect(page.getByRole('heading', { name: 'Document Checking & AI Scan Console' })).toBeVisible();

  const receiptImage = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/f6sAAAAASUVORK5CYII=',
    'base64'
  );

  for (const fileName of ['test-receipt-1.png', 'test-receipt-2.png']) {
    await page.locator('input[type="file"]').setInputFiles({
      name: fileName,
      mimeType: 'image/png',
      buffer: receiptImage,
    });
    await expect(page.getByText(fileName, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Start AI Duplicate Scan' }).click();
    await expect(page.getByText(/Duplicate Detected|Unique Document/)).toBeVisible();

    if (fileName !== 'speedpay.png') {
      await page.getByRole('button', { name: 'Scan Another' }).click();
    }
  }
});
