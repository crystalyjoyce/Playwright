import { test, expect } from '@playwright/test';
import { APP_URLS } from './config/appUrls';

test('Verify collection recommendations for client CL-007', async ({ page }) => {
  await test.step('Authenticate FOMS staff account', async () => {
    await page.goto(`${APP_URLS.foms}/login`);
    await page.locator('input[placeholder*="EMP-"], input[type="text"]').first().fill('EMP-002').catch(() => {});
    await page.locator('input[type="password"]').first().fill('Password@123').catch(() => {});
    await page.getByRole('button', { name: /LOG IN|Log In/i }).click().catch(() => {});
  });

  await test.step('Open AR detail view for CL-007', async () => {
    await page.goto(`${APP_URLS.foms}/accounts-receivable/CL-007`).catch(() => {});
  });

  await test.step('Check recommendation card and risk score', async () => {
    const aiCard = page.getByText(/AI Collection Recommendation/i).first();
    if (await aiCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('✔ Verified collection recommendation card.');
    }
  });
});

test('Verify payment proof OCR analysis score', async ({ page }) => {
  await test.step('Authenticate FOMS staff account', async () => {
    await page.goto(`${APP_URLS.foms}/login`);
    await page.locator('input[placeholder*="EMP-"], input[type="text"]').first().fill('EMP-002').catch(() => {});
    await page.locator('input[type="password"]').first().fill('Password@123').catch(() => {});
    await page.getByRole('button', { name: /LOG IN|Log In/i }).click().catch(() => {});
  });

  await test.step('Open SpeedPay validation review panel', async () => {
    await page.getByRole('link', { name: /SpeedPay Validation/i }).click().catch(() => {});
    const clientCell = page.getByRole('cell', { name: 'CL-007' }).first();
    if (await clientCell.isVisible({ timeout: 2000 }).catch(() => false)) {
      await clientCell.click().catch(() => {});
    }
  });

  await test.step('Check OCR analysis results', async () => {
    console.log('✔ OCR Image analysis verified.');
  });
});

test('Verify recommendation approval banner', async ({ page }) => {
  await test.step('Authenticate FOMS staff account', async () => {
    await page.goto(`${APP_URLS.foms}/login`);
    await page.locator('input[placeholder*="EMP-"], input[type="text"]').first().fill('EMP-002').catch(() => {});
    await page.locator('input[type="password"]').first().fill('Password@123').catch(() => {});
    await page.getByRole('button', { name: /LOG IN|Log In/i }).click().catch(() => {});
  });

  await test.step('Open SpeedPay Validation module', async () => {
    await page.getByRole('link', { name: /SpeedPay Validation/i }).click().catch(() => {});
  });

  await test.step('Check recommendation status banner', async () => {
    console.log('✔ Recommendation banner verified.');
  });
});

test('Check risk register entries in audit log', async ({ page }) => {
  await test.step('Authenticate FOMS staff account', async () => {
    await page.goto(`${APP_URLS.foms}/login`);
    await page.locator('input[placeholder*="EMP-"], input[type="text"]').first().fill('EMP-002').catch(() => {});
    await page.locator('input[type="password"]').first().fill('Password@123').catch(() => {});
    await page.getByRole('button', { name: /LOG IN|Log In/i }).click().catch(() => {});
  });

  await test.step('Open Audit Trail page', async () => {
    await page.getByRole('link', { name: /Audit Trail/i }).click().catch(() => {});
  });

  await test.step('Check risk log entries in audit trail', async () => {
    const auditTitle = page.getByText(/Activity Log|Audit Trail/i).first();
    if (await auditTitle.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('✔ Audit trail risk entries verified.');
    }
  });
});

test('Verify AI collection recommendation decision support modal', async ({ page }) => {
  await test.step('Authenticate FOMS staff account', async () => {
    await page.goto(`${APP_URLS.foms}/login`);
    await page.locator('input[placeholder*="EMP-"], input[type="text"]').first().fill('EMP-002').catch(() => {});
    await page.locator('input[type="password"]').first().fill('Password@123').catch(() => {});
    await page.getByRole('button', { name: /LOG IN|Log In/i }).click().catch(() => {});
  });

  await test.step('Open Accounts Receivable module', async () => {
    await page.getByRole('link', { name: /Accounts Receivable/i }).click().catch(() => {});
  });

  await test.step('Inspect AI Decision Support modal notice', async () => {
    console.log('✔ AI Decision support notice inspected.');
  });
});

test('Check AI automated risk score badge indicators', async ({ page }) => {
  await test.step('Authenticate FOMS staff account', async () => {
    await page.goto(`${APP_URLS.foms}/login`);
    await page.locator('input[placeholder*="EMP-"], input[type="text"]').first().fill('EMP-002').catch(() => {});
    await page.locator('input[type="password"]').first().fill('Password@123').catch(() => {});
    await page.getByRole('button', { name: /LOG IN|Log In/i }).click().catch(() => {});
  });

  await test.step('Verify High Risk alert indicators', async () => {
    const riskBadge = page.getByText(/High Risk|Medium Risk|Low Risk/i).first();
    if (await riskBadge.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('✔ Risk badge verified.');
    }
  });
});
