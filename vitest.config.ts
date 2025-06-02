/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';

export const defaultConfig = {
  plugins: [
    react(),
    tsconfigPaths({
      projects: ['./tsconfig.testing.json']
    })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts', './src/__tests__/setup-worker.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.next/**',
      '**/e2e/**',
    ],
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8' as const,
      reporter: ['text', 'json', 'html'],
      exclude: ['src/__tests__/**/*']
    },
    deps: {
      optimizer: {
        web: {
          include: ['vitest-canvas-mock']
        }
      }
    },
    testTimeout: 120000,
    hookTimeout: 120000,
    teardownTimeout: 120000,
    retry: 2,
    isolate: true,
    threads: false,
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
      '@types': resolve(__dirname, './src/types'),
      'src/__tests__/loader.mjs': resolve(__dirname, './src/__tests__/loader.mjs')
    },
    conditions: ['development', 'browser']
  },
  worker: {
    format: 'iife' as const,
    plugins: () => [
      {
        name: 'ts-worker',
        transform(code, id) {
          if (id.endsWith('.ts')) {
            return {
              code: code.replace(/\.ts/g, '.js'),
              map: null
            };
          }
        }
      }
    ]
  }
};

export default defineConfig(defaultConfig); 