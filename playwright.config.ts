import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './src/__tests__/e2e',



  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 3 : 1,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 2 : undefined,

  /* Global timeout for each test */
  timeout: 30 * 1000,

  /* Expect timeout */
  expect: {
    timeout: 10 * 1000,
  },

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI 
    ? [
        ['html'],
        ['junit', { outputFile: 'test-results/e2e-results.xml' }],
        ['json', { outputFile: 'test-results/e2e-results.json' }],
        ['github']
      ]
    : [
        ['html'],
        ['junit', { outputFile: 'test-results/e2e-results.xml' }],
        ['json', { outputFile: 'test-results/e2e-results.json' }]
      ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.CI ? 'http://localhost:4173' : 'https://localhost:3003',
    
    /* Ignore HTTPS errors for local development */
    ignoreHTTPSErrors: true,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshots */
    screenshot: 'only-on-failure',

    /* Videos */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], hasTouch: true },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], hasTouch: true },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], hasTouch: true },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against installed browsers only */
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome', hasTouch: true },
    },
  ],

  /* Global setup and teardown */
  globalSetup: './src/__tests__/e2e/global-setup.ts',
  globalTeardown: './src/__tests__/e2e/global-teardown.ts',

  /* Run your local dev server before starting the tests */
  // Note: Start dev server manually with `pnpm run dev` before running E2E tests
  // webServer: process.env.CI
  //   ? undefined
  //   : {
  //       command: 'pnpm run dev',
  //       port: 3003, // Actual port where dev server runs
  //       reuseExistingServer: !process.env.CI,
  //       timeout: 120 * 1000, // Allow time for dev server startup
  //     },
});
