import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',

  // Run tests in parallel
  fullyParallel: false,

  // Local testing
  forbidOnly: false,

  // No retry for now
  retries: 0,

  // One test at a time
  workers: 1,

  // HTML report
  reporter: 'html',

  use: {
    // Base URL for web navigation
    baseURL: 'http://localhost:5175',

    // Optional slowMo for demo runs, default 0 for faster test executions
    launchOptions: {
      slowMo: process.env.SLOWMO ? parseInt(process.env.SLOWMO, 10) : 0,
    },

    // Save trace when needed
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },
  ],
});