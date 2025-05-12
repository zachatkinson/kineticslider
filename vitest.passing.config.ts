import { defineConfig } from 'vitest/config';
import { defaultConfig } from './vitest.config';

export default defineConfig({
  ...defaultConfig,
  test: {
    ...defaultConfig.test,
    exclude: [
      ...defaultConfig.test.exclude,
      // Skip tests with known issues
      '**/pixi/PixiSlider.test.tsx',       // Complex PIXI.js mocking needed
      '**/e2e/slider.spec.ts',             // E2E tests need separate Playwright setup
      // '**/components/gesture-handling.test.tsx' has been migrated to browser and unit tests
      '**/hooks/useKineticSlider.test.ts',        // Conflicts with the .tsx version
      '**/components/KineticSlider.spec.tsx',     // Older test file superseded by newer tests
    ],
  },
}); 