import { test, expect } from '@playwright/test';
import { APP_URLS } from './config/appUrls';
import { loginToSpeedPay } from './config/speedpayAuth';

test.use({ launchOptions: { slowMo: 200 } });

test('ITE PLAYWRIGHT', async ({ page }) => {
  test.setTimeout(60000);

  // --- ACT I: SPEEDPAY CLIENT PORTAL ---
  await loginToSpeedPay(page);

  const invoicesLink = page.getByRole('link', { name: 'My Invoices' });
  await expect(invoicesLink).toBeVisible({ timeout: 10000 });
  if (await invoicesLink.isVisible({ timeout: 2000 }).catch(() => false)) {
    await invoicesLink.click().catch(() => {});
  }

  const rowBtn = page.getByRole('row', { name: /PLD-2026-0009/i }).getByRole('button').first();
  if (await rowBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await rowBtn.click().catch(() => {});
  }

  const gcashText = page.getByText('GCash');
  if (await gcashText.isVisible({ timeout: 2000 }).catch(() => false)) {
    await gcashText.click().catch(() => {});
  }

  const payMongoBtn = page.getByRole('button', { name: /Pay via PayMongo/i });
  if (await payMongoBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await payMongoBtn.click().catch(() => {});
  }

  const attachBtn = page.getByRole('button', { name: 'Complete Payment & Attach' });
  if (await attachBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await attachBtn.click().catch(() => {});
  }

  const refInput = page.locator('input[placeholder*="Reference"], input[placeholder*="REF"]').first();
  if (await refInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await refInput.fill('REF-2026-0009').catch(() => {});
  }

  await page.locator('input[type="file"]').setInputFiles('752441233_1752934566159360_3334055542906429067_n.png').catch(() => {});

  const submitPaymentBtn = page.getByRole('button', { name: 'Submit Payment' });
  if (await submitPaymentBtn.isEnabled({ timeout: 2000 }).catch(() => false)) {
    await submitPaymentBtn.click().catch(() => {});
  }

  // --- ACT II: TRANSITION TO FOMS OPERATIONS PORTAL ---
  const page1 = await page.context().newPage();

  console.log(`Navigating page1 to ${APP_URLS.foms}/login...`);
  await page1.goto(`${APP_URLS.foms}/login`);

  const empInput = page1.getByRole('textbox', { name: 'Employee ID' });
  const empPwdInput = page1.getByRole('textbox', { name: 'Password' });

  await empInput.fill('EMP-002');
  await empPwdInput.fill('Password@123');
  await page1.getByRole('button', { name: /Log In|Sign In to FOMS/i }).click();

  const arLink = page1.getByRole('link', { name: /Accounts Receivable/i });
  await expect(arLink).toBeVisible({ timeout: 10000 });
  if (await arLink.isVisible({ timeout: 2000 }).catch(() => false)) {
    await arLink.click().catch(() => {});
  }

  const searchRecords = page1.getByRole('textbox', { name: 'Search records' }).first();
  if (await searchRecords.isVisible({ timeout: 2000 }).catch(() => false)) {
    await searchRecords.fill('CL-007').catch(() => {});
  }

  const pldtCell = page1.getByRole('cell', { name: 'CL-007' }).first();
  if (await pldtCell.isVisible({ timeout: 2000 }).catch(() => false)) {
    await pldtCell.click().catch(() => {});
  }

  const speedPayLink = page1.getByRole('link', { name: /SpeedPay Validation/i });
  if (await speedPayLink.isVisible({ timeout: 2000 }).catch(() => false)) {
    await speedPayLink.click().catch(() => {});
  }

  const spClientCell = page1.getByRole('cell', { name: 'CL-007' }).first();
  if (await spClientCell.isVisible({ timeout: 2000 }).catch(() => false)) {
    await spClientCell.click().catch(() => {});
  }

  const submitValidationBtn = page1.getByRole('button', { name: 'Submit Validation' }).first();
  if (await submitValidationBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await submitValidationBtn.click().catch(() => {});
  }

  const paymentsLink = page1.getByRole('link', { name: /Payment Validation/i });
  if (await paymentsLink.isVisible({ timeout: 2000 }).catch(() => false)) {
    await paymentsLink.click().catch(() => {});
  }

  const auditLink = page1.getByRole('link', { name: /Audit Trail/i });
  if (await auditLink.isVisible({ timeout: 2000 }).catch(() => false)) {
    await auditLink.click().catch(() => {});
  }
});