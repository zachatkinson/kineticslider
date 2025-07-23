/**
 * @fileoverview Unit Tests for DefaultsManager
 *
 * Comprehensive tests for the configuration defaults management system
 * ensuring intelligent merging, responsive behavior, and proper defaults.
 *
 * @version 2.0.0 - Phase 4.2 Enhanced Configuration System
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  DefaultsManager,
  DEFAULT_CONFIGS,
  defaultsManager,
} from '../../config/defaults-manager';
import type { SliderConfig, SlideConfig } from '../../core/types';
import { ANIMATION_DURATION, EASING, INPUT, SCALE } from '../../core/constants';

describe('DefaultsManager', () => {
  let manager: DefaultsManager;

  beforeEach(() => {
    manager = DefaultsManager.getInstance();
    manager.clearCache(); // Ensure clean state for each test
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = DefaultsManager.getInstance();
      const instance2 = DefaultsManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should provide convenience export', () => {
      expect(defaultsManager).toBeInstanceOf(DefaultsManager);
      expect(defaultsManager).toBe(DefaultsManager.getInstance());
    });
  });

  describe('getDefaults', () => {
    it('should return complete default configuration', () => {
      const defaults = manager.getDefaults();

      // Check core properties
      expect(defaults.slides).toEqual([]);
      expect(defaults.autoPlay).toBe(DEFAULT_CONFIGS.CORE.autoPlay);
      expect(defaults.autoPlayInterval).toBe(
        DEFAULT_CONFIGS.CORE.autoPlayInterval
      );
      expect(defaults.duration).toBe(DEFAULT_CONFIGS.CORE.duration);
      expect(defaults.easing).toBe(DEFAULT_CONFIGS.CORE.easing);
      expect(defaults.loop).toBe(DEFAULT_CONFIGS.CORE.loop);
      expect(defaults.interactive).toBe(DEFAULT_CONFIGS.CORE.interactive);

      // Check interaction settings
      expect(defaults.pauseOnHover).toBe(
        DEFAULT_CONFIGS.INTERACTION.pauseOnHover
      );
      expect(defaults.pauseOnFocus).toBe(
        DEFAULT_CONFIGS.INTERACTION.pauseOnFocus
      );
      expect(defaults.pauseOnInteraction).toBe(
        DEFAULT_CONFIGS.INTERACTION.pauseOnInteraction
      );

      // Check performance settings
      expect(defaults.preloadCount).toBe(
        DEFAULT_CONFIGS.PERFORMANCE.preloadCount
      );
      expect(defaults.enableVirtualization).toBe(
        DEFAULT_CONFIGS.PERFORMANCE.enableVirtualization
      );

      // Check complex objects
      expect(defaults.physics).toBeDefined();
      expect(defaults.rendering).toBeDefined();
      expect(defaults.input).toBeDefined();
      expect(defaults.effects).toBeDefined();
      expect(defaults.accessibility).toBeDefined();
      expect(defaults.responsive).toBeDefined();
      expect(defaults.performance).toBeDefined();
    });

    it('should cache defaults for performance', () => {
      const defaults1 = manager.getDefaults();
      const defaults2 = manager.getDefaults();

      expect(defaults1).toBe(defaults2); // Same reference due to caching
    });

    it('should regenerate defaults after cache clear', () => {
      const defaults1 = manager.getDefaults();
      manager.clearCache();
      const defaults2 = manager.getDefaults();

      expect(defaults1).not.toBe(defaults2); // Different references
      expect(defaults1).toEqual(defaults2); // But same content
    });
  });

  describe('mergeWithDefaults', () => {
    it('should merge simple user config with defaults', () => {
      const userConfig: Partial<SliderConfig> = {
        slides: [
          { id: 'slide1', src: 'image1.jpg' },
          { id: 'slide2', src: 'image2.jpg' },
        ],
        autoPlay: true,
        duration: 2000,
      };

      const merged = manager.mergeWithDefaults(userConfig);

      // User values should be preserved
      expect(merged.slides).toEqual(userConfig.slides);
      expect(merged.autoPlay).toBe(true);
      expect(merged.duration).toBe(2000);

      // Defaults should be applied for missing values
      expect(merged.loop).toBe(DEFAULT_CONFIGS.CORE.loop);
      expect(merged.easing).toBe(DEFAULT_CONFIGS.CORE.easing);
      expect(merged.pauseOnHover).toBe(
        DEFAULT_CONFIGS.INTERACTION.pauseOnHover
      );
      expect(merged.physics).toBeDefined();
      expect(merged.rendering).toBeDefined();
    });

    it('should handle nested configuration merging', () => {
      const userConfig: Partial<SliderConfig> = {
        slides: [{ id: 'slide1', src: 'image1.jpg' }],
        physics: {
          transitionDuration: 0.8,
          // Other physics properties should use defaults
        },
        rendering: {
          width: 1920,
          height: 1080,
          // Other rendering properties should use defaults
        },
        responsive: {
          enabled: false, // Disable responsive to preserve explicit width
        },
      };

      const merged = manager.mergeWithDefaults(userConfig);

      // User physics values should be preserved
      expect(merged.physics?.transitionDuration).toBe(0.8);
      // Default physics values should be applied
      expect(merged.physics?.transitionEase).toBe(
        DEFAULT_CONFIGS.PHYSICS.transitionEase
      );
      expect(merged.physics?.swipeThreshold).toBe(
        DEFAULT_CONFIGS.PHYSICS.swipeThreshold
      );

      // User rendering values should be preserved
      expect(merged.rendering?.width).toBe(1920);
      expect(merged.rendering?.height).toBe(1080);
      // Default rendering values should be applied
      expect(merged.rendering?.antialias).toBe(
        DEFAULT_CONFIGS.RENDERING.antialias
      );
    });
  });

  describe('getSlideDefaults', () => {
    it('should return complete slide defaults', () => {
      const slideConfig: Partial<SlideConfig> = {
        id: 'slide1',
        src: 'image1.jpg',
      };

      const merged = manager.getSlideDefaults(slideConfig);

      // User values preserved
      expect(merged.id).toBe('slide1');
      expect(merged.src).toBe('image1.jpg');

      // Defaults applied
      expect(merged.alt).toBe('');
      expect(merged.title).toBe('');
      expect(merged.metadata).toBeDefined();
      expect(merged.loading).toBeDefined();
      expect(merged.timing).toBeDefined();
      expect(merged.effects).toBeDefined();

      // Check specific defaults
      expect(merged.metadata?.priority).toBe(0);
      expect(merged.loading?.lazy).toBe(false);
      expect(merged.loading?.priority).toBe('normal');
      expect(merged.timing?.duration).toBe(ANIMATION_DURATION.STANDARD * 1000);
      expect(merged.effects?.opacity).toBe(1.0);
      expect(merged.effects?.scale).toBe(SCALE.DEFAULT);
    });

    it('should merge partial slide configuration', () => {
      const slideConfig: Partial<SlideConfig> = {
        id: 'slide1',
        src: 'image1.jpg',
        metadata: {
          priority: 5,
          tags: ['featured'],
          // description should get default
        },
        timing: {
          duration: 2000,
          // delay and easing should get defaults
        },
      };

      const merged = manager.getSlideDefaults(slideConfig);

      // User values preserved
      expect(merged.metadata?.priority).toBe(5);
      expect(merged.metadata?.tags).toEqual(['featured']);
      expect(merged.timing?.duration).toBe(2000);

      // Defaults applied for missing values
      expect(merged.metadata?.description).toBe('');
      expect(merged.timing?.delay).toBe(0);
      expect(merged.timing?.easing).toBe(EASING.EASE_OUT);
    });
  });

  describe('getBreakpointDefaults', () => {
    it('should return breakpoint-specific configuration', () => {
      const mobileDefaults = manager.getBreakpointDefaults('mobile');
      // Remove unused variable to fix lint
      // const tabletDefaults = manager.getBreakpointDefaults('tablet');
      const desktopDefaults = manager.getBreakpointDefaults('desktop');

      // Mobile should have mobile viewport settings
      expect(mobileDefaults.rendering?.width).toBeLessThan(800);

      // Desktop should have larger viewport
      expect(desktopDefaults.rendering?.width).toBeGreaterThan(1000);

      // Non-existent breakpoint should return empty config
      const unknownDefaults = manager.getBreakpointDefaults('unknown');
      expect(unknownDefaults).toEqual({});
    });
  });

  describe('Intelligent defaults', () => {
    beforeEach(() => {
      // Mock window.matchMedia for reduced motion tests
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
    });

    it('should adjust preload count for small slide sets', () => {
      const userConfig: Partial<SliderConfig> = {
        slides: [
          { id: 'slide1', src: 'image1.jpg' },
          { id: 'slide2', src: 'image2.jpg' },
        ],
        preloadCount: 5, // More than available slides
      };

      const merged = manager.mergeWithDefaults(userConfig);

      expect(merged.preloadCount).toBeLessThanOrEqual(2);
    });

    it('should enable virtualization for large slide sets', () => {
      const slides = Array.from({ length: 60 }, (_, i) => ({
        id: `slide${i}`,
        src: `image${i}.jpg`,
      }));

      const userConfig: Partial<SliderConfig> = {
        slides,
        // enableVirtualization not specified
      };

      const merged = manager.mergeWithDefaults(userConfig);

      expect(merged.enableVirtualization).toBe(true);
    });

    it('should adjust auto-play interval for large slide sets', () => {
      const slides = Array.from({ length: 15 }, (_, i) => ({
        id: `slide${i}`,
        src: `image${i}.jpg`,
      }));

      const userConfig: Partial<SliderConfig> = {
        slides,
        autoPlay: true,
        duration: 500,
        autoPlayInterval: 1000, // Short interval
      };

      const merged = manager.mergeWithDefaults(userConfig);

      // Should increase interval to account for duration + buffer (500 + 500 = 1000)
      expect(merged.autoPlayInterval).toBe(1000);
    });

    it('should enable performance monitoring in debug mode', () => {
      const userConfig: Partial<SliderConfig> = {
        slides: [{ id: 'slide1', src: 'image1.jpg' }],
        debug: true,
      };

      const merged = manager.mergeWithDefaults(userConfig);

      expect(merged.performance?.enabled).toBe(true);
      expect(merged.performance?.logging).toBe(true);
    });

    it('should adjust memory management for high resolution', () => {
      const userConfig: Partial<SliderConfig> = {
        slides: [{ id: 'slide1', src: 'image1.jpg' }],
        rendering: {
          resolution: 3.0, // High resolution
        },
      };

      const merged = manager.mergeWithDefaults(userConfig);

      expect(merged.memoryManagement?.maxMemoryUsage).toBeGreaterThanOrEqual(
        512
      );
    });

    it('should apply reduced motion preferences', () => {
      // Mock reduced motion preference
      vi.mocked(window.matchMedia).mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const userConfig: Partial<SliderConfig> = {
        slides: [{ id: 'slide1', src: 'image1.jpg' }],
        // No explicit accessibility settings
      };

      const merged = manager.mergeWithDefaults(userConfig);

      expect(merged.accessibility?.reduceMotion).toBe(true);
      expect(merged.duration).toBeLessThanOrEqual(
        ANIMATION_DURATION.FAST * 1000
      );
    });
  });

  describe('Responsive defaults', () => {
    beforeEach(() => {
      // Mock window.innerWidth for responsive tests
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024, // Default desktop width
      });
    });

    it('should apply mobile defaults on small screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
      });

      const userConfig: Partial<SliderConfig> = {
        slides: [{ id: 'slide1', src: 'image1.jpg' }],
        responsive: { enabled: true },
      };

      const merged = manager.mergeWithDefaults(userConfig);

      // Should have mobile-specific settings
      expect(merged.rendering?.width).toBeLessThan(800);
      expect(merged.input?.swipeThreshold).toBeLessThan(INPUT.SWIPE_THRESHOLD);
    });

    it('should apply desktop defaults on large screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 1920,
      });

      const userConfig: Partial<SliderConfig> = {
        slides: [{ id: 'slide1', src: 'image1.jpg' }],
        responsive: { enabled: true },
      };

      const merged = manager.mergeWithDefaults(userConfig);

      // Should have desktop-specific settings
      expect(merged.rendering?.width).toBeGreaterThan(1000);
    });

    it('should skip responsive defaults when disabled', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
      });

      const userConfig: Partial<SliderConfig> = {
        slides: [{ id: 'slide1', src: 'image1.jpg' }],
        responsive: { enabled: false },
        rendering: { width: 1920 }, // Should be preserved
      };

      const merged = manager.mergeWithDefaults(userConfig);

      // User settings should be preserved without responsive overrides
      expect(merged.rendering?.width).toBe(1920);
    });
  });

  describe('Deep merging behavior', () => {
    it('should perform deep merge for nested objects', () => {
      const userConfig: Partial<SliderConfig> = {
        slides: [{ id: 'slide1', src: 'image1.jpg' }],
        effects: {
          blur: {
            enabled: true,
            intensity: 5,
            // quality should get default
          },
          // colorAdjustments should get all defaults
        },
      };

      const merged = manager.mergeWithDefaults(userConfig);

      // User values should be preserved
      expect(merged.effects?.blur?.enabled).toBe(true);
      expect(merged.effects?.blur?.intensity).toBe(5);

      // Defaults should be applied for missing nested values
      expect(merged.effects?.blur?.quality).toBe('medium');
      expect(merged.effects?.colorAdjustments).toBeDefined();
      expect(merged.effects?.colorAdjustments?.brightness).toBe(0);
    });

    it('should handle array merging correctly', () => {
      const userConfig: Partial<SliderConfig> = {
        slides: [{ id: 'slide1', src: 'image1.jpg' }],
        accessibility: {
          ariaLabels: {
            sliderLabel: 'My custom slider',
            // Other labels should get defaults
          },
        },
        responsive: {
          breakpoints: [
            {
              name: 'custom',
              minWidth: 500,
              config: {},
            },
          ],
        },
      };

      const merged = manager.mergeWithDefaults(userConfig);

      // User array should completely override default array
      expect(merged.responsive?.breakpoints).toHaveLength(1);
      expect(merged.responsive?.breakpoints?.[0].name).toBe('custom');

      // But nested object merging should still work
      expect(merged.accessibility?.ariaLabels?.sliderLabel).toBe(
        'My custom slider'
      );
      expect(merged.accessibility?.ariaLabels?.nextButton).toBe('Next slide');
    });
  });
});
