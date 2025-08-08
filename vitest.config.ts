import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],

  test: {
    // Test environment
    environment: 'jsdom',

    // Setup files
    setupFiles: ['./src/__tests__/setup.ts'],

    // Global test utilities
    globals: true,

    // Coverage configuration - Enterprise Grade
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'text-summary', 'json-summary'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        'scripts/',
        '.storybook/',
        'storybook-static/',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 60,
          lines: 30,
          statements: 30,
        },
      },
      // Fail if coverage is below thresholds
      skipFull: false,
      all: true,
      // Report uncovered lines
      reportOnFailure: true,
    },

    // Test file patterns - EXCLUDE E2E tests
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],

    // Exclude patterns
    exclude: [
      'node_modules/',
      'dist/',
      '.next/',
      'coverage/',
      'src/__tests__/e2e/**', // Exclude ALL E2E tests from Vitest
      '**/*.e2e.{test,spec}.{js,ts,jsx,tsx}', // Exclude E2E tests
    ],

    // Performance & Reliability - CI-friendly timeouts
    testTimeout: process.env.CI ? 30000 : 15000, // Longer timeout for CI
    hookTimeout: process.env.CI ? 20000 : 10000,
    teardownTimeout: process.env.CI ? 10000 : 5000,

    // Parallel execution
    threads: true,
    maxThreads: 4,
    minThreads: 1,

    // Reporter configuration
    reporter: ['verbose', 'junit'],
    outputFile: {
      junit: './test-results.xml',
    },

    // Mock configuration
    clearMocks: true,
    restoreMocks: true,

    // Watch mode exclusions
    watchExclude: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '.git/**',
      'src/__tests__/e2e/**', // Also exclude from watch
    ],
  },

  // Path resolution (same as Vite)
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
