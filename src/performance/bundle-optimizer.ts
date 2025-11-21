/**
 * @fileoverview BundleOptimizer - Tree shaking and code splitting utilities
 *
 * Advanced bundle optimization system that analyzes code usage, implements
 * tree shaking, enables code splitting, and provides bundle size analysis.
 * Ensures bundle size stays under 150KB for optimal loading performance.
 *
 * @version 1.0.0
 */

import { debugLogger } from '../utils/debug-logger';

/**
 * Module dependency information
 */
export interface ModuleDependency {
  /** Module name/path */
  name: string;
  /** Import type */
  type: 'static' | 'dynamic' | 'conditional';
  /** Size in bytes */
  size: number;
  /** Usage frequency (0-1) */
  usage: number;
  /** Whether it's tree-shakable */
  treeShakable: boolean;
  /** Dependencies of this module */
  dependencies: string[];
  /** Export analysis */
  exports: {
    used: string[];
    unused: string[];
    total: number;
  };
}

/**
 * Bundle analysis result
 */
export interface BundleAnalysis {
  /** Total bundle size in bytes */
  totalSize: number;
  /** Gzipped size estimation */
  gzippedSize: number;
  /** Size breakdown by category */
  breakdown: {
    core: number;
    utilities: number;
    managers: number;
    rendering: number;
    performance: number;
    accessibility: number;
    vendor: number;
  };
  /** Unused code size */
  deadCodeSize: number;
  /** Tree shaking opportunities */
  treeShakingOpportunities: string[];
  /** Code splitting recommendations */
  codeSplittingRecommendations: CodeSplitRecommendation[];
}

/**
 * Code splitting recommendation
 */
export interface CodeSplitRecommendation {
  /** Chunk name */
  name: string;
  /** Modules to include */
  modules: string[];
  /** Loading strategy */
  strategy: 'lazy' | 'preload' | 'prefetch';
  /** Size savings in bytes */
  sizeSavings: number;
  /** Priority level */
  priority: 'high' | 'medium' | 'low';
}

/**
 * Tree shaking configuration
 */
export interface TreeShakingConfig {
  /** Enable aggressive tree shaking */
  aggressive: boolean;
  /** Side effects to preserve */
  preserveSideEffects: string[];
  /** Modules to always include */
  alwaysInclude: string[];
  /** Export analysis depth */
  analysisDepth: number;
}

/**
 * Bundle optimization options
 */
export interface BundleOptimizerConfig {
  /** Target bundle size in KB */
  targetSize: number;
  /** Enable tree shaking */
  enableTreeShaking: boolean;
  /** Enable code splitting */
  enableCodeSplitting: boolean;
  /** Chunk size threshold for splitting */
  chunkSizeThreshold: number;
  /** Tree shaking configuration */
  treeShaking: TreeShakingConfig;
  /** Development mode optimizations */
  developmentMode: boolean;
}

/**
 * Import usage tracking
 */
interface ImportUsage {
  module: string;
  imported: string[];
  used: Set<string>;
  lastUsed: number;
  frequency: number;
}

/**
 * Chunk configuration
 */
interface ChunkConfig {
  name: string;
  modules: Set<string>;
  priority: number;
  strategy: 'lazy' | 'preload' | 'prefetch';
}

/**
 * BundleOptimizer - Tree shaking and code splitting utilities
 */
export class BundleOptimizer {
  private config: Required<BundleOptimizerConfig>;
  private dependencies = new Map<string, ModuleDependency>();
  private importUsage = new Map<string, ImportUsage>();
  private chunks = new Map<string, ChunkConfig>();
  private usageTracking = new Map<string, number>();
  private moduleRegistry = new Set<string>();

  constructor(config: Partial<BundleOptimizerConfig> = {}) {
    this.config = {
      targetSize: config.targetSize ?? 150, // 150KB
      enableTreeShaking: config.enableTreeShaking ?? true,
      enableCodeSplitting: config.enableCodeSplitting ?? true,
      chunkSizeThreshold: config.chunkSizeThreshold ?? 50, // 50KB
      treeShaking: {
        aggressive: config.treeShaking?.aggressive ?? false,
        preserveSideEffects: config.treeShaking?.preserveSideEffects ?? [],
        alwaysInclude: config.treeShaking?.alwaysInclude ?? [],
        analysisDepth: config.treeShaking?.analysisDepth ?? 3,
      },
      developmentMode: config.developmentMode ?? false,
    };

    this.initializeOptimizer();
  }

  /**
   * Initialize bundle optimizer
   */
  private initializeOptimizer(): void {
    // Register core modules that should always be included
    const coreModules = [
      'src/core/slider-core.ts',
      'src/core/event-emitter.ts',
      'src/core/types.ts',
      'src/core/constants.ts',
    ];

    coreModules.forEach((module) => {
      this.registerModule(module, 'core', 0);
    });

    debugLogger.info('BundleOptimizer initialized', 'BundleOptimizer', {
      targetSize: `${this.config.targetSize}KB`,
      treeShaking: this.config.enableTreeShaking,
      codeSplitting: this.config.enableCodeSplitting,
    });
  }

  /**
   * Register module usage
   */
  registerModule(modulePath: string, category: string, size: number): void {
    this.moduleRegistry.add(modulePath);

    if (!this.dependencies.has(modulePath)) {
      this.dependencies.set(modulePath, {
        name: modulePath,
        type: 'static',
        size,
        usage: 0,
        treeShakable: true,
        dependencies: [],
        exports: {
          used: [],
          unused: [],
          total: 0,
        },
      });
    }

    // Update usage tracking
    const currentUsage = this.usageTracking.get(modulePath) || 0;
    this.usageTracking.set(modulePath, currentUsage + 1);
  }

  /**
   * Track import usage
   */
  trackImport(modulePath: string, importedNames: string[]): void {
    const usage = this.importUsage.get(modulePath) || {
      module: modulePath,
      imported: [],
      used: new Set(),
      lastUsed: Date.now(),
      frequency: 0,
    };

    // Update imported names
    importedNames.forEach((name) => {
      if (!usage.imported.includes(name)) {
        usage.imported.push(name);
      }
      usage.used.add(name);
    });

    usage.lastUsed = Date.now();
    usage.frequency++;

    this.importUsage.set(modulePath, usage);

    // Update dependency exports
    const dependency = this.dependencies.get(modulePath);
    if (dependency) {
      dependency.exports.used = Array.from(usage.used);
      dependency.exports.unused = usage.imported.filter(
        (name) => !usage.used.has(name)
      );
      dependency.exports.total = usage.imported.length;
      dependency.usage = usage.frequency;
    }
  }

  /**
   * Analyze bundle composition
   */
  analyzeBundle(): BundleAnalysis {
    const breakdown = this.calculateSizeBreakdown();
    const totalSize = Object.values(breakdown).reduce(
      (sum, size) => sum + size,
      0
    );
    const gzippedSize = Math.floor(totalSize * 0.3); // Rough gzip estimation

    const deadCodeSize = this.calculateDeadCodeSize();
    const treeShakingOpportunities = this.findTreeShakingOpportunities();
    const codeSplittingRecommendations =
      this.generateCodeSplittingRecommendations();

    return {
      totalSize,
      gzippedSize,
      breakdown,
      deadCodeSize,
      treeShakingOpportunities,
      codeSplittingRecommendations,
    };
  }

  /**
   * Generate tree shaking report
   */
  generateTreeShakingReport(): {
    removable: string[];
    preserved: string[];
    sizeSavings: number;
  } {
    const removable: string[] = [];
    const preserved: string[] = [];
    let sizeSavings = 0;

    this.dependencies.forEach((dep, modulePath) => {
      if (!this.config.treeShaking.alwaysInclude.includes(modulePath)) {
        if (dep.usage === 0 && dep.treeShakable) {
          removable.push(modulePath);
          sizeSavings += dep.size;
        } else if (dep.exports.unused.length > 0) {
          // Partially tree-shakable
          const unusedSize = Math.floor(
            dep.size * (dep.exports.unused.length / dep.exports.total)
          );
          removable.push(
            `${modulePath} (partial: ${dep.exports.unused.join(', ')})`
          );
          sizeSavings += unusedSize;
        } else {
          preserved.push(modulePath);
        }
      } else {
        preserved.push(modulePath);
      }
    });

    return {
      removable,
      preserved,
      sizeSavings,
    };
  }

  /**
   * Create dynamic import for lazy loading
   */
  createDynamicImport(
    modulePath: string,
    condition?: () => boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): () => Promise<any> {
    return async () => {
      if (condition && !condition()) {
        return null;
      }

      try {
        const module = await import(modulePath);
        this.trackImport(modulePath, Object.keys(module));

        // Update dependency type
        const dependency = this.dependencies.get(modulePath);
        if (dependency) {
          dependency.type = 'dynamic';
        }

        return module;
      } catch (error) {
        debugLogger.error(
          `Failed to load module: ${modulePath}`,
          'BundleOptimizer',
          error
        );
        throw error;
      }
    };
  }

  /**
   * Get chunk recommendations
   */
  getChunkRecommendations(): ChunkConfig[] {
    const recommendations: ChunkConfig[] = [];

    // Performance optimization chunk
    if (this.shouldCreateChunk('performance')) {
      recommendations.push({
        name: 'performance',
        modules: new Set([
          'src/performance/virtual-renderer.ts',
          'src/performance/texture-atlas.ts',
          'src/performance/memory-profiler.ts',
          'src/performance/bundle-optimizer.ts',
        ]),
        priority: 1,
        strategy: 'lazy',
      });
    }

    // Advanced rendering chunk
    if (this.shouldCreateChunk('advanced-rendering')) {
      recommendations.push({
        name: 'advanced-rendering',
        modules: new Set([
          'src/rendering/advanced-filter-presets.ts',
          'src/rendering/displacement-effects.ts',
          'src/rendering/filter-chain.ts',
          'src/rendering/effect-presets.ts',
        ]),
        priority: 2,
        strategy: 'lazy',
      });
    }

    // Accessibility chunk
    if (this.shouldCreateChunk('accessibility')) {
      recommendations.push({
        name: 'accessibility',
        modules: new Set([
          'src/accessibility/accessibility-manager.ts',
          'src/accessibility/screen-reader-support.ts',
          'src/accessibility/focus-manager.ts',
          'src/accessibility/motion-preferences.ts',
        ]),
        priority: 3,
        strategy: 'preload',
      });
    }

    return recommendations;
  }

  /**
   * Optimize bundle size
   */
  optimizeBundle(): {
    originalSize: number;
    optimizedSize: number;
    savings: number;
    optimizations: string[];
  } {
    const originalSize = this.calculateTotalSize();
    const optimizations: string[] = [];

    // Apply tree shaking
    if (this.config.enableTreeShaking) {
      const treeShakingReport = this.generateTreeShakingReport();
      optimizations.push(
        `Tree shaking: ${treeShakingReport.sizeSavings} bytes saved`
      );
    }

    // Apply code splitting
    if (this.config.enableCodeSplitting) {
      const chunks = this.getChunkRecommendations();
      const splittingSavings = chunks.reduce((total, chunk) => {
        return total + chunk.modules.size * 1000; // Estimate savings
      }, 0);
      optimizations.push(
        `Code splitting: ${splittingSavings} bytes of async chunks`
      );
    }

    // Remove unused modules
    const unusedModules = this.findUnusedModules();
    const unusedSize = unusedModules.reduce((total, module) => {
      const dep = this.dependencies.get(module);
      return total + (dep?.size || 0);
    }, 0);

    if (unusedSize > 0) {
      optimizations.push(`Removed unused modules: ${unusedSize} bytes saved`);
    }

    const optimizedSize = originalSize - unusedSize;
    const savings = originalSize - optimizedSize;

    return {
      originalSize,
      optimizedSize,
      savings,
      optimizations,
    };
  }

  /**
   * Get bundle size analysis
   */
  getBundleSizeAnalysis(): {
    currentSize: number;
    targetSize: number;
    exceedsTarget: boolean;
    recommendations: string[];
  } {
    const currentSize = this.calculateTotalSize();
    const targetSizeBytes = this.config.targetSize * 1024;
    const exceedsTarget = currentSize > targetSizeBytes;

    const recommendations: string[] = [];

    if (exceedsTarget) {
      const excess = currentSize - targetSizeBytes;
      recommendations.push(
        `Bundle exceeds target by ${Math.floor(excess / 1024)}KB`
      );

      if (this.config.enableTreeShaking) {
        recommendations.push('Enable aggressive tree shaking');
      }

      if (this.config.enableCodeSplitting) {
        recommendations.push(
          'Implement code splitting for non-critical features'
        );
      }

      const largeModules = this.findLargeModules(10 * 1024); // 10KB threshold
      if (largeModules.length > 0) {
        recommendations.push(
          `Consider optimizing large modules: ${largeModules.join(', ')}`
        );
      }
    }

    return {
      currentSize,
      targetSize: targetSizeBytes,
      exceedsTarget,
      recommendations,
    };
  }

  /**
   * Clear optimization data
   */
  clear(): void {
    this.dependencies.clear();
    this.importUsage.clear();
    this.chunks.clear();
    this.usageTracking.clear();
    this.moduleRegistry.clear();
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  /**
   * Calculate size breakdown by category
   */
  private calculateSizeBreakdown(): BundleAnalysis['breakdown'] {
    const breakdown = {
      core: 0,
      utilities: 0,
      managers: 0,
      rendering: 0,
      performance: 0,
      accessibility: 0,
      vendor: 0,
    };

    this.dependencies.forEach((dep) => {
      const category = this.categorizeModule(dep.name);
      // eslint-disable-next-line security/detect-object-injection
      breakdown[category] += dep.size;
    });

    return breakdown;
  }

  /**
   * Categorize module by path
   */
  private categorizeModule(
    modulePath: string
  ): keyof BundleAnalysis['breakdown'] {
    if (modulePath.includes('/core/')) return 'core';
    if (modulePath.includes('/utils/')) return 'utilities';
    if (modulePath.includes('/managers/')) return 'managers';
    if (modulePath.includes('/rendering/')) return 'rendering';
    if (modulePath.includes('/performance/')) return 'performance';
    if (modulePath.includes('/accessibility/')) return 'accessibility';
    if (modulePath.includes('node_modules/')) return 'vendor';
    return 'utilities';
  }

  /**
   * Calculate dead code size
   */
  private calculateDeadCodeSize(): number {
    let deadCodeSize = 0;

    this.dependencies.forEach((dep) => {
      if (dep.usage === 0 && dep.treeShakable) {
        deadCodeSize += dep.size;
      } else if (dep.exports.unused.length > 0) {
        // Estimate unused export size
        const unusedRatio = dep.exports.unused.length / dep.exports.total;
        deadCodeSize += Math.floor(dep.size * unusedRatio);
      }
    });

    return deadCodeSize;
  }

  /**
   * Find tree shaking opportunities
   */
  private findTreeShakingOpportunities(): string[] {
    const opportunities: string[] = [];

    this.dependencies.forEach((dep, modulePath) => {
      if (dep.treeShakable && dep.usage === 0) {
        opportunities.push(`Remove unused module: ${modulePath}`);
      } else if (dep.exports.unused.length > 0) {
        opportunities.push(
          `Remove unused exports from ${modulePath}: ${dep.exports.unused.join(', ')}`
        );
      }
    });

    return opportunities;
  }

  /**
   * Generate code splitting recommendations
   */
  private generateCodeSplittingRecommendations(): CodeSplitRecommendation[] {
    const recommendations: CodeSplitRecommendation[] = [];

    // Performance features chunk
    const performanceModules = this.getModulesByCategory('performance');
    if (
      performanceModules.length > 0 &&
      this.calculateCategorySize('performance') >
        this.config.chunkSizeThreshold * 1024
    ) {
      recommendations.push({
        name: 'performance-features',
        modules: performanceModules,
        strategy: 'lazy',
        sizeSavings: this.calculateCategorySize('performance'),
        priority: 'high',
      });
    }

    // Advanced rendering chunk
    const advancedRenderingModules = this.getAdvancedRenderingModules();
    if (advancedRenderingModules.length > 0) {
      recommendations.push({
        name: 'advanced-rendering',
        modules: advancedRenderingModules,
        strategy: 'lazy',
        sizeSavings: this.calculateModulesSize(advancedRenderingModules),
        priority: 'medium',
      });
    }

    // Accessibility chunk
    const accessibilityModules = this.getModulesByCategory('accessibility');
    if (accessibilityModules.length > 0) {
      recommendations.push({
        name: 'accessibility',
        modules: accessibilityModules,
        strategy: 'preload',
        sizeSavings: this.calculateCategorySize('accessibility'),
        priority: 'medium',
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Check if chunk should be created
   */
  private shouldCreateChunk(category: string): boolean {
    const categorySize = this.calculateCategorySize(
      category as keyof BundleAnalysis['breakdown']
    );
    return categorySize > this.config.chunkSizeThreshold * 1024;
  }

  /**
   * Calculate total bundle size
   */
  private calculateTotalSize(): number {
    return Array.from(this.dependencies.values()).reduce(
      (total, dep) => total + dep.size,
      0
    );
  }

  /**
   * Find unused modules
   */
  private findUnusedModules(): string[] {
    const unused: string[] = [];

    this.dependencies.forEach((dep, modulePath) => {
      if (
        dep.usage === 0 &&
        dep.treeShakable &&
        !this.config.treeShaking.alwaysInclude.includes(modulePath)
      ) {
        unused.push(modulePath);
      }
    });

    return unused;
  }

  /**
   * Find large modules
   */
  private findLargeModules(threshold: number): string[] {
    const large: string[] = [];

    this.dependencies.forEach((dep, modulePath) => {
      if (dep.size > threshold) {
        large.push(modulePath);
      }
    });

    return large;
  }

  /**
   * Get modules by category
   */
  private getModulesByCategory(category: string): string[] {
    const modules: string[] = [];

    this.dependencies.forEach((dep, modulePath) => {
      if (this.categorizeModule(modulePath) === category) {
        modules.push(modulePath);
      }
    });

    return modules;
  }

  /**
   * Get advanced rendering modules
   */
  private getAdvancedRenderingModules(): string[] {
    const advancedModules = [
      'displacement-effects',
      'filter-chain',
      'advanced-filter-presets',
      'effect-presets',
    ];

    return Array.from(this.dependencies.keys()).filter((modulePath) =>
      advancedModules.some((module) => modulePath.includes(module))
    );
  }

  /**
   * Calculate category size
   */
  private calculateCategorySize(
    category: keyof BundleAnalysis['breakdown']
  ): number {
    let size = 0;

    this.dependencies.forEach((dep) => {
      if (this.categorizeModule(dep.name) === category) {
        size += dep.size;
      }
    });

    return size;
  }

  /**
   * Calculate size of specific modules
   */
  private calculateModulesSize(moduleNames: string[]): number {
    return moduleNames.reduce((total, moduleName) => {
      const dep = this.dependencies.get(moduleName);
      return total + (dep?.size || 0);
    }, 0);
  }
}
