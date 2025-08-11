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

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. 
   * Auto-play policies have been configured per-browser to allow media auto-play without user interaction.
   * This is essential for testing auto-play functionality in CI environments where user gestures are not available.
   * Security: Uses minimal, targeted flags instead of --disable-web-security for better security posture.
   */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Ignore HTTPS errors for local development only */
    ignoreHTTPSErrors: true,

    /* Bypass CSP for testing dynamic content without disabling all security */
    bypassCSP: true,

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

  /* Configure descriptive E2E shard projects by feature area */
  projects: [
    // =====================================================
    // CORE FUNCTIONALITY TESTS
    // =====================================================
    {
      name: '🎯 Core & Foundation',
      testMatch: [
        '**/basic.test.ts',
        '**/slider-foundation.test.ts',
        '**/slider-core.e2e.test.ts',
        '**/complete-system.test.ts',
      ],
      use: { 
        ...devices['Desktop Chrome'], 
        hasTouch: true,
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage', 
            '--disable-features=TranslateUI',
            '--autoplay-policy=no-user-gesture-required',
            ...(process.env.CI ? [
              '--disable-backgrounding-occluded-windows',
              '--disable-renderer-backgrounding',
            ] : []),
          ],
        },
      },
    },

    // =====================================================
    // NAVIGATION & INTERACTION TESTS
    // =====================================================
    {
      name: '🧭 Navigation & Input',
      testMatch: [
        '**/navigation-manager.e2e.test.ts',
        '**/keyboard-navigation.e2e.test.ts',
        '**/navigation-swipe-gestures.e2e.test.ts',
      ],
      use: { 
        ...devices['Desktop Chrome'], 
        hasTouch: true,
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage', 
            '--disable-features=TranslateUI',
            '--autoplay-policy=no-user-gesture-required',
            ...(process.env.CI ? [
              '--disable-backgrounding-occluded-windows',
              '--disable-renderer-backgrounding',
            ] : []),
          ],
        },
      },
    },

    // =====================================================
    // AUTO-PLAY & STATE MANAGEMENT TESTS
    // =====================================================
    {
      name: '⏯️ Auto-play & State',
      testMatch: [
        '**/auto-play.e2e.test.ts',
        '**/state-manager.e2e.test.ts',
        '**/loop-manager.e2e.test.ts',
      ],
      use: { 
        ...devices['Desktop Chrome'], 
        hasTouch: true,
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage', 
            '--disable-features=TranslateUI',
            '--autoplay-policy=no-user-gesture-required',
            ...(process.env.CI ? [
              '--disable-backgrounding-occluded-windows',
              '--disable-renderer-backgrounding',
            ] : []),
          ],
        },
      },
    },

    // =====================================================
    // ACCESSIBILITY TESTS
    // =====================================================
    {
      name: '♿ Accessibility & ARIA',
      testMatch: [
        '**/accessibility.test.ts',
        '**/accessibility-comprehensive.e2e.test.ts',
        '**/accessibility-coordination.e2e.ts',
      ],
      use: { 
        ...devices['Desktop Chrome'], 
        hasTouch: true,
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage', 
            '--disable-features=TranslateUI',
            '--autoplay-policy=no-user-gesture-required',
            ...(process.env.CI ? [
              '--disable-backgrounding-occluded-windows',
              '--disable-renderer-backgrounding',
            ] : []),
          ],
        },
      },
    },

    // =====================================================
    // RENDERING & PERFORMANCE TESTS  
    // =====================================================
    {
      name: '🎨 Rendering & Performance',
      testMatch: [
        '**/rendering-performance.e2e.ts',
        '**/performance-monitor.e2e.test.ts',
        '**/shader-manager.e2e.test.ts',
        '**/physics-e2e.test.ts',
      ],
      use: { 
        ...devices['Desktop Chrome'], 
        hasTouch: true,
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage', 
            '--disable-features=TranslateUI',
            '--autoplay-policy=no-user-gesture-required',
            ...(process.env.CI ? [
              '--disable-backgrounding-occluded-windows',
              '--disable-renderer-backgrounding',
            ] : []),
          ],
        },
      },
    },

    // =====================================================
    // CONFIGURATION & ERROR HANDLING TESTS
    // =====================================================
    {
      name: '⚙️ Configuration & Errors',
      testMatch: [
        '**/configuration-system.e2e.test.ts',
        '**/error-handling.test.ts',
        '**/resource-loader.e2e.test.ts',
        '**/filter-system-essential.e2e.test.ts',
        '**/debug-console.test.ts',
      ],
      use: { 
        ...devices['Desktop Chrome'], 
        hasTouch: true,
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage', 
            '--disable-features=TranslateUI',
            '--autoplay-policy=no-user-gesture-required',
            ...(process.env.CI ? [
              '--disable-backgrounding-occluded-windows',
              '--disable-renderer-backgrounding',
            ] : []),
          ],
        },
      },
    },

    // =====================================================
    // CROSS-BROWSER VALIDATION (FIREFOX)
    // =====================================================
    {
      name: '🦊 Firefox Cross-Browser',
      testMatch: [
        '**/basic.test.ts',
        '**/auto-play.e2e.test.ts',
        '**/navigation-manager.e2e.test.ts',
        '**/accessibility.test.ts',
      ],
      use: { 
        ...devices['Desktop Firefox'], 
        hasTouch: true,
        launchOptions: {
          args: [],
          firefoxUserPrefs: {
            'media.autoplay.default': 0,
            'media.autoplay.blocking_policy': 0,
            'media.autoplay.allow-extension-background-pages': true,
            'media.autoplay.enabled.user-gestures-needed': false,
          },
        },
      },
    },

    // =====================================================
    // MOBILE TESTING
    // =====================================================
    {
      name: '📱 Mobile Chrome',
      testMatch: [
        '**/basic.test.ts',
        '**/navigation-swipe-gestures.e2e.test.ts', 
        '**/auto-play.e2e.test.ts',
        '**/state-manager.e2e.test.ts',
      ],
      use: { 
        ...devices['Pixel 5'],
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage', 
            '--disable-features=TranslateUI',
            '--autoplay-policy=no-user-gesture-required',
            ...(process.env.CI ? [
              '--disable-backgrounding-occluded-windows',
              '--disable-renderer-backgrounding',
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
