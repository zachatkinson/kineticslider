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

  /* Global timeout for each test (increased for CI environment) */
  timeout: process.env.CI ? 45 * 1000 : 30 * 1000,

  /* Expect timeout (increased for CI environment) */
  expect: {
    timeout: process.env.CI ? 20 * 1000 : 15 * 1000,
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

    /* Performance optimizations - removed browser-specific args */
    // Browser-specific launch options will be defined per project
    timeout: process.env.CI ? 90000 : 60000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'], 
        hasTouch: true,
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            // CI-specific args for Chromium
            ...(process.env.CI ? [
              '--disable-backgrounding-occluded-windows',
              '--disable-renderer-backgrounding',
              '--disable-field-trial-config',
              '--disable-background-timer-throttling',
            ] : []),
          ],
        },
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'], 
        hasTouch: true,
        launchOptions: {
          args: [
            // Firefox-specific args (no --no-sandbox)
            '--disable-web-security',
          ],
        },
      },
    },

    // WebKit temporarily disabled due to libicudata.so.74 compatibility issues on ubuntu-22.04
    // See: https://github.com/microsoft/playwright/issues/30368 
    // TODO: Re-enable when Playwright WebKit supports Ubuntu 22.04 ICU libraries or move to ubuntu-24.04
    // {
    //   name: 'webkit',
    //   use: { 
    //     ...devices['Desktop Safari'], 
    //     hasTouch: true,
    //     launchOptions: {
    //       // webkit doesn't support browser arguments - keep empty
    //     },
    //   },
    // },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            ...(process.env.CI ? [
              '--disable-backgrounding-occluded-windows',
              '--disable-renderer-backgrounding',
              '--disable-field-trial-config',
              '--disable-background-timer-throttling',
            ] : []),
          ],
        },
      },
    },
    // Mobile Safari temporarily disabled (also uses WebKit engine)
    // {
    //   name: 'Mobile Safari',
    //   use: { 
    //     ...devices['iPhone 12'],
    //     launchOptions: {
    //       // webkit mobile doesn't support browser arguments - keep empty
    //     },
    //   },
    // },

    /* Test against installed browsers only */
    {
      name: 'Google Chrome',
      use: { 
        ...devices['Desktop Chrome'], 
        channel: 'chrome', 
        hasTouch: true,
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            ...(process.env.CI ? [
              '--disable-backgrounding-occluded-windows',
              '--disable-renderer-backgrounding',
              '--disable-field-trial-config',
              '--disable-background-timer-throttling',
            ] : []),
          ],
        },
      },
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
