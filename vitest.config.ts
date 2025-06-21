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

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
      ],
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
    },

    // Test file patterns
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],

    // Exclude patterns
    exclude: [
      'node_modules/',
      'dist/',
      '.next/',
      'coverage/',
      '**/*.e2e.{test,spec}.{js,ts,jsx,tsx}', // Exclude E2E tests
    ],
  },

  // Path resolution (same as Vite)
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
