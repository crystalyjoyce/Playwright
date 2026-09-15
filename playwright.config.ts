import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

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
    // Slow down actions for demo
    launchOptions: {
      slowMo: 30000,
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