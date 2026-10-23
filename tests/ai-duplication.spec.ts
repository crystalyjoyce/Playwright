import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { APP_URLS } from './config/appUrls';

test('AI duplicate scan accepts receipt images and displays a result', async ({ page }) => {
  const duplicateScanAppUrl = process.env.FOMS_DUPLICATE_SCAN_URL || APP_URLS.foms;
  await page.goto(`${duplicateScanAppUrl}/login`);
  await page.getByRole('textbox', { name: 'Employee ID' }).fill('EMP-003');
  await page.getByRole('textbox', { name: 'Password' }).fill('Password@123');
  await page.getByRole('button', { name: /Log In|Sign In to FOMS/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto(`${duplicateScanAppUrl}/duplicate-scan`);
  await expect(page.getByRole('heading', { name: 'Document Checking & AI Scan Console' })).toBeVisible();

  const receiptImage = await readFile(join(__dirname, '..', 'fixtures', 'speedpay.png'));
  for (const fileName of ['test-receipt-1.png', 'test-receipt-2.png']) {
    await page.locator('input[type="file"]').setInputFiles({
      name: fileName,
      mimeType: 'image/png',
      buffer: receiptImage,
    });
    await expect(page.getByText(fileName, { exact: true })).toBeVisible();
    const imagePreview = page.getByRole('img', { name: `Preview of ${fileName}` });
    await expect(imagePreview).toBeVisible();
    expect(await imagePreview.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await page.getByRole('button', { name: 'Run AI Scan' }).click();
    await expect(page.getByText(/Duplicate Detected|Unique Document/)).toBeVisible();

    if (fileName !== 'speedpay.png') {
      await page.getByRole('button', { name: 'Scan Another' }).click();
    }
  }
});
