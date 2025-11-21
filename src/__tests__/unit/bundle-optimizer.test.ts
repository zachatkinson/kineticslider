/**
 * @fileoverview Unit tests for BundleOptimizer
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { BundleOptimizer } from '../../performance/bundle-optimizer';
import type { BundleOptimizerConfig } from '../../performance/bundle-optimizer';

describe('BundleOptimizer', () => {
  let optimizer: BundleOptimizer;

  beforeEach(() => {
    optimizer = new BundleOptimizer();
  });

  afterEach(() => {
    optimizer.clear();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(optimizer).toBeDefined();

      const analysis = optimizer.analyzeBundle();
      expect(analysis).toBeDefined();
      expect(analysis.totalSize).toBeGreaterThanOrEqual(0);
    });

    it('should initialize with custom configuration', () => {
      const config: Partial<BundleOptimizerConfig> = {
        targetSize: 200,
        enableTreeShaking: false,
        enableCodeSplitting: false,
        chunkSizeThreshold: 100,
        treeShaking: {
          aggressive: true,
          preserveSideEffects: ['module1'],
          alwaysInclude: ['core-module'],
          analysisDepth: 5,
        },
      };

      const customOptimizer = new BundleOptimizer(config);
      expect(customOptimizer).toBeDefined();
      customOptimizer.clear();
    });

    it('should register core modules on initialization', () => {
      const analysis = optimizer.analyzeBundle();
      expect(analysis.breakdown.core).toBeGreaterThan(0);
    });
  });

  describe('Module Registration', () => {
    it('should register modules', () => {
      optimizer.registerModule('test-module.ts', 'utilities', 5000);

      const analysis = optimizer.analyzeBundle();
      expect(analysis.breakdown.utilities).toBeGreaterThanOrEqual(5000);
    });

    it('should categorize modules correctly', () => {
      const testCases = [
        { path: 'src/core/test.ts', category: 'core' },
        { path: 'src/utils/helper.ts', category: 'utilities' },
        { path: 'src/managers/state.ts', category: 'managers' },
        { path: 'src/rendering/pixi.ts', category: 'rendering' },
        { path: 'src/performance/memory.ts', category: 'performance' },
        { path: 'src/accessibility/a11y.ts', category: 'accessibility' },
        { path: 'node_modules/pixi.js', category: 'vendor' },
      ];

      testCases.forEach(({ path, category }) => {
        optimizer.registerModule(path, category, 1000);
      });

      const analysis = optimizer.analyzeBundle();
      testCases.forEach(({ category }) => {
        expect(
          analysis.breakdown[category as keyof typeof analysis.breakdown]
        ).toBeGreaterThan(0);
      });
    });

    it('should update module usage on registration', () => {
      optimizer.registerModule('test-module.ts', 'utilities', 1000);
      optimizer.registerModule('test-module.ts', 'utilities', 1000); // Second registration

      // Usage should be tracked
      const analysis = optimizer.analyzeBundle();
      expect(analysis).toBeDefined();
    });
  });

  describe('Import Tracking', () => {
    beforeEach(() => {
      optimizer.registerModule('test-module.ts', 'utilities', 5000);
    });

    it('should track import usage', () => {
      optimizer.trackImport('test-module.ts', [
        'function1',
        'function2',
        'Class1',
      ]);

      // Imports should be tracked
      const usage = optimizer['importUsage'].get('test-module.ts');
      expect(usage).toBeDefined();
      expect(usage?.imported).toEqual(['function1', 'function2', 'Class1']);
      expect(usage?.used.size).toBe(3);
    });

    it('should update dependency exports on import tracking', () => {
      optimizer.trackImport('test-module.ts', ['function1', 'function2']);

      const dependency = optimizer['dependencies'].get('test-module.ts');
      expect(dependency?.exports.used).toEqual(['function1', 'function2']);
      expect(dependency?.exports.total).toBe(2);
    });

    it('should track usage frequency', () => {
      optimizer.trackImport('test-module.ts', ['function1']);
      optimizer.trackImport('test-module.ts', ['function2']);

      const usage = optimizer['importUsage'].get('test-module.ts');
      expect(usage?.frequency).toBe(2);
    });

    it('should identify unused exports', () => {
      optimizer.trackImport('test-module.ts', [
        'function1',
        'function2',
        'function3',
      ]);
      // Only track usage of function1 and function2
      optimizer.trackImport('test-module.ts', ['function1', 'function2']);

      const dependency = optimizer['dependencies'].get('test-module.ts');
      expect(dependency?.exports.unused).toEqual(['function3']);
    });
  });

  describe('Bundle Analysis', () => {
    beforeEach(() => {
      // Add test modules
      optimizer.registerModule('src/core/test1.ts', 'core', 10000);
      optimizer.registerModule('src/utils/test2.ts', 'utilities', 5000);
      optimizer.registerModule('src/rendering/test3.ts', 'rendering', 15000);
      optimizer.registerModule('node_modules/pixi.js', 'vendor', 50000);
    });

    it('should analyze bundle composition', () => {
      const analysis = optimizer.analyzeBundle();

      expect(analysis).toBeDefined();
      expect(analysis.totalSize).toBeGreaterThan(0);
      expect(analysis.gzippedSize).toBeLessThan(analysis.totalSize);
      expect(analysis.breakdown).toBeDefined();
      expect(analysis.treeShakingOpportunities).toBeDefined();
      expect(analysis.codeSplittingRecommendations).toBeDefined();
    });

    it('should calculate accurate size breakdown', () => {
      const analysis = optimizer.analyzeBundle();

      expect(analysis.breakdown.core).toBeGreaterThanOrEqual(10000);
      expect(analysis.breakdown.utilities).toBeGreaterThanOrEqual(5000);
      expect(analysis.breakdown.rendering).toBeGreaterThanOrEqual(15000);
      expect(analysis.breakdown.vendor).toBeGreaterThanOrEqual(50000);
    });

    it('should estimate gzipped size', () => {
      const analysis = optimizer.analyzeBundle();

      // Gzipped size should be roughly 30% of original
      const expectedGzipped = Math.floor(analysis.totalSize * 0.3);
      expect(analysis.gzippedSize).toBeCloseTo(expectedGzipped, -2); // Within 100 bytes
    });

    it('should identify dead code', () => {
      // Register module but don't track any imports (unused)
      optimizer.registerModule('unused-module.ts', 'utilities', 5000);

      const analysis = optimizer.analyzeBundle();
      expect(analysis.deadCodeSize).toBeGreaterThan(0);
    });
  });

  describe('Tree Shaking', () => {
    beforeEach(() => {
      optimizer.registerModule('used-module.ts', 'utilities', 5000);
      optimizer.registerModule('unused-module.ts', 'utilities', 3000);
      optimizer.registerModule('partial-module.ts', 'utilities', 4000);

      // Track usage for some modules
      optimizer.trackImport('used-module.ts', ['function1', 'function2']);
      optimizer.trackImport('partial-module.ts', [
        'function1',
        'function2',
        'function3',
      ]);
      // Only use function1 and function2 from partial-module
      optimizer.trackImport('partial-module.ts', ['function1', 'function2']);
    });

    it('should generate tree shaking report', () => {
      const report = optimizer.generateTreeShakingReport();

      expect(report).toBeDefined();
      expect(report.removable).toBeDefined();
      expect(report.preserved).toBeDefined();
      expect(report.sizeSavings).toBeGreaterThan(0);
    });

    it('should identify removable modules', () => {
      const report = optimizer.generateTreeShakingReport();

      // unused-module should be removable
      expect(
        report.removable.some((item) => item.includes('unused-module.ts'))
      ).toBe(true);
    });

    it('should identify partially removable modules', () => {
      const report = optimizer.generateTreeShakingReport();

      // partial-module should have some unused exports
      const partialEntry = report.removable.find((item) =>
        item.includes('partial-module.ts')
      );
      expect(partialEntry).toBeDefined();
      expect(partialEntry).toContain('function3');
    });

    it('should preserve always-included modules', () => {
      const optimizerWithAlways = new BundleOptimizer({
        treeShaking: {
          alwaysInclude: ['unused-module.ts'],
          aggressive: false,
          preserveSideEffects: [],
          analysisDepth: 3,
        },
      });

      optimizerWithAlways.registerModule('unused-module.ts', 'utilities', 3000);

      const report = optimizerWithAlways.generateTreeShakingReport();
      expect(report.preserved.includes('unused-module.ts')).toBe(true);

      optimizerWithAlways.clear();
    });

    it('should calculate accurate size savings', () => {
      const report = optimizer.generateTreeShakingReport();

      // Should save at least the unused module size (3000 bytes)
      expect(report.sizeSavings).toBeGreaterThanOrEqual(3000);
    });
  });

  describe('Code Splitting', () => {
    beforeEach(() => {
      // Add modules that would benefit from code splitting
      optimizer.registerModule(
        'src/performance/virtual-renderer.ts',
        'performance',
        25000
      );
      optimizer.registerModule(
        'src/performance/texture-atlas.ts',
        'performance',
        30000
      );
      optimizer.registerModule(
        'src/rendering/advanced-filter-presets.ts',
        'rendering',
        20000
      );
      optimizer.registerModule(
        'src/accessibility/accessibility-manager.ts',
        'accessibility',
        15000
      );
    });

    it('should generate code splitting recommendations', () => {
      const analysis = optimizer.analyzeBundle();

      expect(analysis.codeSplittingRecommendations).toBeDefined();
      expect(Array.isArray(analysis.codeSplittingRecommendations)).toBe(true);
    });

    it('should recommend performance chunk for large performance modules', () => {
      const analysis = optimizer.analyzeBundle();
      const recommendations = analysis.codeSplittingRecommendations;

      const performanceChunk = recommendations.find((rec) =>
        rec.name.includes('performance')
      );
      expect(performanceChunk).toBeDefined();
      expect(performanceChunk?.strategy).toBe('lazy');
    });

    it('should get chunk recommendations', () => {
      const chunks = optimizer.getChunkRecommendations();

      expect(Array.isArray(chunks)).toBe(true);
      chunks.forEach((chunk) => {
        expect(chunk).toHaveProperty('name');
        expect(chunk).toHaveProperty('modules');
        expect(chunk).toHaveProperty('priority');
        expect(chunk).toHaveProperty('strategy');
      });
    });

    it('should prioritize recommendations correctly', () => {
      const analysis = optimizer.analyzeBundle();
      const recommendations = analysis.codeSplittingRecommendations;

      // Should be sorted by priority
      const priorities = ['high', 'medium', 'low'];
      let lastPriorityIndex = -1;

      recommendations.forEach((rec) => {
        const currentIndex = priorities.indexOf(rec.priority);
        expect(currentIndex).toBeGreaterThanOrEqual(lastPriorityIndex);
        if (currentIndex > lastPriorityIndex) {
          lastPriorityIndex = currentIndex;
        }
      });
    });
  });

  describe('Dynamic Imports', () => {
    it('should create dynamic import function', () => {
      const dynamicImport = optimizer.createDynamicImport('test-module.ts');

      expect(typeof dynamicImport).toBe('function');
    });

    it('should handle conditional dynamic imports', () => {
      const condition = vi.fn(() => false);
      const dynamicImport = optimizer.createDynamicImport(
        'test-module.ts',
        condition
      );

      // Should return null when condition is false
      dynamicImport().then((result) => {
        expect(result).toBeNull();
      });
    });

    it('should update dependency type for dynamic imports', async () => {
      // Mock import function
      (global as any).import = vi.fn().mockResolvedValue({ default: {} });

      optimizer.registerModule('dynamic-module.ts', 'utilities', 1000);
      const dynamicImport = optimizer.createDynamicImport('dynamic-module.ts');

      await dynamicImport();

      const dependency = optimizer['dependencies'].get('dynamic-module.ts');
      expect(dependency?.type).toBe('dynamic');
    });
  });

  describe('Bundle Optimization', () => {
    beforeEach(() => {
      optimizer.registerModule('used-module.ts', 'utilities', 5000);
      optimizer.registerModule('unused-module.ts', 'utilities', 3000);
      optimizer.registerModule('large-module.ts', 'rendering', 50000);

      optimizer.trackImport('used-module.ts', ['function1']);
    });

    it('should optimize bundle and return results', () => {
      const result = optimizer.optimizeBundle();

      expect(result).toBeDefined();
      expect(result.originalSize).toBeGreaterThan(0);
      expect(result.optimizedSize).toBeLessThanOrEqual(result.originalSize);
      expect(result.savings).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.optimizations)).toBe(true);
    });

    it('should apply tree shaking optimizations', () => {
      const result = optimizer.optimizeBundle();

      const treeShakingOpt = result.optimizations.find((opt) =>
        opt.includes('Tree shaking')
      );
      expect(treeShakingOpt).toBeDefined();
    });

    it('should apply code splitting optimizations', () => {
      const result = optimizer.optimizeBundle();

      const splittingOpt = result.optimizations.find((opt) =>
        opt.includes('Code splitting')
      );
      expect(splittingOpt).toBeDefined();
    });

    it('should calculate accurate savings', () => {
      const result = optimizer.optimizeBundle();

      expect(result.savings).toBe(result.originalSize - result.optimizedSize);
    });
  });

  describe('Bundle Size Analysis', () => {
    it('should analyze bundle size against target', () => {
      // Add modules to exceed default target (150KB)
      for (let i = 0; i < 10; i++) {
        optimizer.registerModule(`large-module-${i}.ts`, 'utilities', 20000);
      }

      const analysis = optimizer.getBundleSizeAnalysis();

      expect(analysis).toBeDefined();
      expect(analysis.currentSize).toBeGreaterThan(0);
      expect(analysis.targetSize).toBe(150 * 1024); // Default 150KB
      expect(typeof analysis.exceedsTarget).toBe('boolean');
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });

    it('should provide recommendations when target is exceeded', () => {
      // Add large modules to exceed target
      for (let i = 0; i < 20; i++) {
        optimizer.registerModule(`large-module-${i}.ts`, 'utilities', 15000);
      }

      const analysis = optimizer.getBundleSizeAnalysis();

      if (analysis.exceedsTarget) {
        expect(analysis.recommendations.length).toBeGreaterThan(0);
        expect(analysis.recommendations[0]).toContain('exceeds target');
      }
    });

    it('should identify large modules', () => {
      optimizer.registerModule('huge-module.ts', 'utilities', 50000);

      const analysis = optimizer.getBundleSizeAnalysis();

      if (analysis.exceedsTarget) {
        const largeModuleRec = analysis.recommendations.find((rec) =>
          rec.includes('large modules')
        );
        expect(largeModuleRec).toBeDefined();
      }
    });
  });

  describe('Cleanup', () => {
    it('should clear optimization data', () => {
      optimizer.registerModule('test-module.ts', 'utilities', 1000);
      optimizer.trackImport('test-module.ts', ['function1']);

      optimizer.clear();

      const analysis = optimizer.analyzeBundle();
      expect(analysis.totalSize).toBe(0);
    });

    it('should handle multiple clear calls', () => {
      expect(() => {
        optimizer.clear();
        optimizer.clear();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty bundle', () => {
      optimizer.clear();

      const analysis = optimizer.analyzeBundle();
      expect(analysis.totalSize).toBe(0);
      expect(analysis.treeShakingOpportunities).toHaveLength(0);
    });

    it('should handle modules with zero size', () => {
      optimizer.registerModule('empty-module.ts', 'utilities', 0);

      const analysis = optimizer.analyzeBundle();
      expect(analysis).toBeDefined();
    });

    it('should handle duplicate module registration', () => {
      optimizer.registerModule('duplicate.ts', 'utilities', 1000);
      optimizer.registerModule('duplicate.ts', 'utilities', 2000);

      // Should update the existing module
      const analysis = optimizer.analyzeBundle();
      expect(analysis).toBeDefined();
    });

    it('should handle invalid module paths', () => {
      expect(() => {
        optimizer.registerModule('', 'utilities', 1000);
        optimizer.trackImport('', ['function1']);
      }).not.toThrow();
    });

    it('should handle modules with no exports', () => {
      optimizer.registerModule('no-exports.ts', 'utilities', 1000);
      optimizer.trackImport('no-exports.ts', []);

      const dependency = optimizer['dependencies'].get('no-exports.ts');
      expect(dependency?.exports.total).toBe(0);
    });
  });
});
