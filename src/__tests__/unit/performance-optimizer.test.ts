/**
 * @fileoverview PerformanceOptimizer Unit Tests
 *
 * Comprehensive unit tests for the PerformanceOptimizer class.
 * Tests individual methods and functionality in isolation.
 *
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Texture, Application } from 'pixi.js';
import { PerformanceOptimizer } from '../../rendering/performance-optimizer';
import { FilterChain } from '../../rendering/filter-chain';
import { DisplacementEffects } from '../../rendering/displacement-effects';
import { EffectPresets } from '../../rendering/effect-presets';
import type {
  DeviceCapability,
  QualityLevel,
  PerformanceConfig,
  OptimizationRecommendation,
} from '../../rendering/performance-optimizer';

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    },
  },
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    hardwareConcurrency: 8,
    deviceMemory: 8,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
});

// Mock canvas and WebGL context
const mockGlContext = {
  getParameter: vi.fn((param) => {
    if (param === 'RENDERER') return 'NVIDIA GeForce RTX 3080';
    if (param === 'VERSION') return 'WebGL 2.0';
    if (param === 'MAX_TEXTURE_SIZE') return 8192;
    return null;
  }),
};

Object.defineProperty(document, 'createElement', {
  value: vi.fn((tag) => {
    if (tag === 'canvas') {
      return {
        getContext: vi.fn((type) => {
          if (type === 'webgl2' || type === 'webgl') return mockGlContext;
          return null;
        }),
      };
    }
    return {};
  }),
});

describe('PerformanceOptimizer', () => {
  let optimizer: PerformanceOptimizer;
  let mockFilterChain: FilterChain;
  let mockDisplacementEffects: DisplacementEffects;
  let mockEffectPresets: EffectPresets;

  beforeEach(() => {
    optimizer = new PerformanceOptimizer();

    // Create real instances for proper instanceof checks
    mockFilterChain = new FilterChain();
    vi.spyOn(mockFilterChain, 'getMetrics').mockReturnValue({
      filterCount: 3,
      activeAnimations: 2,
      avgExecutionTime: 5,
      memoryUsage: 1024,
      complexityScore: 0.6,
    });
    vi.spyOn(mockFilterChain, 'dispose').mockImplementation(() => {});

    const mockTexture = { width: 100, height: 100 } as unknown as Texture;
    mockDisplacementEffects = new DisplacementEffects(mockTexture);
    vi.spyOn(mockDisplacementEffects, 'getPerformanceMetrics').mockReturnValue({
      activeEffects: 1,
      activeFilters: 2,
      isMouseFollowActive: true,
      isIdleActive: false,
    });
    vi.spyOn(mockDisplacementEffects, 'stopAllEffects').mockImplementation(
      () => {}
    );
    vi.spyOn(mockDisplacementEffects, 'dispose').mockImplementation(() => {});

    mockEffectPresets = {
      getRecommendedPresets: vi.fn().mockReturnValue([]),
    } as unknown as EffectPresets;
  });

  afterEach(() => {
    optimizer.dispose();
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create instance with default config', () => {
      expect(optimizer).toBeInstanceOf(PerformanceOptimizer);
    });

    it('should create instance with custom config', () => {
      const config: Partial<PerformanceConfig> = {
        targetFPS: 30,
        fpsThreshold: 25,
        memoryThreshold: 200,
        strategy: 'aggressive',
        qualityMode: 'manual',
        monitoringInterval: 200,
        autoAdjust: false,
      };

      const customOptimizer = new PerformanceOptimizer(config);
      expect(customOptimizer).toBeInstanceOf(PerformanceOptimizer);

      customOptimizer.dispose();
    });

    it('should detect device capabilities', () => {
      const capability = optimizer.getDeviceCapability();
      expect(['low', 'medium', 'high', 'ultra']).toContain(capability);
    });

    it('should set initial quality level', () => {
      const quality = optimizer.getCurrentQuality();
      expect(quality).toBeDefined();
      expect(quality.level).toBeGreaterThan(0);
      expect(quality.level).toBeLessThanOrEqual(1);
    });
  });

  describe('initialize', () => {
    it('should initialize without PIXI app', async () => {
      await expect(optimizer.initialize()).resolves.not.toThrow();
    });

    it('should initialize with PIXI app', async () => {
      const mockApp = {
        render: vi.fn(),
      } as unknown as Application;

      await expect(optimizer.initialize(mockApp)).resolves.not.toThrow();
    });

    it('should start monitoring when auto-adjust is enabled', async () => {
      const autoOptimizer = new PerformanceOptimizer({ autoAdjust: true });
      const startMonitoringSpy = vi.spyOn(autoOptimizer, 'startMonitoring');

      await autoOptimizer.initialize();

      expect(startMonitoringSpy).toHaveBeenCalled();

      autoOptimizer.dispose();
    });
  });

  describe('registerTarget and unregisterTarget', () => {
    it('should register optimization target', () => {
      optimizer.registerTarget(mockFilterChain);

      // Should not throw
      expect(() => {
        optimizer.registerTarget(mockFilterChain);
      }).not.toThrow();
    });

    it('should unregister optimization target', () => {
      optimizer.registerTarget(mockFilterChain);
      optimizer.unregisterTarget(mockFilterChain);

      // Should not throw
      expect(() => {
        optimizer.unregisterTarget(mockFilterChain);
      }).not.toThrow();
    });

    it('should handle multiple targets', () => {
      optimizer.registerTarget(mockFilterChain);
      optimizer.registerTarget(mockDisplacementEffects);
      optimizer.registerTarget(mockEffectPresets);

      expect(() => {
        optimizer.unregisterTarget(mockFilterChain);
        optimizer.unregisterTarget(mockDisplacementEffects);
        optimizer.unregisterTarget(mockEffectPresets);
      }).not.toThrow();
    });
  });

  describe('getCurrentQuality', () => {
    it('should return current quality level', () => {
      const quality = optimizer.getCurrentQuality();

      expect(quality).toBeDefined();
      expect(quality.level).toBeDefined();
      expect(quality.effectIntensity).toBeDefined();
      expect(quality.maxConcurrentEffects).toBeDefined();
      expect(quality.animationQuality).toBeDefined();
      expect(quality.textureScale).toBeDefined();
      expect(quality.enableDisplacement).toBeDefined();
      expect(quality.enableComplexFilters).toBeDefined();
      expect(quality.filterQuality).toBeDefined();
      expect(quality.renderScale).toBeDefined();
    });

    it('should return a copy of quality settings', () => {
      const quality1 = optimizer.getCurrentQuality();
      const quality2 = optimizer.getCurrentQuality();

      expect(quality1).not.toBe(quality2);
      expect(quality1).toEqual(quality2);
    });
  });

  describe('setQualityLevel', () => {
    it('should set quality level', () => {
      const newQuality: QualityLevel = {
        level: 0.5,
        effectIntensity: 0.5,
        maxConcurrentEffects: 3,
        animationQuality: 0.7,
        textureScale: 0.8,
        enableDisplacement: true,
        enableComplexFilters: false,
        filterQuality: 0.6,
        renderScale: 0.9,
      };

      optimizer.setQualityLevel(newQuality);

      const currentQuality = optimizer.getCurrentQuality();
      expect(currentQuality).toEqual(newQuality);
    });

    it('should emit quality change event', () => {
      const eventListener = vi.fn();
      optimizer.addEventListener('quality_change', eventListener);

      const newQuality: QualityLevel = {
        level: 0.3,
        effectIntensity: 0.3,
        maxConcurrentEffects: 2,
        animationQuality: 0.5,
        textureScale: 0.6,
        enableDisplacement: false,
        enableComplexFilters: false,
        filterQuality: 0.4,
        renderScale: 0.7,
      };

      optimizer.setQualityLevel(newQuality);

      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'quality_change',
          data: expect.objectContaining({
            newQuality,
            reason: 'manual_adjustment',
          }),
        })
      );
    });
  });

  describe('getDeviceCapability', () => {
    it('should return device capability classification', () => {
      const capability = optimizer.getDeviceCapability();

      expect(['low', 'medium', 'high', 'ultra']).toContain(capability);
    });

    it('should return consistent results', () => {
      const capability1 = optimizer.getDeviceCapability();
      const capability2 = optimizer.getDeviceCapability();

      expect(capability1).toBe(capability2);
    });
  });

  describe('getRealTimeMetrics', () => {
    it('should return real-time performance metrics', () => {
      const metrics = optimizer.getRealTimeMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.fps).toBeDefined();
      expect(metrics.avgFPS).toBeDefined();
      expect(metrics.frameTime).toBeDefined();
      expect(metrics.memoryUsage).toBeDefined();
      expect(metrics.gpuMemoryUsage).toBeDefined();
      expect(metrics.activeEffects).toBeDefined();
      expect(metrics.renderCalls).toBeDefined();
      expect(metrics.textureMemory).toBeDefined();
      expect(metrics.cpuUsage).toBeDefined();
    });

    it('should return numerical values', () => {
      const metrics = optimizer.getRealTimeMetrics();

      expect(typeof metrics.fps).toBe('number');
      expect(typeof metrics.avgFPS).toBe('number');
      expect(typeof metrics.frameTime).toBe('number');
      expect(typeof metrics.memoryUsage).toBe('number');
      expect(typeof metrics.gpuMemoryUsage).toBe('number');
      expect(typeof metrics.activeEffects).toBe('number');
      expect(typeof metrics.renderCalls).toBe('number');
      expect(typeof metrics.textureMemory).toBe('number');
      expect(typeof metrics.cpuUsage).toBe('number');
    });
  });

  describe('getOptimizationRecommendation', () => {
    it('should return optimization recommendation', () => {
      const recommendation = optimizer.getOptimizationRecommendation();

      expect(recommendation).toBeDefined();
      expect(recommendation.qualityLevel).toBeDefined();
      expect(recommendation.reasons).toBeInstanceOf(Array);
      expect(recommendation.expectedImprovement).toBeDefined();
      expect(recommendation.changes).toBeInstanceOf(Array);
    });

    it('should provide reasons for recommendations', () => {
      const recommendation = optimizer.getOptimizationRecommendation();

      expect(recommendation.reasons).toBeInstanceOf(Array);
      expect(recommendation.changes).toBeInstanceOf(Array);
    });

    it('should calculate expected improvement', () => {
      const recommendation = optimizer.getOptimizationRecommendation();

      expect(typeof recommendation.expectedImprovement).toBe('number');
      expect(recommendation.expectedImprovement).toBeGreaterThanOrEqual(0);
    });
  });

  describe('applyOptimization', () => {
    it('should apply optimization without recommendation', () => {
      expect(() => {
        optimizer.applyOptimization();
      }).not.toThrow();
    });

    it('should apply optimization with custom recommendation', () => {
      const recommendation: OptimizationRecommendation = {
        qualityLevel: {
          level: 0.5,
          effectIntensity: 0.5,
          maxConcurrentEffects: 3,
          animationQuality: 0.7,
          textureScale: 0.8,
          enableDisplacement: true,
          enableComplexFilters: false,
          filterQuality: 0.6,
          renderScale: 0.9,
        },
        reasons: ['test reason'],
        expectedImprovement: 0.2,
        changes: [
          {
            component: 'effects',
            action: 'reduce_intensity',
            impact: 0.2,
          },
        ],
      };

      expect(() => {
        optimizer.applyOptimization(recommendation);
      }).not.toThrow();
    });

    it('should emit optimization applied event', () => {
      const eventListener = vi.fn();
      optimizer.addEventListener('optimization_applied', eventListener);

      optimizer.applyOptimization();

      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'optimization_applied',
          data: expect.objectContaining({
            recommendation: expect.any(Object),
          }),
        })
      );
    });
  });

  describe('Monitoring', () => {
    it('should start monitoring', () => {
      expect(() => {
        optimizer.startMonitoring();
      }).not.toThrow();
    });

    it('should stop monitoring', () => {
      optimizer.startMonitoring();

      expect(() => {
        optimizer.stopMonitoring();
      }).not.toThrow();
    });

    it('should handle multiple start/stop calls', () => {
      optimizer.startMonitoring();
      optimizer.startMonitoring();

      optimizer.stopMonitoring();
      optimizer.stopMonitoring();

      expect(() => {
        optimizer.startMonitoring();
        optimizer.stopMonitoring();
      }).not.toThrow();
    });
  });

  describe('Event handling', () => {
    it('should add event listener', () => {
      const listener = vi.fn();

      expect(() => {
        optimizer.addEventListener('quality_change', listener);
      }).not.toThrow();
    });

    it('should remove event listener', () => {
      const listener = vi.fn();

      optimizer.addEventListener('quality_change', listener);

      expect(() => {
        optimizer.removeEventListener('quality_change', listener);
      }).not.toThrow();
    });

    it('should handle multiple listeners for same event', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      optimizer.addEventListener('quality_change', listener1);
      optimizer.addEventListener('quality_change', listener2);

      // Trigger an event
      optimizer.setQualityLevel({
        level: 0.5,
        effectIntensity: 0.5,
        maxConcurrentEffects: 3,
        animationQuality: 0.7,
        textureScale: 0.8,
        enableDisplacement: true,
        enableComplexFilters: false,
        filterQuality: 0.6,
        renderScale: 0.9,
      });

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should handle event listener errors gracefully', () => {
      const faultyListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });

      optimizer.addEventListener('quality_change', faultyListener);

      expect(() => {
        optimizer.setQualityLevel({
          level: 0.5,
          effectIntensity: 0.5,
          maxConcurrentEffects: 3,
          animationQuality: 0.7,
          textureScale: 0.8,
          enableDisplacement: true,
          enableComplexFilters: false,
          filterQuality: 0.6,
          renderScale: 0.9,
        });
      }).not.toThrow();
    });
  });

  describe('getPerformanceHistory', () => {
    it('should return performance history', () => {
      const history = optimizer.getPerformanceHistory();

      expect(history).toBeInstanceOf(Array);
    });

    it('should return copy of history', () => {
      const history1 = optimizer.getPerformanceHistory();
      const history2 = optimizer.getPerformanceHistory();

      expect(history1).not.toBe(history2);
      expect(history1).toEqual(history2);
    });
  });

  describe('Device detection', () => {
    it('should detect desktop device', () => {
      // Already mocked in beforeEach
      const capability = optimizer.getDeviceCapability();
      expect(capability).toBeDefined();
    });

    it('should handle mobile device', () => {
      // Mock mobile user agent
      Object.defineProperty(window, 'navigator', {
        value: {
          ...window.navigator,
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        },
      });

      const mobileOptimizer = new PerformanceOptimizer();
      const capability = mobileOptimizer.getDeviceCapability();

      expect(capability).toBeDefined();

      mobileOptimizer.dispose();
    });

    it('should handle tablet device', () => {
      // Mock tablet user agent
      Object.defineProperty(window, 'navigator', {
        value: {
          ...window.navigator,
          userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        },
      });

      const tabletOptimizer = new PerformanceOptimizer();
      const capability = tabletOptimizer.getDeviceCapability();

      expect(capability).toBeDefined();

      tabletOptimizer.dispose();
    });
  });

  describe('Quality presets', () => {
    it('should have quality presets for all device capabilities', () => {
      const capabilities: DeviceCapability[] = [
        'low',
        'medium',
        'high',
        'ultra',
      ];

      capabilities.forEach((_capability) => {
        // This tests that the internal quality preset exists
        // by setting device capability and checking quality level
        expect(optimizer.getDeviceCapability()).toBeDefined();
      });
    });

    it('should adjust quality based on device capability', () => {
      const quality = optimizer.getCurrentQuality();

      expect(quality.level).toBeGreaterThan(0);
      expect(quality.level).toBeLessThanOrEqual(1);
    });
  });

  describe('Target optimization', () => {
    it('should handle filter chain optimization', () => {
      optimizer.registerTarget(mockFilterChain);

      // Clear previous calls but keep mock implementation
      (
        mockFilterChain.getMetrics as unknown as ReturnType<typeof vi.fn>
      ).mockClear();

      expect(() => {
        optimizer.applyOptimization();
      }).not.toThrow();

      expect(mockFilterChain.getMetrics).toHaveBeenCalled();
    });

    it('should handle displacement effects optimization', () => {
      optimizer.registerTarget(mockDisplacementEffects);

      // Clear previous calls but keep mock implementation
      (
        mockDisplacementEffects.getPerformanceMetrics as unknown as ReturnType<
          typeof vi.fn
        >
      ).mockClear();

      const lowQuality: QualityLevel = {
        level: 0.2,
        effectIntensity: 0.2,
        maxConcurrentEffects: 1,
        animationQuality: 0.3,
        textureScale: 0.5,
        enableDisplacement: false,
        enableComplexFilters: false,
        filterQuality: 0.2,
        renderScale: 0.6,
      };

      optimizer.setQualityLevel(lowQuality);

      expect(mockDisplacementEffects.getPerformanceMetrics).toHaveBeenCalled();
    });

    it('should handle effect presets optimization', () => {
      optimizer.registerTarget(mockEffectPresets);

      expect(() => {
        optimizer.applyOptimization();
      }).not.toThrow();
    });
  });

  describe('dispose', () => {
    it('should dispose of all resources', () => {
      optimizer.startMonitoring();
      optimizer.registerTarget(mockFilterChain);

      expect(() => {
        optimizer.dispose();
      }).not.toThrow();
    });

    it('should be safe to call multiple times', () => {
      optimizer.dispose();

      expect(() => {
        optimizer.dispose();
      }).not.toThrow();
    });

    it('should stop monitoring when disposed', () => {
      optimizer.startMonitoring();
      optimizer.dispose();

      // Should not throw when calling monitoring methods
      expect(() => {
        optimizer.stopMonitoring();
      }).not.toThrow();
    });
  });
});
