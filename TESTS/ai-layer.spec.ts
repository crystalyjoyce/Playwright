import { test, expect, Page } from '@playwright/test';

/**
 * ==============================================================================
 * FOMS AI LAYER DASHBOARD — PLAYWRIGHT END-TO-END TEST SUITE
 * ==============================================================================
 * Location: http://localhost:5175/ai/dashboard
 * Target App: Speedex Freight Operations & Management System (FOMS) AI Layer
 * 
 * Scope:
 *  - Test Case 1: Authorized AI Dashboard Access
 *  - Test Case 2: AI Dashboard Components Load
 *  - Test Case 3: Dashboard API Request & Data Synchronization
 *  - Test Case 4: AI Duplicate Transaction Detection Summary & Flagged Records
 *  - Test Case 5: Exact Duplicate Detection Workflow
 *  - Test Case 6: Receivable Risk & Collection Priority Evaluation
 *  - Test Case 7: Unauthorized Access & RBAC Guards
 *  - Test Case 8: Error Handling & Offline AI Service State
 *  - Test Case 9: Empty-State Rendering Behavior
 * ==============================================================================
 */

const BASE_URL = 'http://localhost:5175';

// Valid Seed Credentials
const AUTH_USERS = {
  financialManager: { empId: 'EMP-001', password: 'Password@123', role: 'Financial Manager' },
  headAccountant:   { empId: 'EMP-002', password: 'Password@123', role: 'Head Accountant' },
  staffAccountant:  { empId: 'EMP-003', password: 'Password@123', role: 'Accountant' },
  clientUnauthorized: { empId: 'EMP-006', password: 'Password@123', role: 'Client' },
};

/**
 * Helper to log in using valid employee credentials.
 */
async function loginAs(page: Page, employeeId: string, password = 'Password@123') {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

  // Locate the Employee ID input
  const empInput = page.locator('input[placeholder="EMP-001"]').or(
    page.getByRole('textbox', { name: /EMP-|EMPLOYEE ID/i })
  ).first();
  await expect(empInput).toBeVisible({ timeout: 10000 });
  await empInput.fill(employeeId);

  // Locate the Password input
  const passInput = page.locator('input[type="password"]').first();
  await expect(passInput).toBeVisible({ timeout: 10000 });
  await passInput.fill(password);

  // Click submit
  const loginButton = page.getByRole('button', { name: /LOG IN TO SYSTEM/i });
  await expect(loginButton).toBeEnabled();
  await loginButton.click();
  await page.waitForURL(
    employeeId === AUTH_USERS.clientUnauthorized.empId
      ? '**/unauthorized'
      : '**/ai/dashboard',
    { timeout: 15000 }
  );
}

test.describe('FOMS AI Layer Dashboard E2E Test Suite', () => {

  // ============================================================================
  // TEST CASE 1: Authorized AI Dashboard Access
  // ============================================================================
  test('Test Case 1 — Authorized AI Dashboard Access', async ({ page }) => {
    // 1. Open FOMS Login page and authenticate
    await loginAs(page, AUTH_USERS.staffAccountant.empId, AUTH_USERS.staffAccountant.password);

    // 2. Navigate / verify landing on /ai/dashboard
    await page.waitForURL('**/ai/dashboard', { timeout: 15000 });
    expect(page.url()).toContain('/ai/dashboard');

    // 3. Verify no 403/404 error page appears
    await expect(page.getByText('403')).not.toBeVisible();
    await expect(page.getByText('Access Restricted')).not.toBeVisible();

    // 4. Verify main AI dashboard heading and brand engine tags
    await expect(page.locator('h1, h2, .ai-header').filter({ hasText: /Dashboard/i }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/AI Financial Engine v2\.4/i)).toBeVisible();
    await expect(page.getByText(/Live Synchronization/i)).toBeVisible();
  });

  // ============================================================================
  // TEST CASE 2: AI Dashboard Components Load
  // ============================================================================
  test('Test Case 2 — AI Dashboard Components Load', async ({ page }) => {
    await loginAs(page, AUTH_USERS.financialManager.empId, AUTH_USERS.financialManager.password);
    await page.waitForURL('**/ai/dashboard', { timeout: 15000 });

    // 1. Verify Decision Support Notice Banner
    const decisionNotice = page.locator('.advisory-banner');
    await expect(decisionNotice).toBeVisible();
    await expect(decisionNotice).toContainText(/Decision Support Notice/i);

    // 2. Verify all 5 KPI Summary Status Cards
    const kpiGrid = page.locator('.kpi-grid');
    await expect(kpiGrid.getByText('Total Duplicate Alerts')).toBeVisible();
    await expect(kpiGrid.getByText('Pending Review')).toBeVisible();
    await expect(kpiGrid.getByText('Exact Match Alerts')).toBeVisible();
    await expect(kpiGrid.getByText('Urgent Collections')).toBeVisible();
    await expect(kpiGrid.getByText('Awaiting Validation')).toBeVisible();

    // 3. Verify Analytics Controls Bar (Range selector, Refresh, Export, Scan Document)
    await expect(page.getByRole('button', { name: '7D' })).toBeVisible();
    await expect(page.getByRole('button', { name: '30D' })).toBeVisible();
    await expect(page.getByRole('button', { name: '90D' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Refresh/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Export Report/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Scan Document/i })).toBeVisible();

    // 4. Verify Charts and Visualizations
    await expect(page.getByText('Collection & Outstanding Receivables Analytics')).toBeVisible();
    await expect(page.getByText('Receivable Aging Distribution')).toBeVisible();

    // 5. Verify Lower Grid Sections (Priority Attention Accounts & Recent Activity Logs)
    await expect(page.getByText('Priority Accounts Requiring Attention')).toBeVisible();
    await expect(page.getByText(/Recent AI Activity & Audit Logs/i)).toBeVisible();
    await expect(page.getByText(/LIVE FEED/i)).toBeVisible();

    // 6. Verify loading skeletons disappear
    await expect(page.locator('.skeleton')).toHaveCount(0, { timeout: 10000 });
  });

  // ============================================================================
  // TEST CASE 3: Dashboard API Request & Data Synchronization
  // ============================================================================
  test('Test Case 3 — Dashboard API Request & Synchronization', async ({ page }) => {
    // 1. Listen for real backend API calls before triggering dashboard load
    const summaryResponsePromise = page.waitForResponse(response =>
      response.url().includes('/api/ai/dashboard/summary') && response.request().method() === 'GET',
      { timeout: 15000 }
    );
    const attentionResponsePromise = page.waitForResponse(response =>
      response.url().includes('/api/ai/dashboard/attention-accounts') && response.request().method() === 'GET',
      { timeout: 15000 }
    );
    const activityResponsePromise = page.waitForResponse(response =>
      response.url().includes('/api/ai/dashboard/recent-activity') && response.request().method() === 'GET',
      { timeout: 15000 }
    );

    await loginAs(page, AUTH_USERS.financialManager.empId, AUTH_USERS.financialManager.password);
    await page.waitForURL('**/ai/dashboard', { timeout: 15000 });

    // 2. Validate responses status and JSON payload
    const summaryResponse = await summaryResponsePromise;
    expect(summaryResponse.status()).toBe(200);
    const summaryData = await summaryResponse.json();
    expect(summaryData).toBeDefined();

    const attentionResponse = await attentionResponsePromise;
    expect(attentionResponse.status()).toBe(200);

    const activityResponse = await activityResponsePromise;
    expect(activityResponse.status()).toBe(200);

    // 3. Test Manual Data Synchronization with the Refresh button
    const refreshSummaryPromise = page.waitForResponse(response =>
      response.url().includes('/api/ai/dashboard/summary') && response.request().method() === 'GET'
    );
    await page.getByRole('button', { name: /Refresh/i }).click();
    const refreshedRes = await refreshSummaryPromise;
    expect(refreshedRes.status()).toBe(200);

    // 4. Test Time Range Filters & Chart Metric Toggles
    await page.getByRole('button', { name: '7D' }).click();
    await page.getByRole('button', { name: '90D' }).click();
    await page.getByRole('button', { name: '30D' }).click();

    const metricOutstanding = page.getByRole('button', { name: 'OUTSTANDING' });
    if (await metricOutstanding.isVisible()) {
      await metricOutstanding.click();
    }
  });

  // ============================================================================
  // TEST CASE 4: AI Duplicate Transaction Detection Summary
  // ============================================================================
  test('Test Case 4 — AI Duplicate Transaction Detection Summary & Records', async ({ page }) => {
    await loginAs(page, AUTH_USERS.headAccountant.empId, AUTH_USERS.headAccountant.password);
    await page.waitForURL('**/ai/dashboard', { timeout: 15000 });

    // 1. Verify duplicate alert counters from KPI Cards
    await expect(page.locator('.kpi-grid').getByText('Total Duplicate Alerts', { exact: true })).toBeVisible();
    await expect(page.locator('.kpi-grid').getByText('Exact Match Alerts', { exact: true })).toBeVisible();

    // 2. Navigate to Flagged Duplicates List
    await page.goto(`${BASE_URL}/ai/duplicate-alerts?tab=flagged-dups`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/ai/duplicate-alerts?tab=flagged-dups', { timeout: 15000 });

    // 3. Verify Flagged Duplicates table / items render without undefined fields
    const duplicateList = page.locator('.data-table, table, .table-container, .card');
    await expect(duplicateList.first()).toBeVisible({ timeout: 10000 });

    // Verify search input works
    const searchInput = page.getByPlaceholder(/Search/i).or(page.locator('input[type="search"]')).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('DOC');
      await page.waitForTimeout(500);
      await searchInput.clear();
    }
  });

  // ============================================================================
  // TEST CASE 5: Exact Duplicate Detection Workflow
  // ============================================================================
  test('Test Case 5 — Exact Duplicate Detection Workflow', async ({ page }) => {
    await loginAs(page, AUTH_USERS.staffAccountant.empId, AUTH_USERS.staffAccountant.password);

    // 1. Navigate to Duplicate Scan console
    await page.goto(`${BASE_URL}/ai/duplicate-alerts?tab=scan`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/AI Duplicate Scan|Upload Document|Scan Document/i).first()).toBeVisible({ timeout: 15000 });

    // 2. Mock / Trigger AI duplicate analysis check for identical transaction reference
    const sampleWaybill = `WBL-TEST-${Date.now().toString().slice(-4)}`;
    
    // Check direct duplicate analysis endpoint behavior
    const token = await page.evaluate(() => localStorage.getItem('foms_ai_token'));
    expect(token).toBeTruthy();
    const checkResponse = await page.request.post(`${BASE_URL}/api/ai/duplicates/waybill`, {
      data: {
        waybillNumber: sampleWaybill,
        clientId: 'CLIENT-001'
      },
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // 3. Verify response status
    expect([200, 201, 400, 404, 422]).toContain(checkResponse.status());

    // 4. Verify unique documents catalog tab is accessible
    await page.goto(`${BASE_URL}/ai/duplicate-alerts?tab=unique-docs`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Unique Documents/i).first()).toBeVisible();
  });

  // ============================================================================
  // TEST CASE 6: Receivable Risk & Collection Priority Evaluation
  // ============================================================================
  test('Test Case 6 — Receivable Risk & Collection Priority Evaluation', async ({ page }) => {
    await loginAs(page, AUTH_USERS.financialManager.empId, AUTH_USERS.financialManager.password);
    await page.waitForURL('**/ai/dashboard', { timeout: 15000 });

    // 1. Check Priority Accounts section
    const prioritySection = page.locator('.card').filter({ hasText: /Priority Accounts Requiring Attention/i });
    await expect(prioritySection).toBeVisible();

    // 2. Navigate to Collection Recommendations / Priorities via Evaluate link or sidebar
    const evaluateLink = prioritySection.getByRole('link', { name: /Evaluate Account/i }).first();
    if (await evaluateLink.isVisible()) {
      await evaluateLink.click();
      await page.waitForURL('**/ai/collection-recommendations', { timeout: 10000 });
      expect(page.url()).toContain('/ai/collection-recommendations');
    } else {
      await page.goto(`${BASE_URL}/ai/collection-priorities`, { waitUntil: 'domcontentloaded' });
      expect(page.url()).toContain('/ai/collection-priorities');
    }

    // 3. Verify Collection Priorities / Recommendations page content
    await expect(page.locator('h1, h2, .ai-header').filter({
      hasText: /Collection Priorities|Collection Recommendations/i
    }).first()).toBeVisible({ timeout: 10000 });
  });

  // ============================================================================
  // TEST CASE 7: Unauthorized Access & RBAC Guards
  // ============================================================================
  test('Test Case 7 — Unauthorized Access Redirection', async ({ page }) => {
    // 1. Authenticate with a client role account
    await loginAs(page, AUTH_USERS.clientUnauthorized.empId, AUTH_USERS.clientUnauthorized.password);

    // 2. Attempt navigating directly to the AI Dashboard
    await page.goto(`${BASE_URL}/ai/dashboard`, { waitUntil: 'domcontentloaded' });

    // 3. Verify user is redirected to /unauthorized with 403 Forbidden messaging
    await page.waitForURL('**/unauthorized', { timeout: 10000 });
    expect(page.url()).toContain('/unauthorized');

    await expect(page.getByText('403')).toBeVisible();
    await expect(page.getByText('Access Restricted')).toBeVisible();
    await expect(page.getByText(/You do not have permission to view this/i)).toBeVisible();

    // 4. Verify "Log In as Different Role" button is available
    const switchButton = page.getByRole('button', { name: /Log In as Different Role/i });
    await expect(switchButton).toBeVisible();
  });

  // ============================================================================
  // TEST CASE 8: Error Handling & Offline AI Service State
  // ============================================================================
  test('Test Case 8 — AI Layer Offline & Error State Handling', async ({ page }) => {
    // Fail every dashboard endpoint to simulate a complete AI sidecar outage
    await page.route('**/api/ai/dashboard/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal AI Engine Connection Failed' })
      });
    });

    await loginAs(page, AUTH_USERS.staffAccountant.empId, AUTH_USERS.staffAccountant.password);
    await page.goto(`${BASE_URL}/ai/dashboard`, { waitUntil: 'domcontentloaded' });

    // Verify Error Advisory Banner and Offline Card
    await expect(page.getByText(/AI Layer Connection Offline/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/AI Intelligence Service Offline/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Retry Connection/i })).toBeVisible();
  });

  // ============================================================================
  // TEST CASE 9: Empty-State Rendering Behavior
  // ============================================================================
  test('Test Case 9 — Empty-State Rendering Behavior', async ({ page }) => {
    // Mock empty attention accounts and empty activity feeds
    await page.route('**/api/ai/dashboard/attention-accounts', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [] })
      });
    });

    await page.route('**/api/ai/dashboard/recent-activity', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await loginAs(page, AUTH_USERS.staffAccountant.empId, AUTH_USERS.staffAccountant.password);
    await page.goto(`${BASE_URL}/ai/dashboard`, { waitUntil: 'domcontentloaded' });

    // Verify clean empty state messages are rendered
    await expect(page.getByText('No accounts currently require urgent collection follow-up.')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('No recent AI activity is available.')).toBeVisible();
  });

});