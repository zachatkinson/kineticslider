import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    // baseURL: 'http://localhost:3000', // Commented out since theme tests use page.setContent()
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        hasTouch: true, // Enable touch support for mobile device tests
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        hasTouch: true, // Enable touch support for mobile device tests
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        hasTouch: true, // Enable touch support for mobile device tests
      },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  // Commented out webServer since theme tests use page.setContent() and don't need a dev server
  // webServer: {
  //   command: 'pnpm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
}); 