import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths({
      projects: ['./tsconfig.testing.json']
    })
  ],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/__tests__/setup-browser.ts'],
    include: ['src/__tests__/browser/**/*.{test,spec}.{ts,tsx}'],
    globals: true,
    testTimeout: 120000,
    hookTimeout: 120000,
    teardownTimeout: 120000,
    retry: 2,
    isolate: true,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
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