/// <reference types="vite/client" />
/// <reference types="vitest" />
import { defineConfig, UserConfig, ConfigEnv } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }: ConfigEnv): UserConfig => ({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      babel: {
        plugins: mode === 'production' ? [
          ['babel-plugin-transform-react-remove-prop-types', { removeImport: true }],
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
        ] : []
      }
    }),
    compression({
      algorithm: 'gzip',
      ext: '.gz'
    }),
    tsconfigPaths()
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'KineticSlider',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => `kineticslider.${format}.js`
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'gsap', 'pixi.js'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          gsap: 'gsap',
          'pixi.js': 'PIXI'
        }
      }
    },
    sourcemap: true,
    emptyOutDir: true,
    reportCompressedSize: true,
    target: 'es2015',
    cssTarget: 'chrome80',
    modulePreload: {
      polyfill: true
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    open: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    },
    cors: true
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['gsap', 'pixi.js'],
    esbuildOptions: {
      target: 'esnext',
    }
  },
  preview: {
    port: 8080,
    open: true,
    cors: true
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/types/**/*',
        'src/mocks/**/*',
        'src/**/index.ts',
        'src/setupTests.ts'
      ],
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  } as UserConfig['test']
})); 