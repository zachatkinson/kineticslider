import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

/**
 * Sharded configuration for running large test suites efficiently
 * Usage: npx playwright test --config=playwright.shard.config.ts --shard=1/4
 */
export default defineConfig({
  ...baseConfig,

  // More aggressive worker optimization for sharded runs
  workers: process.env.CI ? 8 : '100%',

  // Longer global timeout for sharded runs
  globalTimeout: 20 * 60 * 1000, // 20 minutes

  // Reduce retries for faster feedback in sharded runs
  retries: process.env.CI ? 1 : 0,

  // Optimize for speed - minimal artifacts
  use: {
    ...baseConfig.use,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },

  // Single fast browser for sharded runs
  projects: [
    {
      name: 'chromium-fast',
      use: {
        ...baseConfig.projects?.[0]?.use,
        // Optimize for speed
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--disable-renderer-backgrounding',
            '--disable-backgrounder-occluded-windows-animations',
            '--disable-component-extensions-with-background-pages',
          ],
        },
      },
    },
  ],
});
