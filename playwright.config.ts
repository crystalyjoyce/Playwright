import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const REPO_ROOT = 'C:/Users/Crystalyn Joyce/Downloads/tesda/FOMS-System-Repository';

export default defineConfig({
  testDir: __dirname,
  testMatch: [
    'tests/**/*.spec.ts',
    'TESTS/**/*.spec.ts',
    'ai layer/**/*.spec.ts',
    'collection/**/*.spec.ts',
    'speedpay/**/*.spec.ts',
  ],
  testIgnore: '**/example.spec.ts',
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
    baseURL: 'http://localhost:5175',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
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
