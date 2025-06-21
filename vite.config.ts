import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

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
  },

  // Development server configuration
  server: {
    port: 3000,
    open: true,
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
  },
});
