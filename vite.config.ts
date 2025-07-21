import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

// HTTPS certificate paths for development
const httpsConfig = {
  key: fs.existsSync('./.certs/dev.key')
    ? fs.readFileSync('./.certs/dev.key')
    : undefined,
  cert: fs.existsSync('./.certs/dev.crt')
    ? fs.readFileSync('./.certs/dev.crt')
    : undefined,
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Build configuration for library
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'KineticSlider',
      formats: ['es', 'umd'],
      fileName: (format) => `kinetic-slider.${format}.js`,
    },
    rollupOptions: {
      // Externalize peer dependencies
      external: ['react', 'react-dom', 'pixi.js', 'pixi-filters', 'gsap'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'pixi.js': 'PIXI',
          'pixi-filters': 'PIXI.filters',
          gsap: 'gsap',
        },
      },
    },
    // Generate source maps for debugging
    sourcemap: true,
    // Target modern browsers
    target: 'es2020',
    // Performance optimization
    minify: 'esbuild',
    // Bundle size reporting
    reportCompressedSize: true,
    // Chunk size warning limit (100KB)
    chunkSizeWarningLimit: 100,
  },

  // Development server configuration
  server: {
    port: 3000,
    strictPort: true, // Fail if port is in use instead of auto-incrementing
    host: true, // Allow external connections
    open: true,
    // HTTPS for development (if certificates exist)
    https: httpsConfig.key && httpsConfig.cert ? httpsConfig : false,
    // CORS configuration
    cors: {
      origin: [
        'http://localhost:3000',
        'https://localhost:3000',
        'http://127.0.0.1:3000',
      ],
      credentials: true,
    },
    // Headers for security
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },

  // Preview server configuration (for CI)
  preview: {
    port: 4173,
    host: true,
    https: httpsConfig.key && httpsConfig.cert ? httpsConfig : false,
    cors: true,
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },

  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  // CSS configuration
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
    // PostCSS configuration for optimization
    postcss: './postcss.config.ts',
  },

  // Optimization configuration
  optimizeDeps: {
    include: ['react', 'react-dom', 'pixi.js', 'gsap'], // Include PIXI.js for proper resolution
    exclude: ['pixi-filters'], // Only exclude pixi-filters
  },

  // Define global constants
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __PROD__: JSON.stringify(process.env.NODE_ENV === 'production'),
  },
});
