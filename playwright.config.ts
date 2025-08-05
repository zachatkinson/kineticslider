import { defineConfig, devices } from '@playwright/test';
import { cpus } from 'os';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './src/__tests__/e2e',

  /* Global timeout for the entire test suite (40 minutes for full cross-browser suite) */
  globalTimeout: 40 * 60 * 1000,

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,

  /* Optimize workers for performance vs resource balance */
  workers: process.env.CI ? 6 : Math.min(10, cpus().length),

  /* Global timeout for each test (reduced for faster failures) */
  timeout: 25 * 1000,

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
        ['github'],
      ]
    : [
        ['html'],
        ['junit', { outputFile: 'test-results/e2e-results.xml' }],
        ['json', { outputFile: 'test-results/e2e-results.json' }],
      ],

  /* Report slow tests for optimization */
  reportSlowTests: { max: 10, threshold: 30000 },

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Ignore HTTPS errors for local development */
    ignoreHTTPSErrors: true,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshots - reduced for performance */
    screenshot: process.env.CI ? 'only-on-failure' : 'off',

    /* Videos - only for critical failures */
    video: process.env.CI ? 'retain-on-failure' : 'off',

    /* Performance optimizations */
    launchOptions: {
      // Faster browser startup
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
      ],
    },
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
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // Allow time for dev server startup
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
