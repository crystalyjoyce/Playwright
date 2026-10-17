import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const REPO_ROOT = 'C:/Users/Crystalyn Joyce/Downloads/tesda/FOMS-System-Repository';

/**
 * Playwright Config for ITE Capstone E2E Regression Suite
 */
export default defineConfig({
  testDir: path.join(__dirname, 'tests'),
  testIgnore: '**/tests/example.spec.ts',
  globalSetup: path.join(__dirname, 'tests/config/globalSetup.ts'),
  timeout: 60000,
  expect: {
    timeout: 10000
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    actionTimeout: 10000,
    navigationTimeout: 30000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  /* Configure projects */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Auto-start local dev servers with explicit host binding and strict port */
  webServer: [
    {
      command: 'npx vite --host 0.0.0.0 --port 5176 --strictPort',
      cwd: path.resolve(REPO_ROOT, 'foms-frontend'),
      url: 'http://localhost:5176',
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command: 'npx vite --host 0.0.0.0 --port 5174',
      cwd: path.resolve(REPO_ROOT, 'speedpay-portal'),
      url: 'http://localhost:5174',
      reuseExistingServer: true,
      timeout: 120000,
    },
    {
      command: 'npx vite --host 0.0.0.0 --port 5175',
      cwd: path.resolve(REPO_ROOT, 'ai-frontend'),
      url: 'http://localhost:5175',
      reuseExistingServer: true,
      timeout: 120000,
    },
  ],
});
