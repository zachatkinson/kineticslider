/**
 * @fileoverview Filter Validation Utility
 *
 * Validates that our filter integration works properly with PIXI native filters
 * and extended pixi-filters. Provides runtime testing capabilities.
 *
 * @version 1.0.0
 */

import {
  Texture,
  Sprite,
  BlurFilter,
  ColorMatrixFilter,
  NoiseFilter,
} from 'pixi.js';
import { FilterChain } from './filter-chain';
import { AdvancedFilterPresets } from './advanced-filter-presets';
import { DisplacementTextureLoader } from './displacement-texture-loader';

/**
 * Validation result for a single filter test
 */
export interface FilterValidationResult {
  /** Filter name being tested */
  name: string;
  /** Whether the filter loaded successfully */
  loaded: boolean;
  /** Whether the filter can be applied to a sprite */
  applicable: boolean;
  /** Whether the filter integrates with FilterChain */
  chainIntegration: boolean;
  /** Error message if any step failed */
  error: string | null;
  /** Performance timing in milliseconds */
  timing: number;
}

/**
 * Overall validation results
 */
export interface ValidationResults {
  /** Individual filter results */
  filters: FilterValidationResult[];
  /** Whether displacement textures loaded */
  displacementTexturesLoaded: boolean;
  /** Overall success rate */
  successRate: number;
  /** Total validation time */
  totalTime: number;
}

/**
 * FilterValidator - Validates filter system integration
 *
 * Provides comprehensive testing of our filter infrastructure to ensure
 * all components work together correctly.
 */
export class FilterValidator {
  /**
   * Validate core PIXI filters integration
   *
   * @returns Promise resolving to validation results
   */
  static async validateCoreFilters(): Promise<FilterValidationResult[]> {
    const results: FilterValidationResult[] = [];
    const testSprite = new Sprite(Texture.WHITE);

    // Core PIXI filters to test
    const coreFilters = [
      { name: 'BlurFilter', create: (): BlurFilter => new BlurFilter() },
      {
        name: 'ColorMatrixFilter',
        create: (): ColorMatrixFilter => new ColorMatrixFilter(),
      },
      { name: 'NoiseFilter', create: (): NoiseFilter => new NoiseFilter() },
    ];

    for (const filterDef of coreFilters) {
      const startTime = performance.now();
      const result: FilterValidationResult = {
        name: filterDef.name,
        loaded: false,
        applicable: false,
        chainIntegration: false,
        error: null,
        timing: 0,
      };

      try {
        // Test filter creation
        const filter = filterDef.create();
        result.loaded = true;

        // Test application to sprite
        testSprite.filters = [filter];
        result.applicable = true;

        // Test FilterChain integration
        const filterChain = new FilterChain({ name: `test-${filterDef.name}` });
        filterChain.addFilter(filter, { id: filterDef.name.toLowerCase() });
        filterChain.applyTo(testSprite);
        result.chainIntegration = true;

        // Cleanup
        filterChain.dispose();
        testSprite.filters = [];
      } catch (error) {
        result.error = error instanceof Error ? error.message : 'Unknown error';
      }

      result.timing = performance.now() - startTime;
      results.push(result);
    }

    return results;
  }

  /**
   * Validate advanced pixi-filters integration
   *
   * @returns Promise resolving to validation results
   */
  static async validateAdvancedFilters(): Promise<FilterValidationResult[]> {
    const results: FilterValidationResult[] = [];
    const testSprite = new Sprite(Texture.WHITE);
    const presets = new AdvancedFilterPresets();

    // Advanced filter presets to test
    const advancedPresets = ['ascii', 'dot', 'glow', 'crt', 'pixelate', 'adjustment'];

    for (const presetName of advancedPresets) {
      const startTime = performance.now();
      const result: FilterValidationResult = {
        name: presetName,
        loaded: false,
        applicable: false,
        chainIntegration: false,
        error: null,
        timing: 0,
      };

      try {
        // Test preset creation
        const effectResult = presets.createEffect(presetName, {
          intensity: 'moderate',
          duration: 0.5,
          ease: 'power2.out',
          autoCleanup: true,
        });
        result.loaded = true;

        // Test application to sprite
        effectResult.applyTo(testSprite);
        result.applicable = true;

        // Test FilterChain integration (preset already uses FilterChain)
        result.chainIntegration = !!effectResult.filterChain;

        // Cleanup
        effectResult.cleanup();
      } catch (error) {
        result.error = error instanceof Error ? error.message : 'Unknown error';
      }

      result.timing = performance.now() - startTime;
      results.push(result);
    }

    return results;
  }

  /**
   * Validate displacement texture system
   *
   * @returns Promise resolving to validation result
   */
  static async validateDisplacementSystem(): Promise<boolean> {
    try {
      const textureLoader = new DisplacementTextureLoader();

      // Try to load displacement textures
      const textures = await textureLoader.loadDisplacementTextures();

      // Verify textures were loaded
      if (!textures.background || !textures.cursor) {
        return false;
      }

      // Test DisplacementEffects creation
      const displacementEffects =
        textureLoader.createDisplacementEffects('background');

      // Test basic effect creation
      const testSprite = new Sprite(Texture.WHITE);
      const timeline = displacementEffects.createIdleEffect(testSprite, {
        type: 'subtle',
        intensity: 0.3,
        enabled: false, // Don't start animation
      });

      // Cleanup
      timeline.kill();
      displacementEffects.dispose();
      textureLoader.dispose();

      return true;
    } catch (error) {
      // Log validation failure for debugging in non-test environments
      if (process.env.NODE_ENV !== 'test') {
        /* eslint-disable-next-line no-console */
        console.warn('Displacement system validation failed:', error);
      }
      return false;
    }
  }

  /**
   * Run comprehensive filter system validation
   *
   * @returns Promise resolving to complete validation results
   */
  static async validateFilterSystem(): Promise<ValidationResults> {
    const startTime = performance.now();

    // Run all validations
    const [coreResults, advancedResults, displacementValid] = await Promise.all(
      [
        this.validateCoreFilters(),
        this.validateAdvancedFilters(),
        this.validateDisplacementSystem(),
      ]
    );

    const allResults = [...coreResults, ...advancedResults];
    const successCount = allResults.filter(
      (r) => r.loaded && r.applicable && r.chainIntegration
    ).length;

    return {
      filters: allResults,
      displacementTexturesLoaded: displacementValid,
      successRate: allResults.length > 0 ? successCount / allResults.length : 0,
      totalTime: performance.now() - startTime,
    };
  }

  /**
   * Generate validation report
   *
   * @param results - Validation results to report on
   * @returns Formatted report string
   */
  static generateReport(results: ValidationResults): string {
    const lines: string[] = [];

    lines.push('🎯 Filter System Validation Report');
    lines.push('='.repeat(40));
    lines.push(`⏱️  Total Time: ${results.totalTime.toFixed(2)}ms`);
    lines.push(`📊 Success Rate: ${(results.successRate * 100).toFixed(1)}%`);
    lines.push(
      `🔧 Displacement Textures: ${results.displacementTexturesLoaded ? '✅' : '❌'}`
    );
    lines.push('');

    lines.push('Filter Results:');
    lines.push('-'.repeat(20));

    for (const filter of results.filters) {
      const status =
        filter.loaded && filter.applicable && filter.chainIntegration
          ? '✅'
          : '❌';
      const timing = filter.timing.toFixed(1);

      lines.push(`${status} ${filter.name} (${timing}ms)`);

      if (filter.error) {
        lines.push(`   ⚠️  Error: ${filter.error}`);
      }

      if (!filter.loaded) lines.push('   📦 Failed to load');
      if (!filter.applicable) lines.push('   🎯 Failed to apply to sprite');
      if (!filter.chainIntegration)
        lines.push('   🔗 Failed FilterChain integration');
    }

    return lines.join('\n');
  }

  /**
   * Quick validation check (for runtime use)
   *
   * @returns Promise resolving to simple pass/fail boolean
   */
  static async quickValidation(): Promise<boolean> {
    try {
      const results = await this.validateFilterSystem();
      return results.successRate > 0.8 && results.displacementTexturesLoaded;
    } catch {
      return false;
    }
  }
}
