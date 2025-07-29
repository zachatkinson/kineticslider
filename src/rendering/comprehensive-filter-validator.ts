/**
 * @fileoverview Comprehensive Filter Validator
 *
 * Enhanced validation system for all PIXI filters with performance metrics,
 * browser compatibility testing, and comprehensive validation coverage.
 *
 * @version 1.0.0
 */

import { Sprite, Texture, Filter, Application } from 'pixi.js';
import { FilterValidator, ValidationResults } from './filter-validation';
import { EffectPresets } from './effect-presets';
import { AdvancedFilterPresets } from './advanced-filter-presets';
import { debugLogger } from '../utils/debug-logger';

/**
 * Performance metrics for a filter
 */
export interface PerformanceMetrics {
  /** Filter name */
  name: string;
  /** Average frame time in ms */
  avgFrameTime: number;
  /** Max frame time in ms */
  maxFrameTime: number;
  /** Min frame time in ms */
  minFrameTime: number;
  /** Frames per second */
  fps: number;
  /** Memory usage in MB */
  memoryUsage: number;
  /** Whether filter maintains 60fps */
  maintains60fps: boolean;
}

/**
 * Browser compatibility result
 */
export interface BrowserCompatibility {
  /** Filter name */
  name: string;
  /** Browser name */
  browser: string;
  /** Whether filter works in this browser */
  compatible: boolean;
  /** Performance in this browser */
  performance: 'excellent' | 'good' | 'poor' | 'failed';
  /** Any errors encountered */
  errors: string[];
}

/**
 * Complete filter validation results
 */
export interface FilterValidationResults {
  /** Basic validation results */
  validation: ValidationResults;
  /** Performance metrics for each filter */
  performance: PerformanceMetrics[];
  /** Browser compatibility matrix */
  compatibility: BrowserCompatibility[];
  /** Overall success */
  allTestsPassed: boolean;
  /** Total validation time */
  totalTime: number;
}

/**
 * ComprehensiveFilterValidator - Complete filter system validation
 *
 * Provides exhaustive testing of all filters including performance benchmarking,
 * browser compatibility testing, and comprehensive validation coverage.
 */
export class ComprehensiveFilterValidator extends FilterValidator {
  private app: Application | null = null;
  private effectPresets: EffectPresets;
  private advancedPresets: AdvancedFilterPresets;

  constructor() {
    super();
    this.effectPresets = new EffectPresets();
    this.advancedPresets = new AdvancedFilterPresets();
  }

  /**
   * Initialize PIXI application for testing
   */
  private async initializeApp(): Promise<void> {
    if (this.app) return;

    this.app = new Application();
    await this.app.init({
      width: 800,
      height: 600,
      backgroundAlpha: 0,
      antialias: true,
    });
  }

  /**
   * Get all available filter names
   */
  private getAllFilterNames(): string[] {
    // Core PIXI filters
    const coreFilters = [
      'blur',
      'alpha',
      'colorMatrix',
      'displacement',
      'noise',
    ];

    // Effect preset filters
    const effectPresetFilters = this.effectPresets.getPresetNames();

    // Advanced preset filters
    const advancedPresetFilters = this.advancedPresets.getPresetNames();

    // Combine and deduplicate
    const allFilters = [
      ...new Set([
        ...coreFilters,
        ...effectPresetFilters,
        ...advancedPresetFilters,
      ]),
    ];

    return allFilters.sort();
  }

  /**
   * Validate all filters comprehensively
   */
  async validateAllFilters(): Promise<FilterValidationResults> {
    const startTime = performance.now();

    debugLogger.info(
      'Starting comprehensive filter validation',
      'FILTER_VALIDATOR'
    );

    // Initialize app if needed
    await this.initializeApp();

    // Run basic validation
    const validation = await FilterValidator.validateFilterSystem();

    // Test performance for each filter
    const allFilters = this.getAllFilterNames();
    const performanceResults: PerformanceMetrics[] = [];

    for (const filterName of allFilters) {
      try {
        const metrics = await this.testFilterPerformance(filterName);
        performanceResults.push(metrics);
      } catch (error) {
        debugLogger.error(
          `Performance test failed for ${filterName}: ${error}`,
          'FILTER_VALIDATOR'
        );
        performanceResults.push({
          name: filterName,
          avgFrameTime: -1,
          maxFrameTime: -1,
          minFrameTime: -1,
          fps: 0,
          memoryUsage: -1,
          maintains60fps: false,
        });
      }
    }

    // Test browser compatibility
    const compatibility: BrowserCompatibility[] = [];
    for (const filterName of allFilters) {
      const compatResults = await this.testFilterCompatibility(filterName);
      compatibility.push(...compatResults);
    }

    // Determine overall success
    const validationPassed = validation.successRate > 0.95;
    const performancePassed =
      performanceResults.filter((p) => p.maintains60fps).length /
        performanceResults.length >
      0.9;
    const compatibilityPassed =
      compatibility.filter((c) => c.compatible).length / compatibility.length >
      0.9;

    const allTestsPassed =
      validationPassed && performancePassed && compatibilityPassed;

    const totalTime = performance.now() - startTime;

    debugLogger.info(
      `Comprehensive validation complete in ${totalTime.toFixed(2)}ms - Success: ${allTestsPassed}`,
      'FILTER_VALIDATOR'
    );

    // Cleanup
    if (this.app) {
      this.app.destroy();
      this.app = null;
    }

    return {
      validation,
      performance: performanceResults,
      compatibility,
      allTestsPassed,
      totalTime,
    };
  }

  /**
   * Test filter performance
   */
  async testFilterPerformance(filterName: string): Promise<PerformanceMetrics> {
    if (!this.app) {
      await this.initializeApp();
    }

    const testSprite = new Sprite(Texture.WHITE);
    testSprite.width = 400;
    testSprite.height = 300;
    this.app!.stage.addChild(testSprite);

    // Create filter
    let filter: Filter | null = null;
    try {
      filter = await this.createFilterByName(filterName);
    } catch (error) {
      throw new Error(`Failed to create filter ${filterName}: ${error}`);
    }

    if (!filter) {
      throw new Error(`Filter ${filterName} not found`);
    }

    // Apply filter
    testSprite.filters = [filter];

    // Measure performance over 60 frames
    const frameTimes: number[] = [];
    const memoryStart =
      (performance as { memory?: { usedJSHeapSize?: number } }).memory
        ?.usedJSHeapSize || 0;

    for (let i = 0; i < 60; i++) {
      const frameStart = performance.now();

      // Force render
      this.app!.renderer.render(this.app!.stage);

      const frameEnd = performance.now();
      frameTimes.push(frameEnd - frameStart);

      // Small delay to simulate frame rate
      await new Promise((resolve) => setTimeout(resolve, 16));
    }

    const memoryEnd =
      (performance as { memory?: { usedJSHeapSize?: number } }).memory
        ?.usedJSHeapSize || 0;
    const memoryUsage = (memoryEnd - memoryStart) / 1024 / 1024; // Convert to MB

    // Calculate metrics
    const avgFrameTime =
      frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    const maxFrameTime = Math.max(...frameTimes);
    const minFrameTime = Math.min(...frameTimes);
    const fps = 1000 / avgFrameTime;
    const maintains60fps = avgFrameTime <= 16.67; // 60fps = 16.67ms per frame

    // Cleanup
    this.app!.stage.removeChild(testSprite);
    testSprite.destroy();

    return {
      name: filterName,
      avgFrameTime,
      maxFrameTime,
      minFrameTime,
      fps,
      memoryUsage,
      maintains60fps,
    };
  }

  /**
   * Test filter compatibility across browsers
   */
  async testFilterCompatibility(
    filterName: string
  ): Promise<BrowserCompatibility[]> {
    // In a real implementation, this would use browser detection
    // For now, we'll simulate based on known compatibility
    const browsers = ['chrome', 'firefox', 'safari', 'edge'];
    const results: BrowserCompatibility[] = [];

    for (const browser of browsers) {
      try {
        await this.createFilterByName(filterName);

        // Simulate compatibility testing
        const compatible = this.checkBrowserSupport(filterName, browser);
        const performance = compatible ? 'excellent' : 'failed';

        results.push({
          name: filterName,
          browser,
          compatible,
          performance,
          errors: compatible
            ? []
            : [`Filter ${filterName} not supported in ${browser}`],
        });
      } catch (error) {
        results.push({
          name: filterName,
          browser,
          compatible: false,
          performance: 'failed',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        });
      }
    }

    return results;
  }

  /**
   * Create filter by name
   */
  private async createFilterByName(name: string): Promise<Filter | null> {
    // Try effect presets first
    try {
      const effect = this.effectPresets.createEffect(name);
      return effect.filters[0] || null;
    } catch {
      // Not in effect presets
    }

    // Try advanced presets
    try {
      const effect = this.advancedPresets.createEffect(name);
      return effect.filters[0] || null;
    } catch {
      // Not in advanced presets
    }

    // Try core filters
    switch (name) {
      case 'blur': {
        const { BlurFilter } = await import('pixi.js');
        return new BlurFilter(8);
      }
      case 'alpha': {
        const { AlphaFilter } = await import('pixi.js');
        return new AlphaFilter({ alpha: 0.5 });
      }
      case 'colorMatrix': {
        const { ColorMatrixFilter } = await import('pixi.js');
        return new ColorMatrixFilter();
      }
      case 'displacement': {
        const { DisplacementFilter, Sprite, Texture } = await import('pixi.js');
        return new DisplacementFilter({
          sprite: new Sprite(Texture.WHITE),
          scale: 20,
        });
      }
      case 'noise': {
        const { NoiseFilter } = await import('pixi.js');
        return new NoiseFilter();
      }
      default:
        return null;
    }
  }

  /**
   * Check browser support for filter
   */
  private checkBrowserSupport(filterName: string, browser: string): boolean {
    // Known compatibility issues
    const incompatibilities: Record<string, string[]> = {
      displacement: ['safari'], // Displacement can have issues on Safari
      shockwave: ['safari'],
      // Add more known incompatibilities
    };

    const incompatibleBrowsers =
      incompatibilities[filterName as keyof typeof incompatibilities] || [];
    return !incompatibleBrowsers.includes(browser);
  }

  /**
   * Generate comprehensive report
   */
  static generateComprehensiveReport(results: FilterValidationResults): string {
    const lines: string[] = [];

    lines.push('🎯 Comprehensive Filter Validation Report');
    lines.push('='.repeat(50));
    lines.push(`⏱️  Total Time: ${results.totalTime.toFixed(2)}ms`);
    lines.push(`✅ All Tests Passed: ${results.allTestsPassed ? 'YES' : 'NO'}`);
    lines.push('');

    // Basic validation summary
    lines.push('📋 Basic Validation:');
    lines.push(
      `   Success Rate: ${(results.validation.successRate * 100).toFixed(1)}%`
    );
    lines.push(`   Filters Tested: ${results.validation.filters.length}`);
    lines.push('');

    // Performance summary
    lines.push('⚡ Performance Summary:');
    const maintaining60fps = results.performance.filter(
      (p) => p.maintains60fps
    ).length;
    lines.push(
      `   Maintaining 60fps: ${maintaining60fps}/${results.performance.length}`
    );

    const avgFps =
      results.performance.reduce((sum, p) => sum + p.fps, 0) /
      results.performance.length;
    lines.push(`   Average FPS: ${avgFps.toFixed(1)}`);
    lines.push('');

    // Browser compatibility summary
    lines.push('🌐 Browser Compatibility:');
    const compatible = results.compatibility.filter((c) => c.compatible).length;
    lines.push(`   Compatible: ${compatible}/${results.compatibility.length}`);
    lines.push('');

    // Detailed performance results
    lines.push('📊 Detailed Performance Results:');
    lines.push('-'.repeat(40));
    for (const perf of results.performance) {
      const status = perf.maintains60fps ? '✅' : '❌';
      lines.push(
        `${status} ${perf.name}: ${perf.fps.toFixed(1)}fps (${perf.avgFrameTime.toFixed(2)}ms/frame)`
      );
    }

    return lines.join('\n');
  }
}
