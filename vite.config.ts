/// <reference types="vite/client" />
import { defineConfig, UserConfig, ConfigEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import viteCompression from 'vite-plugin-compression';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ mode }: ConfigEnv): UserConfig => ({
  plugins: [
    react({
      // Enable Fast Refresh
      fastRefresh: true,
      // Enable build-time JSX validation
      jsxRuntime: 'automatic',
      // Add Babel options for better optimization
      babel: {
        plugins: mode === 'production' ? [
          ['babel-plugin-transform-react-remove-prop-types', { removeImport: true }]
        ] : []
      }
    }),
    tsconfigPaths(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      // Optimize compression
      threshold: 1024,
      deleteOriginFile: false,
      compressionOptions: {
        level: 9
      }
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
    }
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'KineticSlider',
      formats: ['es', 'umd'] as const,
      fileName: (format: 'es' | 'umd') => `kineticslider.${format}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'gsap', 'pixi.js'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          gsap: 'gsap',
          'pixi.js': 'PIXI',
        },
        manualChunks: {
          vendor: ['react', 'react-dom'],
          animations: ['gsap'],
          graphics: ['pixi.js'],
        },
        // Add module format specific options
        esm: {
          minifyInternalExports: true
        },
        umd: {
          indent: false,
          strict: true
        }
      },
    },
    sourcemap: true,
    minify: 'esbuild',
    chunkSizeWarningLimit: 500,
    cssCodeSplit: true,
    emptyOutDir: true,
    assetsInlineLimit: 4096,
    reportCompressedSize: true,
    // Add additional build optimizations
    target: 'esnext',
    cssTarget: 'chrome80',
    modulePreload: {
      polyfill: true
    }
  },
  server: {
    port: 3000,
    open: true,
    strictPort: true,
    hmr: {
      overlay: true,
      timeout: 1000,
    },
    watch: {
      usePolling: false,
      interval: 100,
    },
    // Add security headers
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: [],
    esbuildOptions: {
      target: 'esnext',
      // Add support for top-level await
      supported: {
        'top-level-await': true
      },
      // Improve tree-shaking
      treeShaking: true,
      // Improve minification
      minify: true,
      // Keep pure annotations
      keepNames: false
    }
  },
  // Add preview configuration
  preview: {
    port: 3001,
    strictPort: true,
    open: true,
    cors: true
  },
  // Add test configuration
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/setup.ts',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
      ],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
    }
  }
})); 