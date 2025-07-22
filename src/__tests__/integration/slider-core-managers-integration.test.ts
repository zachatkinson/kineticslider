/**
 * @fileoverview Integration tests for SliderCore with extracted managers
 *
 * Tests the coordination between SliderCore and the four extracted managers:
 * StateManager, AutoPlayManager, NavigationManager, and LoopManager.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SliderCore } from '../../core/slider-core';
import { serviceContainer } from '../../core/container';
import { SLIDER_EVENTS } from '../../core/constants';
import type { SliderConfig } from '../../core/types';

// Mock GSAPTimelineFactory for integration testing
vi.mock('../../physics/gsap-timeline-factory', () => ({
  GSAPTimelineFactory: class MockGSAPTimelineFactory {
    static createSlideTransition = vi.fn(() => ({
      eventCallback: vi.fn((_event: string, callback: () => void) => {
        if (_event === 'onComplete' && callback) {
          setImmediate(callback);
        }
      }),
      play: vi.fn(),
      kill: vi.fn(),
      progress: vi.fn(),
      isActive: vi.fn(() => false),
    }));

    createSlideTransition = vi.fn().mockReturnValue({
      eventCallback: vi.fn(),
      play: vi.fn(),
      kill: vi.fn(),
      progress: vi.fn(),
      isActive: vi.fn(() => false),
    });
  },
}));

// Mock service dependencies
const mockPhysics = {
  animateTransition: vi.fn(),
  animateSwipe: vi.fn(),
  animateScale: vi.fn(),
  setPhysicsConfig: vi.fn(),
  getPhysicsConfig: vi.fn(() => ({
    transitionDuration: 0.1,
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

describe('SliderCore - Managers Integration', () => {
  let slider: SliderCore;
  let config: SliderConfig;

  beforeEach(() => {
    vi.clearAllMocks();

    // Register mock services in the service container
    serviceContainer.register('_slider-physics', () => mockPhysics);
    serviceContainer.register('_slider-renderer', () => mockRenderer);
    serviceContainer.register('_slider-controller', () => mockController);

    slider = new SliderCore();
    config = {
      slides: [
        { id: '1', src: 'image1.jpg', alt: 'Image 1' },
        { id: '2', src: 'image2.jpg', alt: 'Image 2' },
        { id: '3', src: 'image3.jpg', alt: 'Image 3' },
        { id: '4', src: 'image4.jpg', alt: 'Image 4' },
      ],
      autoPlay: true,
      loop: true,
      duration: 100, // Shorter duration for tests
    };

    // Override NavigationManager config to disable debouncing in tests
    const originalConfigureManagers = slider['configureManagers'].bind(slider);
    slider['configureManagers'] = function (config) {
      originalConfigureManagers.call(this, config);
      // Set debounceDelay to 0 for tests to avoid debouncing issues
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).navigationManager.updateConfig({
        debounceDelay: 0,
      });
    };
  });

  afterEach(() => {
    if (slider) {
      slider.destroy();
    }
  });

  describe('StateManager Integration', () => {
    it('should manage state through StateManager', async () => {
      await slider.initialize(config);

      // Test state access
      expect(slider.getCurrentIndex()).toBe(0);
      expect(slider.getTotalSlides()).toBe(4);
      expect(slider.isTransitioning()).toBe(false);
      expect(slider.isPlaying()).toBe(true); // autoPlay is enabled

      const state = slider.getState();
      expect(state.currentIndex).toBe(0);
      expect(state.totalSlides).toBe(4);
      expect(state.isInitialized).toBe(true);
    });

    it('should emit state change events through StateManager', async () => {
      const stateChangesSpy = vi.fn();
      slider.on(SLIDER_EVENTS.STATE_CHANGED, stateChangesSpy);

      await slider.initialize(config);

      // StateManager should emit events during initialization
      expect(stateChangesSpy).toHaveBeenCalled();

      // Clear previous calls and test navigation state change
      stateChangesSpy.mockClear();
      await slider.goToSlide(1);

      expect(stateChangesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          newState: expect.objectContaining({
            currentIndex: 1,
            isTransitioning: false,
          }),
        })
      );
    });
  });

  describe('NavigationManager Integration', () => {
    beforeEach(async () => {
      await slider.initialize(config);
    });

    it('should coordinate navigation through NavigationManager', async () => {
      const navigationSpy = vi.fn();
      slider.on(SLIDER_EVENTS.NAVIGATION_REQUESTED, navigationSpy);

      await slider.goToSlide(2);

      expect(slider.getCurrentIndex()).toBe(2);
      expect(navigationSpy).toHaveBeenCalled();
    });

    it('should handle navigation validation', async () => {
      // Test invalid index navigation
      await expect(slider.goToSlide(-1)).rejects.toThrow(
        'Index -1 is out of range'
      );
      await expect(slider.goToSlide(10)).rejects.toThrow(
        'Index 10 is out of range'
      );

      // Current index should remain unchanged
      expect(slider.getCurrentIndex()).toBe(0);
    });

    it('should prevent navigation during transitions', async () => {
      // Start a navigation
      const navigation1 = slider.goToSlide(1);

      // Try to navigate again immediately (should be blocked by NavigationManager)
      await expect(slider.goToSlide(2)).rejects.toThrow(
        'Cannot navigate while transitioning'
      );

      // Wait for first navigation to complete
      await navigation1;
      expect(slider.getCurrentIndex()).toBe(1);
    });
  });

  describe('LoopManager Integration', () => {
    beforeEach(async () => {
      await slider.initialize(config);
    });

    it('should handle loop navigation through LoopManager', async () => {
      // Navigate to last slide
      await slider.goToSlide(3);
      expect(slider.getCurrentIndex()).toBe(3);

      // Next slide should loop to first (index 0) due to loop: true
      await slider.nextSlide();
      expect(slider.getCurrentIndex()).toBe(0);
    });

    it('should handle reverse loop navigation', async () => {
      // At first slide (index 0)
      expect(slider.getCurrentIndex()).toBe(0);

      // Previous slide should loop to last slide due to loop: true
      await slider.previousSlide();
      expect(slider.getCurrentIndex()).toBe(3);
    });

    it('should respect loop configuration', async () => {
      // Create slider without loop
      const noLoopSlider = new SliderCore();
      const noLoopConfig = { ...config, loop: false };

      await noLoopSlider.initialize(noLoopConfig);
      noLoopSlider.play(); // Start auto-play

      // Navigate to last slide
      await noLoopSlider.goToSlide(3);
      expect(noLoopSlider.getCurrentIndex()).toBe(3);

      // Next slide should not navigate and should pause auto-play
      await noLoopSlider.nextSlide();
      expect(noLoopSlider.getCurrentIndex()).toBe(3); // Should stay at last slide
      expect(noLoopSlider.isPlaying()).toBe(false); // Should pause auto-play

      noLoopSlider.destroy();
    });
  });

  describe('AutoPlayManager Integration', () => {
    it('should manage auto-play through AutoPlayManager', async () => {
      const playStartSpy = vi.fn();
      const playPauseSpy = vi.fn();

      slider.on(SLIDER_EVENTS.PLAY_STARTED, playStartSpy);
      slider.on(SLIDER_EVENTS.PLAY_PAUSED, playPauseSpy);

      await slider.initialize(config);

      // Auto-play should start automatically
      expect(slider.isPlaying()).toBe(true);
      expect(playStartSpy).toHaveBeenCalled();

      // Test pause
      slider.pause();
      expect(slider.isPlaying()).toBe(false);
      expect(playPauseSpy).toHaveBeenCalled();
    });

    it('should coordinate auto-play with navigation', async () => {
      await slider.initialize(config);

      expect(slider.isPlaying()).toBe(true);
      expect(slider.getCurrentIndex()).toBe(0);

      // Manual navigation should not stop auto-play
      await slider.goToSlide(2);
      expect(slider.getCurrentIndex()).toBe(2);
      expect(slider.isPlaying()).toBe(true);

      // Toggle should work
      slider.togglePlayPause();
      expect(slider.isPlaying()).toBe(false);

      slider.togglePlayPause();
      expect(slider.isPlaying()).toBe(true);
    });
  });

  describe('Manager Event Coordination', () => {
    it('should coordinate events between managers', async () => {
      const stateChangeSpy = vi.fn();
      const slideChangeSpy = vi.fn();
      const navigationSpy = vi.fn();

      slider.on(SLIDER_EVENTS.STATE_CHANGED, stateChangeSpy);
      slider.on(SLIDER_EVENTS.SLIDE_CHANGED, slideChangeSpy);
      slider.on(SLIDER_EVENTS.NAVIGATION_REQUESTED, navigationSpy);

      await slider.initialize(config);

      // Clear initialization events
      stateChangeSpy.mockClear();
      slideChangeSpy.mockClear();
      navigationSpy.mockClear();

      // Perform navigation
      await slider.goToSlide(1);

      // All relevant events should be emitted
      expect(navigationSpy).toHaveBeenCalled();
      expect(stateChangeSpy).toHaveBeenCalled();
      expect(slideChangeSpy).toHaveBeenCalledWith({
        currentIndex: 1,
        previousIndex: 0,
      });
    });

    it('should handle configuration updates across managers', async () => {
      await slider.initialize(config);

      const configSpy = vi.fn();
      slider.on(SLIDER_EVENTS.CONFIG_UPDATED, configSpy);

      // Update configuration
      slider.updateConfig({
        autoPlay: false,
        loop: false,
        duration: 2000,
      });

      expect(configSpy).toHaveBeenCalled();

      // Configuration changes should affect manager behavior
      expect(slider.isPlaying()).toBe(false); // Auto-play should be stopped
    });
  });

  describe('Manager Cleanup and Destruction', () => {
    it('should properly destroy all managers', async () => {
      await slider.initialize(config);

      const destroySpy = vi.fn();
      slider.on(SLIDER_EVENTS.DESTROYED, destroySpy);

      expect(slider.isPlaying()).toBe(true);

      // Destroy should clean up all managers
      slider.destroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(slider.isPlaying()).toBe(false);
      expect(slider.getCurrentIndex()).toBe(0);
      expect(slider.getTotalSlides()).toBe(0);
    });

    it('should handle errors gracefully across managers', async () => {
      await slider.initialize(config);

      const errorSpy = vi.fn();
      slider.on(SLIDER_EVENTS.ERROR, errorSpy);

      // Simulate error during navigation
      try {
        await slider.goToSlide(-1);
      } catch {
        // Error should be handled
      }

      expect(errorSpy).toHaveBeenCalled();
      expect(slider.isTransitioning()).toBe(false); // Should clean up transition state
    });
  });

  describe('Configuration-Driven Manager Behavior', () => {
    it('should configure managers based on slider configuration', async () => {
      const customConfig: SliderConfig = {
        slides: [
          { id: '1', src: 'image1.jpg', alt: 'Image 1' },
          { id: '2', src: 'image2.jpg', alt: 'Image 2' },
        ],
        autoPlay: false, // Disable auto-play
        loop: false, // Disable loop
        duration: 500,
      };

      await slider.initialize(customConfig);

      // AutoPlayManager should be configured to not start
      expect(slider.isPlaying()).toBe(false);

      // LoopManager should prevent looping
      await slider.goToSlide(1); // Go to last slide
      await slider.nextSlide(); // Try to go beyond

      expect(slider.getCurrentIndex()).toBe(1); // Should stay at last slide
    });
  });
});
