import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/workers/pool-worker.ts',
      formats: ['es'],
      fileName: () => 'pool-worker.js',
    },
    outDir: 'dist/workers',
    emptyOutDir: false,
    rollupOptions: {
      // No external dependencies for a minimal worker
    },
    minify: false, // Set to true for production if desired
  }
}); 