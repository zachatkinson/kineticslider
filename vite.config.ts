import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'KineticSlider',
      formats: ['es', 'umd'],
      fileName: (format) => `kineticslider.${format}.js`,
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
      },
    },
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  },
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
    },
  },
}); 