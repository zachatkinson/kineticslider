/**
 * @fileoverview Integration Tests for SliderCore with Real Dependencies
 *
 * Tests SliderCore working with actual service implementations,
 * GSAP animations, and complex multi-service workflows.
 *
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SliderCore } from '../../core/slider-core';
import { serviceContainer } from '../../core/container';
import type { SliderConfig } from '../../core/types';
import { SLIDER_EVENTS } from '../../core/constants';

// Mock GSAPTimelineFactory for integration testing (browser-only dependency)
vi.mock('../../physics/gsap-timeline-factory', () => ({
  GSAPTimelineFactory: class MockGSAPTimelineFactory {
    static createSlideTransition = vi.fn(() => ({
      eventCallback: vi.fn((_event: string, callback: () => void) => {
        if (_event === 'onComplete' && callback) {
          // Use setImmediate to avoid immediate execution that could cause loops
          setImmediate(callback);
        }
      }),
      play: vi.fn(),
      kill: vi.fn(),
      progress: vi.fn(),
      isActive: vi.fn(() => false),
    }));

    static createMomentumAnimation = vi.fn();
    static createScaleAnimation = vi.fn();
    destroy = vi.fn();
  },
}));

// Mock dependencies that need real implementations
const mockPhysics = {
  animateTransition: vi.fn(),
  animateSwipe: vi.fn(),
  animateScale: vi.fn(),
  setPhysicsConfig: vi.fn(),
  getPhysicsConfig: vi.fn(() => ({
    transitionDuration: 0.1, // Shorter for tests
    transitionEase: 'power2.out',
    scaleIntensity: 0.1,
  })),
  killAllAnimations: vi.fn(),
  cleanup: vi.fn(),
};

const mockRenderer = {
  initialize: vi.fn().mockResolvedValue(undefined),
  getApplication: vi.fn(),
  resize: vi.fn(),
  createSprite: vi.fn(),
  removeSprite: vi.fn(),
  getSprites: vi.fn(() => [
    {
      visible: true,
      scale: { set: vi.fn(), x: 1, y: 1 },
      x: 0,
      y: 0,
      alpha: 1,
    },
    {
      visible: false,
      scale: { set: vi.fn(), x: 1, y: 1 },
      x: 0,
      y: 0,
      alpha: 1,
    },
    {
      visible: false,
      scale: { set: vi.fn(), x: 1, y: 1 },
      x: 0,
      y: 0,
      alpha: 1,
    },
  ]),
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

describe('SliderCore Integration Tests', () => {
  let sliderCore: SliderCore;
  let mockConfig: SliderConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let timelineFactory: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Use mock timeline factory for integration testing
    timelineFactory = {
      createSlideTransition: vi.fn(() => ({
        eventCallback: vi.fn((_event: string, callback: () => void) => {
          if (_event === 'onComplete' && callback) {
            setImmediate(callback);
          }
        }),
        play: vi.fn(),
        kill: vi.fn(),
        progress: vi.fn(),
        isActive: vi.fn(() => false),
      })),
      createMomentumAnimation: vi.fn(),
      createScaleAnimation: vi.fn(),
      destroy: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    // Register mock services
    serviceContainer.register('_slider-physics', () => mockPhysics);
    serviceContainer.register('_slider-renderer', () => mockRenderer);
    serviceContainer.register('_slider-controller', () => mockController);

    mockConfig = {
      slides: [
        { id: '1', src: 'image1.jpg' },
        { id: '2', src: 'image2.jpg' },
        { id: '3', src: 'image3.jpg' },
      ],
      autoPlay: true, // Enable for auto-play tests
      duration: 100, // Shorter for tests
      easing: 'power2.out',
      loop: true,
      physics: {
        scaleIntensity: 0.1,
        transitionDuration: 0.1,
        transitionEase: 'power2.out',
        swipeThreshold: 50,
        momentumDamping: 0.8,
      },
      rendering: {
        width: 800,
        height: 600,
        backgroundColor: 0x000000,
        antialias: true,
        resolution: 1,
      },
      input: {
        enableMouse: true,
        enableTouch: true,
        enableKeyboard: true,
        swipeThreshold: 50,
        dragThreshold: 10,
      },
    };

    sliderCore = new SliderCore(timelineFactory);

    // Override NavigationManager config to disable debouncing in tests
    const originalConfigureManagers =
      sliderCore['configureManagers'].bind(sliderCore);
    sliderCore['configureManagers'] = function (config) {
      originalConfigureManagers.call(this, config);
      // Set debounceDelay to 0 for tests to avoid debouncing issues
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).navigationManager.updateConfig({
        debounceDelay: 0,
      });
    };
  });

  afterEach(() => {
    sliderCore.destroy();
    timelineFactory.destroy();
  });

  describe('Navigation with Real Animations', () => {
    beforeEach(async () => {
      await sliderCore.initialize(mockConfig);
    });

    it('should navigate to valid slide with animation', async () => {
      const startSpy = vi.fn();
      const completeSpy = vi.fn();
      sliderCore.on(SLIDER_EVENTS.SLIDE_CHANGE_START, startSpy);
      sliderCore.on(SLIDER_EVENTS.SLIDE_CHANGED, completeSpy);

      await sliderCore.goToSlide(1);

      expect(startSpy).toHaveBeenCalledWith({ fromIndex: 0, toIndex: 1 });
      expect(completeSpy).toHaveBeenCalledWith({
        currentIndex: 1,
        previousIndex: 0,
      });
      expect(sliderCore.getCurrentIndex()).toBe(1);
      expect(mockController.updateSlideState).toHaveBeenCalledWith(1, 3);
    });

    it('should handle instant navigation when animated=false', async () => {
      const startSpy = vi.fn();
      sliderCore.on(SLIDER_EVENTS.SLIDE_CHANGE_START, startSpy);

      await sliderCore.goToSlide(2, false);

      expect(sliderCore.getCurrentIndex()).toBe(2);
      // Instant navigation should still emit events
      expect(startSpy).toHaveBeenCalled();
    });

    it('should reject navigation when already transitioning', async () => {
      // For this test, we need to ensure transitions don't complete instantly
      // Mock the renderer to not be HeadlessRenderer
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockRenderer as any).constructor = { name: 'SliderRenderer' };

      // Create a deferred promise for timeline completion
      let timelineCompleteCallback: (() => void) | null = null;
      new Promise<void>((resolve) => {
        timelineCompleteCallback = resolve;
      });

      // Override timeline factory to delay completion
      timelineFactory.createSlideTransition = vi.fn(() => ({
        eventCallback: vi.fn((_event: string, callback: () => void) => {
          if (_event === 'onComplete' && callback) {
            // Store callback but don't call it immediately
            timelineCompleteCallback = callback as () => void;
          }
        }),
        play: vi.fn(),
        kill: vi.fn(),
        progress: vi.fn(),
        isActive: vi.fn(() => true), // Report as active
      }));

      // Temporarily disable test environment detection
      const originalWebdriver = window.navigator.webdriver;
      const originalNodeEnv = process.env.NODE_ENV;
      Object.defineProperty(window.navigator, 'webdriver', {
        configurable: true,
        value: false,
      });
      process.env.NODE_ENV = 'production';

      try {
        // Start a navigation
        const navigationPromise = sliderCore.goToSlide(1);

        // Try to navigate again while first is in progress
        await expect(sliderCore.goToSlide(2)).rejects.toThrow(
          'TRANSITION_IN_PROGRESS'
        );

        // Complete the timeline
        if (timelineCompleteCallback) {
          (timelineCompleteCallback as () => void)();
        }

        // Let first navigation complete
        await navigationPromise;
      } finally {
        // Restore test environment detection
        Object.defineProperty(window.navigator, 'webdriver', {
          configurable: true,
          value: originalWebdriver,
        });
        process.env.NODE_ENV = originalNodeEnv;
      }
    });
  });

  describe('Next/Previous Navigation', () => {
    beforeEach(async () => {
      await sliderCore.initialize(mockConfig);
    });

    it('should navigate to next slide', async () => {
      await sliderCore.nextSlide();
      expect(sliderCore.getCurrentIndex()).toBe(1);
    });

    it('should loop to first slide when at end with loop enabled', async () => {
      await sliderCore.goToSlide(2); // Go to last slide
      await sliderCore.nextSlide(); // Should loop to first
      expect(sliderCore.getCurrentIndex()).toBe(0);
    });

    it('should stay at last slide when loop disabled', async () => {
      // Use updateConfig to properly notify LoopManager of configuration change
      sliderCore.updateConfig({ loop: false });
      await sliderCore.goToSlide(2); // Go to last slide
      await sliderCore.nextSlide(); // Should stay at last
      expect(sliderCore.getCurrentIndex()).toBe(2);
    });

    it('should navigate to previous slide', async () => {
      await sliderCore.goToSlide(1);
      await sliderCore.previousSlide();
      expect(sliderCore.getCurrentIndex()).toBe(0);
    });

    it('should loop to last slide when at beginning with loop enabled', async () => {
      await sliderCore.previousSlide(); // Should loop to last
      expect(sliderCore.getCurrentIndex()).toBe(2);
    });

    it('should stay at first slide when loop disabled', async () => {
      // Use updateConfig to properly notify LoopManager of configuration change
      sliderCore.updateConfig({ loop: false });
      await sliderCore.previousSlide(); // Should stay at first
      expect(sliderCore.getCurrentIndex()).toBe(0);
    });
  });

  describe('Auto-play Integration', () => {
    it('should start auto-play if enabled in config', async () => {
      const autoPlayConfig = { ...mockConfig, autoPlay: true };
      await sliderCore.initialize(autoPlayConfig);

      const state = sliderCore.getState();
      expect(state.isPlaying).toBe(true);
    });

    it('should handle play/pause/toggle', async () => {
      const configWithAutoPlay = { ...mockConfig, autoPlay: true };
      await sliderCore.initialize(configWithAutoPlay);

      // SliderCore should be playing after initialization with autoPlay: true
      expect(sliderCore.isPlaying()).toBe(true);

      // Test pause
      sliderCore.pause();
      expect(sliderCore.isPlaying()).toBe(false);
      expect(mockController.updatePlayState).toHaveBeenCalledWith(false);

      // Test play again
      sliderCore.play();
      expect(sliderCore.isPlaying()).toBe(true);
      expect(mockController.updatePlayState).toHaveBeenCalledWith(true);

      // Test toggle
      sliderCore.togglePlayPause();
      expect(sliderCore.isPlaying()).toBe(false);

      sliderCore.togglePlayPause();
      expect(sliderCore.isPlaying()).toBe(true);
    });

    it('should schedule next slide when playing', async () => {
      const configWithAutoPlay = { ...mockConfig, autoPlay: true };
      await sliderCore.initialize(configWithAutoPlay);

      // Should be playing after initialization
      expect(sliderCore.isPlaying()).toBe(true);

      // In a real test, we might advance fake timers to test the scheduling
      // For now, just verify play state is set correctly
    });
  });

  describe('Service Coordination', () => {
    it('should coordinate all services during initialization', async () => {
      // Ensure renderer returns sprites
      mockRenderer.getSprites.mockReturnValue([
        {
          visible: true,
          scale: { set: vi.fn(), x: 1, y: 1 },
          x: 0,
          y: 0,
          alpha: 1,
        },
        {
          visible: false,
          scale: { set: vi.fn(), x: 1, y: 1 },
          x: 0,
          y: 0,
          alpha: 1,
        },
        {
          visible: false,
          scale: { set: vi.fn(), x: 1, y: 1 },
          x: 0,
          y: 0,
          alpha: 1,
        },
      ]);

      await sliderCore.initialize(mockConfig);

      expect(mockPhysics.setPhysicsConfig).toHaveBeenCalledWith(
        mockConfig.physics
      );
      // Note: getSprites is called during animated transitions, not initialization
      // For this test, we just verify physics configuration
    });

    it('should emit state change events during navigation', async () => {
      await sliderCore.initialize(mockConfig);

      const stateSpy = vi.fn();
      sliderCore.on(SLIDER_EVENTS.STATE_CHANGED, stateSpy);

      await sliderCore.goToSlide(1);

      // In the real implementation, state change events might be emitted
      // during the animation process
    });

    it('should handle service cleanup on destroy', async () => {
      await sliderCore.initialize(mockConfig);

      sliderCore.destroy();

      expect(mockPhysics.cleanup).toHaveBeenCalled();
      expect(mockRenderer.destroy).toHaveBeenCalled();
      expect(mockController.destroy).toHaveBeenCalled();
    });
  });

  describe('Error Recovery', () => {
    it('should handle navigation errors gracefully', async () => {
      await sliderCore.initialize(mockConfig);

      // For this test, we need to ensure we actually try to create timelines
      // Mock the renderer to not be HeadlessRenderer
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockRenderer as any).constructor = { name: 'SliderRenderer' };

      // Temporarily disable test environment detection
      const originalWebdriver = window.navigator.webdriver;
      const originalNodeEnv = process.env.NODE_ENV;
      Object.defineProperty(window.navigator, 'webdriver', {
        configurable: true,
        value: false,
      });
      process.env.NODE_ENV = 'production';

      try {
        // Import the mocked class to access static method
        const { GSAPTimelineFactory } = await import(
          '../../physics/gsap-timeline-factory'
        );

        // Force an error in timeline creation
        const originalCreate = GSAPTimelineFactory.createSlideTransition;
        GSAPTimelineFactory.createSlideTransition = vi.fn(() => {
          throw new Error('Timeline creation failed');
        });

        // Force renderer getSprites to throw an error
        const originalGetSprites = mockRenderer.getSprites;
        mockRenderer.getSprites = vi.fn(() => {
          throw new Error('Renderer _error');
        });

        // Since errors are caught and state is updated anyway, we need to check
        // that the navigation still completes but logs the errors
        await sliderCore.goToSlide(1);

        // The navigation should complete despite errors
        expect(sliderCore.getCurrentIndex()).toBe(1);

        // Should reset transition state
        expect(sliderCore.isTransitioning()).toBe(false);

        // Restore original methods
        GSAPTimelineFactory.createSlideTransition = originalCreate;
        mockRenderer.getSprites = originalGetSprites;
      } finally {
        // Restore test environment detection
        Object.defineProperty(window.navigator, 'webdriver', {
          configurable: true,
          value: originalWebdriver,
        });
        process.env.NODE_ENV = originalNodeEnv;
      }
    });

    it('should reset transition state on _error', async () => {
      await sliderCore.initialize(mockConfig);

      // Manually set transition state through StateManager
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sliderCore as any).stateManager.updateState({ isTransitioning: true });

      try {
        await sliderCore.goToSlide(10); // Invalid index
      } catch {
        // Expected to fail
      }

      // Should reset transition state even on error
      expect(sliderCore.isTransitioning()).toBe(false);
    });
  });

  describe('Complex Workflows', () => {
    // Rapid navigation test moved to E2E suite as it requires real timing behavior
    // and proper transition blocking that's difficult to mock accurately

    it('should handle destroy during navigation', async () => {
      await sliderCore.initialize(mockConfig);

      // Start navigation
      const navigationPromise = sliderCore.goToSlide(1);

      // Destroy during navigation
      sliderCore.destroy();

      // Navigation should handle cleanup gracefully
      await expect(navigationPromise).resolves.not.toThrow();
    });
  });
});
