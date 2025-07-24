/**
 * @fileoverview Integration Tests for Configuration System and Manager Coordination
 *
 * Tests the integration between the enhanced configuration system and existing
 * managers, ensuring proper configuration propagation and manager coordination.
 *
 * @version 2.0.0 - Phase 4.2 Enhanced Configuration System
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SliderCore } from '../../core/slider-core';
import { ConfigurationSystem } from '../../config';
import { serviceContainer } from '../../core/container';
// Type imports for configuration system integration
import type { SliderConfig } from '../../core/types';
import { SLIDER_EVENTS } from '../../core/constants';

// Mock services for integration tests
const mockPhysics = {
  initialize: vi.fn(),
  animateTransition: vi.fn(),
  animateSwipe: vi.fn(),
  animateScale: vi.fn(),
  setPhysicsConfig: vi.fn(),
  getPhysicsConfig: vi.fn(() => ({
    transitionDuration: 0.3,
    transitionEase: 'power2.out',
    scaleIntensity: 0.1,
  })),
  killAllAnimations: vi.fn(),
  cleanup: vi.fn(),
};

const mockRenderer = {
  initialize: vi.fn().mockResolvedValue(undefined),
  renderSlide: vi.fn(),
  updateSlide: vi.fn(),
  preloadSlide: vi.fn(),
  createSprite: vi.fn(),
  removeSprite: vi.fn(),
  getSprites: vi.fn(() => []),
  applyFilter: vi.fn(),
  removeFilter: vi.fn(),
  clearFilters: vi.fn(),
  render: vi.fn(),
  setVisible: vi.fn(),
  destroy: vi.fn(),
};

const mockController = {
  initialize: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  setInputConfig: vi.fn(),
  getInputConfig: vi.fn(() => ({
    enableMouse: true,
    enableTouch: true,
    enableKeyboard: true,
  })),
  updateSlideState: vi.fn(),
  updatePlayState: vi.fn(),
  destroy: vi.fn(),
};

describe('Configuration System Integration', () => {
  let sliderCore: SliderCore;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();

    // Register mock services
    serviceContainer.register('_slider-physics', () => mockPhysics);
    serviceContainer.register('_slider-renderer', () => mockRenderer);
    serviceContainer.register('_slider-controller', () => mockController);

    // Create mock container
    mockContainer = document.createElement('div');
    mockContainer.style.width = '800px';
    mockContainer.style.height = '600px';
    document.body.appendChild(mockContainer);

    sliderCore = new SliderCore();

    // Clear configuration cache
    ConfigurationSystem.clearCache();
  });

  afterEach(() => {
    if (sliderCore) {
      sliderCore.destroy();
    }

    if (mockContainer.parentNode) {
      mockContainer.parentNode.removeChild(mockContainer);
    }

    // Clear service container
    serviceContainer.clear();

    vi.restoreAllMocks();
  });

  describe('SliderCore Configuration Integration', () => {
    it('should initialize with processed configuration', async () => {
      const userConfig: Partial<SliderConfig> = {
        slides: [
          { id: 'slide1', src: 'test1.jpg', alt: 'Test 1' },
          { id: 'slide2', src: 'test2.jpg', alt: 'Test 2' },
          { id: 'slide3', src: 'test3.jpg', alt: 'Test 3' },
        ],
        autoPlay: true,
        autoPlayInterval: 2000,
        duration: 500,
        loop: true,
        pauseOnHover: false,
      };

      await sliderCore.initialize(userConfig, mockContainer);

      const state = sliderCore.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.totalSlides).toBe(3);
      expect(state.currentIndex).toBe(0);

      // Should be playing due to autoPlay: true
      expect(sliderCore.isPlaying()).toBe(true);
    });

    it('should validate configuration during initialization', async () => {
      const invalidConfig: Partial<SliderConfig> = {
        // Missing slides
        duration: -500, // Invalid duration
      };

      await expect(
        sliderCore.initialize(invalidConfig, mockContainer)
      ).rejects.toThrow(/Configuration validation failed/);
    });

    it('should apply defaults for missing configuration', async () => {
      const minimalConfig: Partial<SliderConfig> = {
        slides: [{ id: 'slide1', src: 'test.jpg' }],
      };

      await sliderCore.initialize(minimalConfig, mockContainer);

      const state = sliderCore.getState();
      expect(state.isInitialized).toBe(true);

      // Should have default values applied
      expect(sliderCore.isPlaying()).toBe(false); // autoPlay defaults to false
    });

    it('should handle proper slides configuration', async () => {
      const config: Partial<SliderConfig> = {
        slides: [
          { id: 'slide1', src: 'test1.jpg' },
          { id: 'slide2', src: 'test2.jpg' },
        ],
        autoPlay: true,
      };

      await sliderCore.initialize(config, mockContainer);

      const state = sliderCore.getState();
      expect(state.totalSlides).toBe(2);
      expect(sliderCore.isPlaying()).toBe(true);
    });
  });

  describe('Manager Configuration Coordination', () => {
    beforeEach(async () => {
      const config: Partial<SliderConfig> = {
        slides: [
          { id: 'slide1', src: 'test1.jpg' },
          { id: 'slide2', src: 'test2.jpg' },
          { id: 'slide3', src: 'test3.jpg' },
        ],
      };

      await sliderCore.initialize(config, mockContainer);
    });

    it('should configure AutoPlayManager based on slider config', async () => {
      const config: Partial<SliderConfig> = {
        slides: [{ id: 'slide1', src: 'test.jpg' }],
        autoPlay: true,
        autoPlayInterval: 3000,
        pauseOnHover: false,
        pauseOnFocus: true,
        pauseOnInteraction: false,
      };

      // Use reflection to access private managers for testing
      const { asTestableSliderCore, getManagerConfig } = await import(
        '../../testing/test-interfaces'
      );
      const core = asTestableSliderCore(sliderCore);

      // Configure managers
      core.configureManagers(ConfigurationSystem.processConfig(config));

      // AutoPlayManager should be configured with user settings
      const managerConfig = getManagerConfig(core.autoPlayManager);
      expect(managerConfig.enabled).toBe(true);
      expect(managerConfig.interval).toBe(3000);
      expect(managerConfig.pauseOnHover).toBe(false);
      expect(managerConfig.pauseOnFocus).toBe(true);
      expect(managerConfig.pauseOnInteraction).toBe(false);
    });

    it('should configure LoopManager based on slider config', async () => {
      const config: Partial<SliderConfig> = {
        slides: [{ id: 'slide1', src: 'test.jpg' }],
        loop: true,
      };

      const { asTestableSliderCore, getManagerConfig } = await import(
        '../../testing/test-interfaces'
      );
      const core = asTestableSliderCore(sliderCore);

      core.configureManagers(ConfigurationSystem.processConfig(config));

      const managerConfig = getManagerConfig(core.loopManager);
      expect(managerConfig.enabled).toBe(true);
    });

    it('should configure NavigationManager based on input config', async () => {
      const config: Partial<SliderConfig> = {
        slides: [{ id: 'slide1', src: 'test.jpg' }],
        input: {
          enableKeyboard: false,
          enableMouse: true,
          enableTouch: false,
        },
      };

      const { asTestableSliderCore, getManagerConfig } = await import(
        '../../testing/test-interfaces'
      );
      const core = asTestableSliderCore(sliderCore);

      core.configureManagers(ConfigurationSystem.processConfig(config));

      const managerConfig = getManagerConfig(core.navigationManager);
      expect(managerConfig.enableKeyboard).toBe(false);
      expect(managerConfig.enableMouse).toBe(true);
      expect(managerConfig.enableTouch).toBe(false);
    });
  });

  describe('Dynamic Configuration Updates', () => {
    beforeEach(async () => {
      const initialConfig: Partial<SliderConfig> = {
        slides: [
          { id: 'slide1', src: 'test1.jpg' },
          { id: 'slide2', src: 'test2.jpg' },
          { id: 'slide3', src: 'test3.jpg' },
        ],
        autoPlay: false,
        loop: false,
      };

      await sliderCore.initialize(initialConfig, mockContainer);
    });

    it('should update configuration dynamically', () => {
      expect(sliderCore.isPlaying()).toBe(false);

      // Update configuration to enable auto-play
      sliderCore.updateConfig({
        autoPlay: true,
        autoPlayInterval: 1000,
      });

      expect(sliderCore.isPlaying()).toBe(true);
    });

    it('should validate configuration updates', () => {
      expect(() => {
        sliderCore.updateConfig({
          duration: -500, // Invalid
          preloadCount: -10, // Invalid
        });
      }).toThrow(/Configuration validation failed/);
    });

    it('should emit configuration update events', () => {
      const configUpdateSpy = vi.fn();
      sliderCore.on(SLIDER_EVENTS.CONFIG_UPDATED, configUpdateSpy);

      sliderCore.updateConfig({
        loop: true,
        duration: 800,
      });

      expect(configUpdateSpy).toHaveBeenCalledWith({
        config: expect.objectContaining({
          loop: true,
          duration: 800,
        }),
      });
    });

    it('should handle auto-play interval changes', () => {
      // Start auto-play
      sliderCore.updateConfig({ autoPlay: true, autoPlayInterval: 1000 });
      expect(sliderCore.isPlaying()).toBe(true);

      // Change interval - should restart with new interval
      sliderCore.updateConfig({ autoPlayInterval: 2000 });
      expect(sliderCore.isPlaying()).toBe(true);

      // Stop auto-play
      sliderCore.updateConfig({ autoPlay: false });
      expect(sliderCore.isPlaying()).toBe(false);
    });
  });

  describe('Event Coordination', () => {
    it('should coordinate events between managers and configuration system', async () => {
      const events: Array<{ event: string; data: unknown }> = [];

      // Listen to various events
      [
        SLIDER_EVENTS.INITIALIZED,
        SLIDER_EVENTS.STATE_CHANGED,
        SLIDER_EVENTS.CONFIG_UPDATED,
        SLIDER_EVENTS.PLAY_STARTED,
        SLIDER_EVENTS.PLAY_PAUSED,
      ].forEach((event) => {
        sliderCore.on(event, (data) => {
          events.push({ event, data });
        });
      });

      const config: Partial<SliderConfig> = {
        slides: [
          { id: 'slide1', src: 'test1.jpg' },
          { id: 'slide2', src: 'test2.jpg' },
        ],
        autoPlay: true,
      };

      await sliderCore.initialize(config, mockContainer);

      // Should have received initialization and state change events
      const initEvent = events.find(
        (e) => e.event === SLIDER_EVENTS.INITIALIZED
      );
      expect(initEvent).toBeDefined();
      expect((initEvent?.data as { totalSlides: number })?.totalSlides).toBe(2);

      const stateEvent = events.find(
        (e) => e.event === SLIDER_EVENTS.STATE_CHANGED
      );
      expect(stateEvent).toBeDefined();

      // Should have started playing due to autoPlay
      const playEvent = events.find(
        (e) => e.event === SLIDER_EVENTS.PLAY_STARTED
      );
      expect(playEvent).toBeDefined();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle configuration validation errors gracefully', async () => {
      const errorSpy = vi.fn();
      sliderCore.on(SLIDER_EVENTS.ERROR, errorSpy);

      const invalidConfig: Partial<SliderConfig> = {
        slides: [], // Empty slides array
      };

      await expect(
        sliderCore.initialize(invalidConfig, mockContainer)
      ).rejects.toThrow();

      // Should not be initialized after error
      expect(sliderCore.getState().isInitialized).toBe(false);
    });

    it('should handle runtime configuration update errors', async () => {
      const config: Partial<SliderConfig> = {
        slides: [{ id: 'slide1', src: 'test.jpg' }],
      };

      await sliderCore.initialize(config, mockContainer);

      // Try to update with invalid configuration
      expect(() => {
        sliderCore.updateConfig({
          physics: {
            transitionDuration: -1, // Invalid
          },
        });
      }).toThrow();

      // Slider should still be functional with original config
      expect(sliderCore.getState().isInitialized).toBe(true);
    });
  });

  describe('Performance Integration', () => {
    it('should handle large configuration efficiently', async () => {
      const slides = Array.from({ length: 50 }, (_, i) => ({
        id: `slide${i}`,
        src: `test${i}.jpg`,
        metadata: {
          priority: i % 10,
          tags: [`tag${i}`],
        },
      }));

      const config: Partial<SliderConfig> = {
        slides,
        preloadCount: 5,
        enableVirtualization: true,
        performance: {
          enabled: true,
          metrics: ['fps', 'memory'],
        },
      };

      const startTime = Date.now();
      await sliderCore.initialize(config, mockContainer);
      const endTime = Date.now();

      expect(sliderCore.getState().totalSlides).toBe(50);
      expect(sliderCore.getState().isInitialized).toBe(true);

      // Should initialize reasonably quickly even with many slides (allow more time in CI)
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds max
    });

    it('should apply intelligent defaults for performance optimization', async () => {
      // Large slide set should enable virtualization automatically
      const manySlides = Array.from({ length: 60 }, (_, i) => ({
        id: `slide${i}`,
        src: `test${i}.jpg`,
      }));

      const config: Partial<SliderConfig> = {
        slides: manySlides,
        // Don't specify enableVirtualization - should be auto-enabled
      };

      await sliderCore.initialize(config, mockContainer);

      // Check that intelligent defaults were applied
      const processedConfig = ConfigurationSystem.processConfig(config);
      expect(processedConfig.enableVirtualization).toBe(true);
    });
  });

  describe('Responsive Configuration Integration', () => {
    beforeEach(() => {
      // Mock window.innerWidth for responsive tests
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // Mobile width
      });
    });

    it('should apply responsive configuration overrides', async () => {
      const config: Partial<SliderConfig> = {
        slides: [{ id: 'slide1', src: 'test.jpg' }],
        rendering: {
          width: 1920, // Desktop width
          height: 1080,
        },
        responsive: {
          enabled: true,
          breakpoints: [
            {
              name: 'mobile',
              minWidth: 0,
              maxWidth: 767,
              config: {
                rendering: {
                  width: 375,
                  height: 667,
                },
                input: {
                  swipeThreshold: 40, // Reduced for mobile
                },
              },
            },
          ],
        },
      };

      await sliderCore.initialize(config, mockContainer);

      // Should have applied mobile overrides due to mocked innerWidth
      const processedConfig = ConfigurationSystem.processConfig(config);
      expect(processedConfig.rendering?.width).toBe(375);
      expect(processedConfig.rendering?.height).toBe(667);
      expect(processedConfig.input?.swipeThreshold).toBe(40);
    });
  });

  describe('Accessibility Configuration Integration', () => {
    beforeEach(() => {
      // Mock matchMedia for reduced motion tests
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

    it('should apply accessibility-based configuration adjustments', async () => {
      const config: Partial<SliderConfig> = {
        slides: [{ id: 'slide1', src: 'test.jpg' }],
        duration: 1000,
        // No explicit accessibility settings
      };

      await sliderCore.initialize(config, mockContainer);

      // Should have applied reduced motion preferences
      const processedConfig = ConfigurationSystem.processConfig(config);
      expect(processedConfig.accessibility?.reduceMotion).toBe(true);
      expect(processedConfig.duration).toBeLessThan(1000); // Reduced for accessibility
    });
  });
});
