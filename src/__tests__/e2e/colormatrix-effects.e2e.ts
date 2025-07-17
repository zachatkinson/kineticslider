/**
 * @fileoverview ColorMatrixFilter Effects E2E Tests
 *
 * End-to-end tests for ColorMatrixFilter effects using real PIXI.js implementation.
 * Tests that filter methods like brightness, sepia, hue, etc. work correctly.
 *
 * @version 1.0.0
 */

import { test, expect } from '@playwright/test';
import { navigateAndWait } from './utils';

test.describe('ColorMatrixFilter Effects E2E', () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page);
  });

  test('should create and apply glow effects with ColorMatrixFilter', async ({
    page,
  }) => {
    // Wait for the slider to be initialized
    const slider = page.locator('[data-testid="kinetic-slider"]');
    await expect(slider).toBeVisible();

    // Execute ColorMatrixFilter glow effect test in the browser
    const result = await page.evaluate(async () => {
      try {
        // Import the required modules
        const { EffectPresets } = await import(
          '../../rendering/effect-presets'
        );
        const { Sprite, Texture } = await import('pixi.js');

        // Create test setup
        const effectPresets = new EffectPresets();
        const texture = Texture.WHITE;
        const sprite = new Sprite(texture);

        // Test soft glow effect
        const softGlowEffect = effectPresets.createEffect('softGlow', {
          intensity: 'moderate',
          duration: 1.0,
        });

        // Apply effect to sprite
        softGlowEffect.applyTo(sprite);

        // Test neon glow effect
        const neonGlowEffect = effectPresets.createEffect('neonGlow', {
          intensity: 'strong',
          duration: 1.5,
        });

        neonGlowEffect.applyTo(sprite);

        // Clean up
        softGlowEffect.cleanup();
        neonGlowEffect.cleanup();

        return {
          success: true,
          softGlowApplied: !!softGlowEffect.timeline,
          neonGlowApplied: !!neonGlowEffect.timeline,
          filtersApplied: sprite.filters ? sprite.filters.length > 0 : false,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    });

    expect(result.success).toBe(true);
    expect(result.softGlowApplied).toBe(true);
    expect(result.neonGlowApplied).toBe(true);
  });

  test('should create and apply color effects with ColorMatrixFilter', async ({
    page,
  }) => {
    const slider = page.locator('[data-testid="kinetic-slider"]');
    await expect(slider).toBeVisible();

    const result = await page.evaluate(async () => {
      try {
        const { EffectPresets } = await import(
          '../../rendering/effect-presets'
        );
        const { Sprite, Texture } = await import('pixi.js');

        const effectPresets = new EffectPresets();
        const texture = Texture.WHITE;
        const sprite = new Sprite(texture);

        // Test vintage effect
        const vintageEffect = effectPresets.createEffect('vintage', {
          intensity: 'moderate',
          duration: 1.0,
        });

        vintageEffect.applyTo(sprite);

        // Test cyberpunk effect
        const cyberpunkEffect = effectPresets.createEffect('cyberpunk', {
          intensity: 'strong',
          duration: 1.2,
        });

        cyberpunkEffect.applyTo(sprite);

        // Test black and white effect
        const bwEffect = effectPresets.createEffect('blackAndWhite', {
          intensity: 'moderate',
          duration: 1.0,
        });

        bwEffect.applyTo(sprite);

        // Clean up
        vintageEffect.cleanup();
        cyberpunkEffect.cleanup();
        bwEffect.cleanup();

        return {
          success: true,
          vintageApplied: !!vintageEffect.timeline,
          cyberpunkApplied: !!cyberpunkEffect.timeline,
          bwApplied: !!bwEffect.timeline,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    });

    expect(result.success).toBe(true);
    expect(result.vintageApplied).toBe(true);
    expect(result.cyberpunkApplied).toBe(true);
    expect(result.bwApplied).toBe(true);
  });

  test('should validate ColorMatrixFilter methods exist', async ({ page }) => {
    const slider = page.locator('[data-testid="kinetic-slider"]');
    await expect(slider).toBeVisible();

    const result = await page.evaluate(async () => {
      try {
        const { ColorMatrixFilter } = await import('pixi.js');

        // Test that ColorMatrixFilter methods are available
        const filter = new ColorMatrixFilter();

        // Test methods exist
        const hasFilterMethods = {
          brightness: typeof filter.brightness === 'function',
          sepia: typeof filter.sepia === 'function',
          hue: typeof filter.hue === 'function',
          saturate: typeof filter.saturate === 'function',
          desaturate: typeof filter.desaturate === 'function',
          contrast: typeof filter.contrast === 'function',
        };

        return {
          success: true,
          hasFilterMethods,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    });

    expect(result.success).toBe(true);
    expect(result.hasFilterMethods?.brightness).toBe(true);
    expect(result.hasFilterMethods?.sepia).toBe(true);
    expect(result.hasFilterMethods?.hue).toBe(true);
    expect(result.hasFilterMethods?.saturate).toBe(true);
    expect(result.hasFilterMethods?.desaturate).toBe(true);
    expect(result.hasFilterMethods?.contrast).toBe(true);
  });

  test('should handle ColorMatrixFilter with different intensity levels', async ({
    page,
  }) => {
    const slider = page.locator('[data-testid="kinetic-slider"]');
    await expect(slider).toBeVisible();

    const result = await page.evaluate(async () => {
      try {
        const { EffectPresets } = await import(
          '../../rendering/effect-presets'
        );
        const { Sprite, Texture } = await import('pixi.js');

        const effectPresets = new EffectPresets();
        const texture = Texture.WHITE;
        const sprite = new Sprite(texture);

        const intensityLevels = ['subtle', 'moderate', 'strong', 'intense'];
        const results = [];

        for (const intensity of intensityLevels) {
          const effect = effectPresets.createEffect('vintage', {
            intensity: intensity as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            duration: 0.5,
          });

          effect.applyTo(sprite);
          results.push({
            intensity,
            applied: !!effect.timeline,
          });

          effect.cleanup();
        }

        return {
          success: true,
          results,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    });

    expect(result.success).toBe(true);
    expect(result.results).toBeDefined();
    expect(result.results).toHaveLength(4);
    result.results?.forEach((r: { intensity: string; applied: boolean }) => {
      expect(r.applied).toBe(true);
    });
  });

  test('should handle ColorMatrixFilter error cases gracefully', async ({
    page,
  }) => {
    const slider = page.locator('[data-testid="kinetic-slider"]');
    await expect(slider).toBeVisible();

    const result = await page.evaluate(async () => {
      try {
        const { EffectPresets } = await import(
          '../../rendering/effect-presets'
        );
        const { Sprite, Texture } = await import('pixi.js');

        const effectPresets = new EffectPresets();
        const texture = Texture.WHITE;
        const sprite = new Sprite(texture);

        // Test with extreme intensity
        const extremeEffect = effectPresets.createEffect('cyberpunk', {
          intensity: 'intense',
          duration: 0.1,
        });

        extremeEffect.applyTo(sprite);

        extremeEffect.cleanup();

        return {
          success: true,
          extremeEffectApplied: !!extremeEffect.timeline,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    });

    expect(result.success).toBe(true);
    expect(result.extremeEffectApplied).toBe(true);
  });
});
