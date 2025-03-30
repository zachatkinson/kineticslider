import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        '**/*.d.ts',
        '**/*.config.ts',
        '**/index.ts',
        '**/dist/**',
        '**/node_modules/**',
        '**/src/__tests__/'
      ],
      lines: 90,
      functions: 90,
      branches: 90,
      statements: 90,
      all: true,
      reportOnFailure: true,
    },
    testTimeout: 10000,
    retry: 2,
    isolate: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@utils': resolve(__dirname, './src/utils'),
      '@lib': resolve(__dirname, './src/lib'),
      '@types': resolve(__dirname, './src/types')
    }
  }
}); 