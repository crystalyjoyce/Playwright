import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Environment configurations
const AI_BASE_URL = process.env.AI_BASE_URL || 'http://localhost:5175';
const SPEEDPAY_BASE_URL = process.env.SPEEDPAY_BASE_URL || 'http://localhost:5174';

const AI_USERNAME = process.env.AI_USERNAME || 'EMP-001'; // Financial Manager
const AI_PASSWORD = process.env.AI_PASSWORD || 'Password@123';
const ACCOUNTANT_USERNAME = 'EMP-003'; // Accountant with Collection Priorities scope
const ACCOUNTANT_PASSWORD = 'Password@123';

const SPEEDPAY_CLIENT_ID = 'test-001';
const SPEEDPAY_PASSWORD = 'password123';

// Screenshot directory setup
const screenshotsDir = path.join(__dirname, 'test-results', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Fixture file paths (auto-created if missing)
const fixturesDir = path.join(__dirname, 'tests', 'fixtures');
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}
const sampleReceiptFixture = path.join(fixturesDir, 'sample-receipt.png');
const uniqueReceiptFixture = path.join(fixturesDir, 'unique-receipt.png');

const pngDummy = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);
if (!fs.existsSync(sampleReceiptFixture)) {
  fs.writeFileSync(sampleReceiptFixture, pngDummy);
}
if (!fs.existsSync(uniqueReceiptFixture)) {
  fs.writeFileSync(uniqueReceiptFixture, pngDummy);
}

/**
 * Helper to log in to FOMS AI Layer
 */
export async function loginFOMS(
  page: Page,
  username: string = AI_USERNAME,
  password: string = AI_PASSWORD
) {
  await page.goto(`${AI_BASE_URL}/login`);

  const userInput = page.locator('#ai-employee-id');
  const passwordInput = page.locator('#ai-password');
  const submitBtn = page.locator('#ai-login-btn');

  await userInput.fill(username);
  await passwordInput.fill(password);

  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().includes('/api/ai/auth/login')
  );

  await submitBtn.click();
  const response = await responsePromise;

  expect(response.ok()).toBeTruthy();
  await page.waitForURL(/\/ai\/dashboard/);
  await expect(page).not.toHaveURL(/\/login/);
}

/**
 * Helper to log in to SpeedPay Customer Portal
 */
export async function loginSpeedPay(
  page: Page,
  clientId: string = SPEEDPAY_CLIENT_ID,
  password: string = SPEEDPAY_PASSWORD
) {
  await page.goto(`${SPEEDPAY_BASE_URL}/`);

  // Check if we are already logged in or on the login form
  const isLoginPage = await page.getByRole('textbox', { name: /Client ID/i }).isVisible().catch(() => false);
  if (isLoginPage) {
    const clientIdInput = page.getByRole('textbox', { name: /Client ID/i });
    const passwordInput = page.getByRole('textbox', { name: /Password/i });
    const loginBtn = page.getByRole('button', { name: /Log In|Sign In/i });

    await clientIdInput.fill(clientId);
    await passwordInput.fill(password);
    await loginBtn.click();
    await page.waitForLoadState('domcontentloaded');
  }
}

/**
 * Helper to click sidebar items reliably in AI Layer
 */
export async function clickSidebar(page: Page, label: string) {
  const item = page.locator('.sidebar a.nav-item').filter({ hasText: label });
  await expect(item.first()).toBeVisible();
  await item.first().click();
}

test.describe('FOMS AI Layer & SpeedPay Decision Support Test Suite', () => {

  // ===========================================================================
  // STEP 1: AI-LAYER AUTHENTICATION & DASHBOARD
  // ===========================================================================
  test.describe('STEP 1: AI-Layer Authentication & Dashboard', () => {

    test('1.1 Authentication & Dashboard KPI Cards', async ({ page }) => {
      await page.goto(`${AI_BASE_URL}/login`);

      // Verify form elements
      const employeeInput = page.locator('#ai-employee-id');
      const passwordInput = page.locator('#ai-password');
      const loginButton = page.locator('#ai-login-btn');

      await expect(employeeInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(loginButton).toBeVisible();

      // Enter valid credentials
      await employeeInput.fill(AI_USERNAME);
      await passwordInput.fill(AI_PASSWORD);

      const loginApiPromise = page.waitForResponse(
        (res) => res.request().method() === 'POST' && res.url().includes('/api/ai/auth/login')
      );
      await loginButton.click();
      const loginRes = await loginApiPromise;
      expect(loginRes.status()).toBe(200);

      // Assert Dashboard URL and KPI cards
      await page.waitForURL(/\/ai\/dashboard/);
      await expect(page.locator('h1.header-title, h1').first()).toContainText(/Dashboard/i);
      await expect(page.getByText(/Total Duplicate Alerts/i)).toBeVisible();
      await expect(page.getByText(/Pending Review/i).first()).toBeVisible();
      await expect(page.getByText(/Exact Match Alerts/i)).toBeVisible();
      await expect(page.getByText(/Urgent Collections/i)).toBeVisible();
      await expect(page.getByText(/Awaiting Validation/i)).toBeVisible();

      await page.screenshot({ path: path.join(screenshotsDir, '01-dashboard-view.png') });
    });

    test('1.2 Dashboard Date Range Filters (7D, 30D, 90D), Refresh & Export', async ({ page }) => {
      await loginFOMS(page);

      // 7D Filter
      const btn7d = page.getByRole('button', { name: /7D/i });
      await expect(btn7d).toBeVisible();
      await btn7d.click();
      await expect(btn7d).toBeVisible();

      // 30D Filter
      const btn30d = page.getByRole('button', { name: /30D/i });
      await expect(btn30d).toBeVisible();
      await btn30d.click();
      await expect(btn30d).toBeVisible();

      // 90D Filter
      const btn90d = page.getByRole('button', { name: /90D/i });
      await expect(btn90d).toBeVisible();
      await btn90d.click();
      await expect(btn90d).toBeVisible();

      // Refresh Button
      const refreshBtn = page.getByRole('button', { name: /Refresh/i });
      await expect(refreshBtn).toBeVisible();
      await refreshBtn.click();
      await expect(page.locator('.main-area')).toBeVisible();

      // Export Report Button
      const exportBtn = page.getByRole('button', { name: /Export Report/i });
      await expect(exportBtn).toBeVisible();
      await exportBtn.click();
      await expect(page.locator('.tb-toast-item').first()).toBeVisible();
    });

  });

  // ===========================================================================
  // STEP 2: AI DUPLICATE DETECTION WORKFLOW (SEQUENTIAL TAB CLICKS)
  // ===========================================================================
  test.describe('STEP 2: AI Duplicate Detection Workflow', () => {

    test.beforeEach(async ({ page }) => {
      await loginFOMS(page);
    });

    test('2.1 AI Duplicate Scan Console & Scan Document', async ({ page }) => {
      await clickSidebar(page, 'AI Duplicate Scan');
      await page.waitForURL(/\/ai\/duplicate-alerts/);

      await expect(page.getByText(/Document Checking & AI Scan Console/i)).toBeVisible();

      // Test Scan Document button trigger
      const scanDocBtn = page.getByRole('button', { name: /Scan Document/i }).last();
      await scanDocBtn.click();
      await expect(page.getByText(/Scan Document Console/i)).toBeVisible();

      // Close modal
      const closeBtn = page.getByRole('button', { name: 'Close', exact: true }).or(page.locator('button.modal-x-btn')).first();
      await closeBtn.click();
      await expect(page.getByText(/Scan Document Console/i)).not.toBeVisible();

      // Upload and trigger real scan API
      const fileInput = page.locator('#simplified-uploader');
      const scanApiPromise = page.waitForResponse(
        (res) => res.request().method() === 'POST' && res.url().includes('/api/ai/duplicates/scan')
      );
      await fileInput.setInputFiles(sampleReceiptFixture);
      const scanResponse = await scanApiPromise;
      expect(scanResponse.ok()).toBeTruthy();

      await page.screenshot({ path: path.join(screenshotsDir, '02-duplicate-scan.png') });
    });

    test('2.2 Unique Documents Tab & Search/Filter Input', async ({ page }) => {
      await clickSidebar(page, 'Unique Documents');
      await page.waitForURL(/\/ai\/duplicate-alerts\?tab=unique-docs/);

      await expect(page.getByText(/Unique Ledger Database/i)).toBeVisible();

      // Interact with search input if present
      const searchInput = page.locator('input[placeholder*="Search" i], input.dt-search-input').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('REC-');
        await expect(searchInput).toHaveValue('REC-');
        await searchInput.clear();
      }

      await page.screenshot({ path: path.join(screenshotsDir, '03-unique-docs.png') });
    });

    test('2.3 Flagged Duplicates Tab & Modal Interactions', async ({ page }) => {
      await clickSidebar(page, 'Flagged Duplicates');
      await page.waitForURL(/\/ai\/duplicate-alerts\?tab=flagged-dups/);

      await expect(page.getByText(/Flagged Duplicate Records/i)).toBeVisible();

      // If rows exist, click review action
      const reviewActionBtn = page.getByRole('button', { name: /Review|View|Details/i }).or(page.locator('.btn-primary')).first();
      if (await reviewActionBtn.isVisible()) {
        await reviewActionBtn.click();
        await page.waitForTimeout(500);
      }

      await page.screenshot({ path: path.join(screenshotsDir, '04-flagged-duplicates.png') });
    });

    test('2.4 Review History Tab', async ({ page }) => {
      await clickSidebar(page, 'Review History');
      await page.waitForURL(/\/ai\/duplicate-alerts\?tab=history/);

      await expect(page.getByText(/AI Scan Review History/i)).toBeVisible();
      await expect(page.locator('.card').first()).toBeVisible();

      await page.screenshot({ path: path.join(screenshotsDir, '05-duplicate-history.png') });
    });

  });

  // ===========================================================================
  // STEP 3: COLLECTION INTELLIGENCE & PRIORITY QUEUE
  // ===========================================================================
  test.describe('STEP 3: Collection Intelligence & Priority Queue', () => {

    test('3.1 Collection Priorities & Risk Level Inspection (Accountant)', async ({ page }) => {
      await loginFOMS(page, ACCOUNTANT_USERNAME, ACCOUNTANT_PASSWORD);
      await clickSidebar(page, 'Collection Priorities');

      await page.waitForURL(/\/ai\/collection-priorities/);
      await expect(page.locator('h1.header-title, h1').first()).toContainText(/Collection Priorities/i);

      // Verify risk filter controls or tabs if present
      const riskFilters = page.locator('button, select').filter({ hasText: /Risk|All|High|Medium|Low/i });
      if (await riskFilters.count() > 0) {
        await riskFilters.first().click();
      }

      await page.screenshot({ path: path.join(screenshotsDir, '06-collection-priorities.png') });
    });

    test('3.2 For Review Receivables & Decision Log Modal (Financial Manager)', async ({ page }) => {
      await loginFOMS(page, AI_USERNAME, AI_PASSWORD);
      await clickSidebar(page, 'For Review');

      await page.waitForURL(/\/ai\/for-review/);
      await expect(page.locator('h1.header-title, h1').first()).toContainText(/For Review/i);

      // Verify receivables table rows exist
      const tableRows = page.locator('table tbody tr');
      if (await tableRows.count() > 0) {
        await tableRows.first().click();

        // Assert Finance Review modal controls
        await expect(page.getByText(/Finance Review/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /Cancel/i })).toBeVisible();

        // Close modal
        await page.getByRole('button', { name: /Cancel/i }).click();
      }

      await page.screenshot({ path: path.join(screenshotsDir, '07-for-review.png') });
    });

  });

  // ===========================================================================
  // STEP 4: ANALYTICS, AUDIT TRAIL & PROFILE
  // ===========================================================================
  test.describe('STEP 4: Analytics & Audit Trail', () => {

    test.beforeEach(async ({ page }) => {
      await loginFOMS(page);
    });

    test('4.1 Reports Generation & Export Controls', async ({ page }) => {
      await clickSidebar(page, 'Reports');
      await page.waitForURL(/\/ai\/reports/);
      await expect(page.locator('h1.header-title, h1').first()).toContainText(/Reports/i);

      // Ledger Select
      const reportSelect = page.locator('select.input-select').first();
      await expect(reportSelect).toBeVisible();
      await reportSelect.selectOption('duplicate-summary');

      // Export CSV
      const exportCSVBtn = page.getByRole('button', { name: /Export CSV/i });
      await expect(exportCSVBtn).toBeVisible();
      await exportCSVBtn.click();

      // Export Formal PDF
      const exportPDFBtn = page.getByRole('button', { name: /Export Formal PDF/i });
      await expect(exportPDFBtn).toBeVisible();
      await exportPDFBtn.click();

      // Refresh Report
      const refreshReportBtn = page.getByRole('button', { name: /Refresh Report/i });
      await expect(refreshReportBtn).toBeVisible();
      await refreshReportBtn.click();

      await page.screenshot({ path: path.join(screenshotsDir, '08-reports.png') });
    });

    test('4.2 Audit Trail Logs & Detail Modal', async ({ page }) => {
      await clickSidebar(page, 'Audit Trail');
      await page.waitForURL(/\/ai\/audit-trail/);
      await expect(page.locator('h1.header-title, h1').first()).toContainText(/Audit Trail/i);

      // Click View Details action if present
      const viewDetailsBtn = page.getByText(/View Details/i).or(page.locator('button.table-action-btn')).first();
      if (await viewDetailsBtn.isVisible()) {
        await viewDetailsBtn.click();
        await expect(page.getByText(/Audit Event Detail/i)).toBeVisible();
        await page.getByRole('button', { name: /Close/i }).click();
      }

      await page.screenshot({ path: path.join(screenshotsDir, '09-audit-trail.png') });
    });

    test('4.3 User Profile Details (EMP-001)', async ({ page }) => {
      await clickSidebar(page, 'Profile');
      await page.waitForURL(/\/ai\/profile/);
      await expect(page.getByText(/Financial Manager/i).or(page.getByText(/Profile/i)).first()).toBeVisible();

      await page.screenshot({ path: path.join(screenshotsDir, '10-profile.png') });
    });

  });

  // ===========================================================================
  // STEP 5: SPEEDPAY CUSTOMER PORTAL END-TO-END FLOW
  // ===========================================================================
  test.describe('STEP 5: SpeedPay Customer Portal End-to-End Flow', () => {

    test('5.1 SpeedPay Dashboard Summary & Balances', async ({ page }) => {
      await loginSpeedPay(page);

      // Assert Dashboard navigation and user greeting / balances
      await expect(page.getByRole('link', { name: /Dashboard/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /My Invoices/i })).toBeVisible();
      await expect(page.getByRole('img', { name: 'Speedex' }).first()).toBeVisible();

      await page.screenshot({ path: path.join(screenshotsDir, '11-speedpay-dashboard.png') });
    });

    test('5.2 My Invoices Filters & Pay Now Navigation', async ({ page }) => {
      await loginSpeedPay(page);

      // Click My Invoices from Sidebar
      const myInvoicesLink = page.getByRole('link', { name: /My Invoices/i }).first();
      await myInvoicesLink.click();
      await page.waitForURL(/\/invoices/);

      await expect(page.getByRole('heading', { name: /My Invoices/i })).toBeVisible();

      // Test Status Filter dropdown
      const statusSelect = page.locator('select').first();
      if (await statusSelect.isVisible()) {
        await statusSelect.selectOption('All');
        await statusSelect.selectOption('Unpaid');
        await statusSelect.selectOption('Paid');
        await statusSelect.selectOption('All');
      }

      // Check if Pay Now button exists and click it
      const payNowBtn = page.getByRole('button', { name: /Pay now/i }).first();
      if (await payNowBtn.isVisible()) {
        await payNowBtn.click();
        await page.waitForURL(/\/pay/);
      }

      await page.screenshot({ path: path.join(screenshotsDir, '12-speedpay-invoices.png') });
    });

    test('5.3 Pay Invoice Method Toggles & Summary Breakdown', async ({ page }) => {
      await loginSpeedPay(page);

      // Click Pay an Invoice from Sidebar
      const payInvoiceLink = page.getByRole('link', { name: /Pay an Invoice|Pay Invoice/i }).first();
      await payInvoiceLink.click();
      await page.waitForURL(/\/pay/);

      // Select an invoice from dropdown if available
      const invoiceSelect = page.locator('select').first();
      if (await invoiceSelect.isVisible()) {
        const optionCount = await invoiceSelect.locator('option').count();
        if (optionCount > 1) {
          await invoiceSelect.selectOption({ index: 1 });
        }
      }

      // Assert Breakdown or Payment Card
      await expect(page.getByText(/Breakdown|Payment details|Select invoice/i).first()).toBeVisible();

      await page.screenshot({ path: path.join(screenshotsDir, '13-speedpay-pay.png') });
    });

    test('5.4 Payment History & Transaction Records', async ({ page }) => {
      await loginSpeedPay(page);

      // Click Payment History from Sidebar
      const historyLink = page.getByRole('link', { name: /Payment History/i }).first();
      await historyLink.click();
      await page.waitForURL(/\/history/);

      await expect(page.getByRole('heading', { name: /Payment History/i })).toBeVisible();

      await page.screenshot({ path: path.join(screenshotsDir, '14-speedpay-history.png') });
    });

    test('5.5 SpeedPay Notifications Page', async ({ page }) => {
      await loginSpeedPay(page);

      // Navigate to Notifications
      await page.goto(`${SPEEDPAY_BASE_URL}/notifications`);
      await expect(page.getByText(/Notifications/i).first()).toBeVisible();

      await page.screenshot({ path: path.join(screenshotsDir, '15-speedpay-notifications.png') });
    });

  });

});
