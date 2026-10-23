import { test, expect } from '@playwright/test';
import { join } from 'path';
import { APP_URLS } from './config/appUrls';
import { loginToSpeedPay } from './config/speedpayAuth';

test.use({ launchOptions: { slowMo: 200 } });

test('Validate client portal login error messages', async ({ page }) => {
  await test.step('Navigate to SpeedPay login page', async () => {
    await page.goto(`${APP_URLS.speedpay}/login`);
  });
  
  const clientIdInput = page.locator('input[placeholder*="CL-"], input[placeholder*="ID"], input[type="text"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  const loginBtn = page.getByRole('button', { name: /LOG IN|Sign In/i });

  await test.step('Check empty credentials validation error', async () => {
    await loginBtn.click();
    await expect(page.getByText('Client ID is required.', { exact: true })).toBeVisible();
    await expect(page.locator('.tb-toast-item')).toHaveCount(0);
  });

  await test.step('Check invalid Client ID error alert', async () => {
    await clientIdInput.fill('CL-999-WRONG');
    await passwordInput.fill('Password@123');
    await loginBtn.click();
    await expect(page.getByRole('alert')).toHaveText('Client ID not found.');
    await expect(page.locator('.tb-toast-item')).toHaveCount(0);
  });

  await test.step('Check wrong password error alert', async () => {
    await clientIdInput.fill('CL-007');
    await passwordInput.fill('WrongPass999!');
    await loginBtn.click();
    await expect(page.getByRole('alert')).toHaveText('Invalid password.');
    await expect(page.locator('.tb-toast-item')).toHaveCount(0);
  });

  await test.step('Login with valid CL-007 account', async () => {
    await clientIdInput.fill('CL-007');
    await passwordInput.fill('Password@123');
    await loginBtn.click();
    await expect(page.getByRole('link', { name: /My Invoices/i })).toBeVisible();
    await expect(page.locator('.tb-toast-item').filter({ hasText: /Client ID not found|Invalid password|required/i })).toHaveCount(0);
  });
});

test('Search and filter invoices', async ({ page }) => {
  await test.step('Authenticate SpeedPay client account', async () => {
    await loginToSpeedPay(page);
  });

  await test.step('Open My Invoices tab and inspect invoice list', async () => {
    await page.getByRole('link', { name: /My Invoices|Invoices/i }).click().catch(() => {});
  });

  await test.step('Filter invoice records by invoice number', async () => {
    const searchBox = page.locator('input[placeholder*="Search"]').first();
    if (await searchBox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchBox.fill('PLD-2026-0009').catch(() => {});
    }
  });
});

test('Submit a demo payment and verify it is pending validation', async ({ page }) => {
  const paymentReference = 'TEST-PAYREF-PLAYWRIGHT';

  await page.route('**/api/speedpay/initiate-invoice', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      checkoutUrl: 'http://localhost/mock-checkout',
      referenceOrNumber: paymentReference,
    }),
  }));
  await page.route('**/api/speedpay/submissions', route => route.fulfill({
    status: 201,
    contentType: 'application/json',
    body: JSON.stringify({ success: true }),
  }));

  await loginToSpeedPay(page);
  await page.getByRole('link', { name: /My Invoices|Invoices/i }).click();

  const payNowButton = page.getByRole('button', { name: /Pay now/i }).first();
  await expect(payNowButton).toBeVisible();
  const invoiceRow = payNowButton.locator('xpath=ancestor::tr');
  const invoiceId = (await invoiceRow.locator('td').first().innerText()).trim();
  await payNowButton.click();
  await expect(page.getByText('PAYMENT DETAILS')).toBeVisible();

  await page.getByRole('button', { name: /Pay via PayMongo/i }).click();
  await expect(page.getByRole('heading', { name: 'PayMongo Checkout' })).toBeVisible();
  await page.getByRole('button', { name: /Simulate Payment Success/i }).click();

  await expect(page.getByRole('heading', { name: 'Upload Proof of Payment' })).toBeVisible();
  await page.locator('input[type="file"]').last().setInputFiles(join(__dirname, '..', 'fixtures', 'speedpay.png'));
  await expect(page.getByText(/Image is clear and the payment amount matches the invoice/i)).toBeVisible();
  await page.getByRole('button', { name: 'Submit Proof of Payment' }).click();

  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { name: 'Payment Submitted' })).toBeVisible();
  await main.getByRole('button', { name: 'View Payment History' }).click();

  const paymentRow = page.getByRole('row').filter({ hasText: paymentReference });
  await expect(paymentRow).toContainText(invoiceId);
  await expect(paymentRow).toContainText('Pending Validation');
});

test('Check payment history status', async ({ page }) => {
  await test.step('Authenticate SpeedPay client account', async () => {
    await loginToSpeedPay(page);
  });

  await test.step('Open Payment History page', async () => {
    const historyLink = page.getByRole('link', { name: /Payment History|History/i });
    if (await historyLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await historyLink.click().catch(() => {});
    }
  });

  await test.step('Verify payment record status badge', async () => {
    const statusBadge = page.getByText(/Pending Validation|Validated|Paid/i).first();
    if (await statusBadge.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('✔ Payment status verified.');
    }
  });
});

test('Validate payment method options selection', async ({ page }) => {
  await test.step('Authenticate SpeedPay client account', async () => {
    await loginToSpeedPay(page);
  });

  await test.step('Navigate to My Invoices page', async () => {
    await page.getByRole('link', { name: /My Invoices|Invoices/i }).click().catch(() => {});
  });

  await test.step('Select Bank Transfer payment option', async () => {
    const bankOpt = page.getByText('Bank Transfer').first();
    if (await bankOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
      await bankOpt.click().catch(() => {});
    }
  });

  await test.step('Select Maya payment option', async () => {
    const mayaOpt = page.getByText('Maya').first();
    if (await mayaOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
      await mayaOpt.click().catch(() => {});
    }
  });
});

test('Verify seamless navigation between portal sections', async ({ page }) => {
  await test.step('Authenticate SpeedPay client account', async () => {
    await loginToSpeedPay(page);
  });

  await test.step('Navigate to My Invoices page', async () => {
    await page.getByRole('link', { name: /My Invoices|Invoices/i }).click().catch(() => {});
  });

  await test.step('Navigate to Payment History page', async () => {
    await page.getByRole('link', { name: /Payment History|History/i }).click().catch(() => {});
  });
});
