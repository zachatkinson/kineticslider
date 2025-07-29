/**
 * @fileoverview Filter Performance Benchmarking System
 *
 * Comprehensive performance measurement framework for all PIXI filters,
 * providing detailed metrics and performance regression detection.
 *
 * @version 1.0.0
 */

import { Application, Sprite, Texture, Filter } from 'pixi.js';
import { ComprehensiveFilterValidator, PerformanceMetrics } from './comprehensive-filter-validator';
import { debugLogger } from '../utils/debug-logger';

/**
 * Performance benchmark configuration
 */
export interface BenchmarkConfig {
  /** Number of sprites to test with */
  spriteCount: number;
  /** Number of frames to measure */
  frameCount: number;
  /** Target FPS (default 60) */
  targetFPS: number;
  /** Whether to test with animations */
  testAnimations: boolean;
  /** Whether to test filter combinations */
  testCombinations: boolean;
}

/**
 * Benchmark result for a single test
 */
export interface BenchmarkResult {
  /** Test configuration */
  config: BenchmarkConfig;
  /** Filter name(s) */
  filters: string[];
  /** Performance metrics */
  metrics: PerformanceMetrics;
  /** Additional details */
  details: {
    /** GPU usage percentage (if available) */
    gpuUsage?: number;
    /** CPU usage percentage (if available) */
    cpuUsage?: number;
    /** Draw calls */
    drawCalls: number;
    /** Texture memory used (MB) */
    textureMemory: number;
  };
}

/**
 * Complete benchmark report
 */
export interface BenchmarkReport {
  /** Individual benchmark results */
  results: BenchmarkResult[];
  /** Performance regression detected */
  hasRegression: boolean;
  /** Filters that don't meet performance targets */
  problematicFilters: string[];
  /** Recommended optimizations */
  recommendations: string[];
  /** Benchmark duration */
  duration: number;
}

/**
 * FilterPerformanceBenchmark - Comprehensive filter performance testing
 *
 * Provides detailed performance analysis of all filters under various conditions
 * to ensure consistent 60fps performance across the entire filter library.
 */
export class FilterPerformanceBenchmark {
  private app: Application | null = null;
  private validator: ComprehensiveFilterValidator;
  private defaultConfig: BenchmarkConfig = {
    spriteCount: 10,
    frameCount: 300, // 5 seconds at 60fps
    targetFPS: 60,
    testAnimations: true,
    testCombinations: true,
  };

  constructor() {
    this.validator = new ComprehensiveFilterValidator();
  }

  /**
   * Initialize benchmark application
   */
  private async initializeApp(): Promise<void> {
    if (this.app) return;

    this.app = new Application();
    await this.app.init({
      width: 1920,
      height: 1080,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
    });

    // Add to DOM temporarily for accurate measurements
    document.body.appendChild(this.app.canvas);
  }

  /**
   * Cleanup benchmark application
   */
  private cleanup(): void {
    if (this.app) {
      document.body.removeChild(this.app.canvas);
      this.app.destroy();
      this.app = null;
    }
  }

  /**
   * Run comprehensive benchmark
   */
  async runBenchmark(config?: Partial<BenchmarkConfig>): Promise<BenchmarkReport> {
    const benchmarkConfig = { ...this.defaultConfig, ...config };
    const startTime = performance.now();

    debugLogger.info('Starting filter performance benchmark', 'BENCHMARK');

    await this.initializeApp();

    const results: BenchmarkResult[] = [];
    const problematicFilters: string[] = [];

    // Get all filter names
    const allFilters = await this.getAllFilterNames();

    // Test individual filters
    for (const filterName of allFilters) {
      const result = await this.benchmarkFilter([filterName], benchmarkConfig);
      results.push(result);

      if (!result.metrics.maintains60fps) {
        problematicFilters.push(filterName);
      }
    }

    // Test filter combinations if requested
    if (benchmarkConfig.testCombinations) {
      const combinations = this.getFilterCombinations(allFilters);
      for (const combo of combinations) {
        const result = await this.benchmarkFilter(combo, benchmarkConfig);
        results.push(result);

        if (!result.metrics.maintains60fps) {
          problematicFilters.push(combo.join(' + '));
        }
      }
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(results, problematicFilters);

    // Check for performance regression
    const hasRegression = problematicFilters.length > 0;

    const duration = performance.now() - startTime;

    debugLogger.info(
      `Benchmark complete in ${duration.toFixed(2)}ms - Regressions: ${hasRegression}`,
      'BENCHMARK'
    );

    this.cleanup();

    return {
      results,
      hasRegression,
      problematicFilters,
      recommendations,
      duration,
    };
  }

  /**
   * Benchmark specific filter(s)
   */
  private async benchmarkFilter(
    filterNames: string[],
    config: BenchmarkConfig
  ): Promise<BenchmarkResult> {
    if (!this.app) throw new Error('App not initialized');

    // Create test sprites
    const sprites: Sprite[] = [];
    for (let i = 0; i < config.spriteCount; i++) {
      const sprite = new Sprite(Texture.WHITE);
      sprite.width = 200;
      sprite.height = 150;
      sprite.position.set(
        Math.random() * this.app.screen.width,
        Math.random() * this.app.screen.height
      );
      this.app.stage.addChild(sprite);
      sprites.push(sprite);
    }

    // Create and apply filters
    const filters: Filter[] = [];
    for (const filterName of filterNames) {
      const filter = await this.validator['createFilterByName'](filterName);
      if (filter) filters.push(filter);
    }

    sprites.forEach((sprite) => {
      sprite.filters = [...filters];
    });

    // Measure performance
    const frameTimes: number[] = [];
    const startMemory = (performance as { memory?: { usedJSHeapSize?: number } }).memory?.usedJSHeapSize || 0;
    let drawCalls = 0;

    for (let frame = 0; frame < config.frameCount; frame++) {
      const frameStart = performance.now();

      // Animate sprites if requested
      if (config.testAnimations) {
        sprites.forEach((sprite, index) => {
          sprite.rotation += 0.01 * (index + 1);
          sprite.scale.set(1 + Math.sin(frame * 0.1) * 0.2);
        });
      }

      // Render
      this.app.renderer.render(this.app.stage);
      
      // Approximate draw calls (would need WebGL context for accurate count)
      drawCalls = sprites.length * filters.length;

      const frameEnd = performance.now();
      frameTimes.push(frameEnd - frameStart);
    }

    const endMemory = (performance as { memory?: { usedJSHeapSize?: number } }).memory?.usedJSHeapSize || 0;
    const memoryUsage = (endMemory - startMemory) / 1024 / 1024;

    // Calculate metrics
    const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    const maxFrameTime = Math.max(...frameTimes);
    const minFrameTime = Math.min(...frameTimes);
    const fps = 1000 / avgFrameTime;
    const maintains60fps = avgFrameTime <= 1000 / config.targetFPS;

    // Calculate texture memory (approximate)
    const textureMemory = (sprites.length * 200 * 150 * 4) / 1024 / 1024; // RGBA bytes to MB

    // Cleanup
    sprites.forEach((sprite) => {
      this.app!.stage.removeChild(sprite);
      sprite.destroy();
    });

    return {
      config,
      filters: filterNames,
      metrics: {
        name: filterNames.join(' + '),
        avgFrameTime,
        maxFrameTime,
        minFrameTime,
        fps,
        memoryUsage,
        maintains60fps,
      },
      details: {
        drawCalls,
        textureMemory,
      },
    };
  }

  /**
   * Get all available filter names
   */
  private async getAllFilterNames(): Promise<string[]> {
    // This would be implemented to get all filter names
    // For now, return a sample set
    return [
      'blur',
      'alpha',
      'colorMatrix',
      'displacement',
      'glow',
      'pixelate',
      'ascii',
      'crt',
      'shockwave',
      'zoomBlur',
    ];
  }

  /**
   * Generate filter combinations for testing
   */
  private getFilterCombinations(filters: string[]): string[][] {
    const combinations: string[][] = [];
    
    // Test some common 2-filter combinations
    const commonPairs = [
      ['blur', 'glow'],
      ['colorMatrix', 'blur'],
      ['displacement', 'colorMatrix'],
      ['pixelate', 'glow'],
    ];

    // Add combinations that exist in our filter list
    for (const pair of commonPairs) {
      if (pair.every((f) => filters.includes(f))) {
        combinations.push(pair);
      }
    }

    // Test a 3-filter combination
    if (filters.includes('blur') && filters.includes('glow') && filters.includes('colorMatrix')) {
      combinations.push(['blur', 'glow', 'colorMatrix']);
    }

    return combinations;
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    results: BenchmarkResult[],
    problematicFilters: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Analyze problematic filters
    for (const filterName of problematicFilters) {
      const result = results.find((r) => r.filters.join(' + ') === filterName);
      if (!result) continue;

      const { metrics, details } = result;

      if (metrics.avgFrameTime > 20) {
        recommendations.push(
          `⚠️ ${filterName}: Consider reducing quality or resolution (avg ${metrics.avgFrameTime.toFixed(1)}ms/frame)`
        );
      }

      if (details.drawCalls > 100) {
        recommendations.push(
          `📊 ${filterName}: High draw call count (${details.drawCalls}), consider batching`
        );
      }

      if (metrics.memoryUsage > 50) {
        recommendations.push(
          `💾 ${filterName}: High memory usage (${metrics.memoryUsage.toFixed(1)}MB), optimize textures`
        );
      }
    }

    // General recommendations
    if (problematicFilters.length > 5) {
      recommendations.push(
        '🔧 Consider implementing dynamic quality adjustment based on device capabilities'
      );
    }

    const avgFps = results.reduce((sum, r) => sum + r.metrics.fps, 0) / results.length;
    if (avgFps < 50) {
      recommendations.push(
        '⚡ Overall performance below target, consider reducing default filter intensity'
      );
    }

    return recommendations;
  }

  /**
   * Generate detailed benchmark report
   */
  static generateDetailedReport(report: BenchmarkReport): string {
    const lines: string[] = [];

    lines.push('📊 Filter Performance Benchmark Report');
    lines.push('='.repeat(60));
    lines.push(`⏱️  Duration: ${(report.duration / 1000).toFixed(2)}s`);
    lines.push(`🎯 Performance Target: 60 FPS`);
    lines.push(`❌ Problematic Filters: ${report.problematicFilters.length}`);
    lines.push('');

    // Summary
    const avgFps = report.results.reduce((sum, r) => sum + r.metrics.fps, 0) / report.results.length;
    lines.push('📈 Summary:');
    lines.push(`   Average FPS: ${avgFps.toFixed(1)}`);
    lines.push(`   Filters Tested: ${report.results.length}`);
    lines.push(`   Has Regression: ${report.hasRegression ? 'YES ⚠️' : 'NO ✅'}`);
    lines.push('');

    // Detailed results
    lines.push('🔍 Detailed Results:');
    lines.push('-'.repeat(60));
    
    for (const result of report.results) {
      const status = result.metrics.maintains60fps ? '✅' : '❌';
      lines.push(
        `${status} ${result.filters.join(' + ')}: ${result.metrics.fps.toFixed(1)} FPS`
      );
      lines.push(`   Frame Time: ${result.metrics.avgFrameTime.toFixed(2)}ms (max: ${result.metrics.maxFrameTime.toFixed(2)}ms)`);
      lines.push(`   Memory: ${result.metrics.memoryUsage.toFixed(1)}MB`);
      lines.push(`   Config: ${result.config.spriteCount} sprites, ${result.config.frameCount} frames`);
      lines.push('');
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      lines.push('💡 Recommendations:');
      lines.push('-'.repeat(40));
      report.recommendations.forEach((rec) => lines.push(rec));
    }

    return lines.join('\n');
  }
}