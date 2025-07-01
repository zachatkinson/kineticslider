/**
 * @fileoverview SliderEngine Core Tests
 *
 * Unit tests for the main SliderEngine orchestrator that coordinates
 * all slider functionality including state management, service coordination,
 * navigation logic, and event handling.
 */

import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { SliderEngine } from '../../core/engine';
import { serviceContainer, SERVICE_KEYS } from '../../core/container';
import {
  createMockService,
  cleanupServiceContainer,
} from '../utils/test-factories';
import {
  SLIDER_EVENTS,
  TEST_CONFIG,
  INPUT,
  DEFAULT_RENDER_CONFIG,
} from '../../core';
import type {
  SliderConfig,
  ISliderPhysics,
  ISliderRenderer,
  ISliderController,
  EventEmitter,
} from '../../core/types';

describe('SliderEngine', () => {
  let engine: SliderEngine;
  let mockPhysics: ISliderPhysics;
  let mockRenderer: ISliderRenderer;
  let mockController: ISliderController;
  let mockEventEmitter: EventEmitter;
  let mockConfig: SliderConfig;

  beforeEach(() => {
    // Clean up container
    cleanupServiceContainer();

    // Create mock services
    mockPhysics = {
      setPhysicsConfig: vi.fn(),
      animateTransition: vi.fn().mockReturnValue({
        call: vi.fn().mockImplementation((callback) => callback()),
      }),
      animateScale: vi.fn(),
      killAllAnimations: vi.fn(),
      cleanup: vi.fn(),
    } as unknown as ISliderPhysics;

    mockRenderer = {
      getSprites: vi
        .fn()
        .mockReturnValue([
          createMockService('sprite1'),
          createMockService('sprite2'),
          createMockService('sprite3'),
        ]),
      setVisible: vi.fn(),
      destroy: vi.fn(),
    } as unknown as ISliderRenderer;

    mockController = {
      setInputConfig: vi.fn(),
      initialize: vi.fn(),
      destroy: vi.fn(),
      updateSlideState: vi.fn(),
      updatePlayState: vi.fn(),
    } as unknown as ISliderController;

    mockEventEmitter = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      removeAllListeners: vi.fn(),
    } as unknown as EventEmitter;

    // Register mock services
    serviceContainer.register(SERVICE_KEYS.PHYSICS, () => mockPhysics);
    serviceContainer.register(SERVICE_KEYS.RENDERER, () => mockRenderer);
    serviceContainer.register(SERVICE_KEYS.CONTROLLER, () => mockController);
    serviceContainer.register(
      SERVICE_KEYS.EVENT_EMITTER,
      () => mockEventEmitter
    );

    // Create test config
    mockConfig = {
      images: ['image1.jpg', 'image2.jpg', 'image3.jpg'],
      physics: {
        transitionDuration: TEST_CONFIG.DURATION.STANDARD,
        transitionEase: 'power2.out',
        swipeThreshold: TEST_CONFIG.SWIPE.THRESHOLD,
        scaleIntensity: TEST_CONFIG.SCALE_INTENSITY.MEDIUM,
        momentumDamping: TEST_CONFIG.DAMPING.MEDIUM,
      },
      rendering: DEFAULT_RENDER_CONFIG,
      input: {
        enableMouse: true,
        enableTouch: true,
        enableKeyboard: true,
        swipeThreshold: TEST_CONFIG.SWIPE.THRESHOLD,
        dragThreshold: INPUT.DRAG_THRESHOLD,
      },
    };

    engine = new SliderEngine();
  });

  afterEach(() => {
    cleanupServiceContainer();
  });

  describe('Initialization', () => {
    it('should initialize successfully with valid config', async () => {
      await engine.initialize(mockConfig);

      const state = engine.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.loadingProgress).toBe(100);
      expect(state.totalSlides).toBe(3);
      expect(state.currentIndex).toBe(0);

      // Verify services were configured
      expect(mockPhysics.setPhysicsConfig).toHaveBeenCalledWith(
        mockConfig.physics
      );
      expect(mockController.setInputConfig).toHaveBeenCalledWith(
        mockConfig.input
      );
      expect(mockController.initialize).toHaveBeenCalled();

      // Verify initialization event was emitted
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        SLIDER_EVENTS.INITIALIZED,
        expect.objectContaining({ isInitialized: true })
      );
    });

    it('should handle initialization errors gracefully', async () => {
      // Make physics throw an error
      vi.mocked(mockPhysics.setPhysicsConfig).mockImplementation(() => {
        throw new Error('Physics configuration failed');
      });

      await expect(engine.initialize(mockConfig)).rejects.toThrow(
        /Failed to initialize slider engine:/
      );

      const state = engine.getState();
      expect(state.isInitialized).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should set loading progress during initialization', async () => {
      const capturedStates: unknown[] = [];

      // Capture state changes during initialization
      vi.mocked(mockEventEmitter.emit).mockImplementation((event, data) => {
        if (
          event === SLIDER_EVENTS.STATE_CHANGED &&
          data &&
          typeof data === 'object' &&
          'current' in data
        ) {
          capturedStates.push((data as { current: unknown }).current);
        }
      });

      await engine.initialize(mockConfig);

      // Verify loading progress was updated
      const loadingStates = capturedStates.filter(
        (state) =>
          state &&
          typeof state === 'object' &&
          'isLoading' in state &&
          (state as { isLoading: boolean }).isLoading
      );
      expect(loadingStates.length).toBeGreaterThan(0);
      expect(
        loadingStates.some(
          (state) =>
            state &&
            typeof state === 'object' &&
            'loadingProgress' in state &&
            (state as { loadingProgress: number }).loadingProgress > 0
        )
      ).toBe(true);
    });
  });

  describe('Navigation', () => {
    beforeEach(async () => {
      await engine.initialize(mockConfig);
    });

    it('should navigate to specific slide', async () => {
      await engine.goToSlide(1);

      expect(engine.getCurrentIndex()).toBe(1);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        SLIDER_EVENTS.SLIDE_CHANGE_START,
        { from: 0, to: 1 }
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        SLIDER_EVENTS.SLIDE_CHANGED,
        { from: 0, to: 1 }
      );
    });

    it('should use physics for animated transitions', async () => {
      await engine.goToSlide(2, true);

      expect(mockPhysics.animateTransition).toHaveBeenCalledWith(
        0,
        2,
        expect.any(Array)
      );
    });

    it('should skip animation for instant transitions', async () => {
      await engine.goToSlide(2, false);

      expect(mockPhysics.animateTransition).not.toHaveBeenCalled();
      expect(mockRenderer.setVisible).toHaveBeenCalled();
    });

    it('should reject invalid slide indices', async () => {
      await engine.goToSlide(-1);
      expect(engine.getCurrentIndex()).toBe(0); // Should not change

      await engine.goToSlide(10);
      expect(engine.getCurrentIndex()).toBe(0); // Should not change
    });

    it('should prevent navigation during transitions', async () => {
      // Mock a slow transition
      // @ts-expect-error - Mock object for testing timeline behavior
      vi.mocked(mockPhysics.animateTransition).mockReturnValue({
        call: vi.fn().mockImplementation((callback) => {
          setTimeout(callback, 100); // Simulate async animation
        }),
      });

      const promise1 = engine.goToSlide(1);
      const promise2 = engine.goToSlide(2); // Should be ignored

      await promise1;
      await promise2;

      expect(engine.getCurrentIndex()).toBe(1); // Should only go to first target
    });

    it('should navigate to next slide with wraparound', async () => {
      // Navigate to last slide
      await engine.goToSlide(2);
      expect(engine.getCurrentIndex()).toBe(2);

      // Next should wrap to first
      await engine.nextSlide();
      expect(engine.getCurrentIndex()).toBe(0);
    });

    it('should navigate to previous slide with wraparound', async () => {
      // At first slide, previous should wrap to last
      await engine.previousSlide();
      expect(engine.getCurrentIndex()).toBe(2);
    });

    it('should update accessibility state during navigation', async () => {
      await engine.goToSlide(1);

      // Verify that the controller's accessibility methods were called
      expect(mockController.updateSlideState).toHaveBeenCalledWith(1, 3);
    });

    it('should update accessibility state during next/previous navigation', async () => {
      await engine.nextSlide();

      expect(mockController.updateSlideState).toHaveBeenCalledWith(1, 3);

      await engine.previousSlide();

      expect(mockController.updateSlideState).toHaveBeenCalledWith(0, 3);
    });

    it('should handle navigation errors gracefully', async () => {
      // Make physics throw an error
      vi.mocked(mockPhysics.animateTransition).mockImplementation(() => {
        throw new Error('Animation transition failed');
      });

      await expect(engine.goToSlide(1)).rejects.toThrow(
        /Failed to navigate to slide 1:/
      );

      const state = engine.getState();
      expect(state.isTransitioning).toBe(false);
    });
  });

  describe('State Management', () => {
    beforeEach(async () => {
      await engine.initialize(mockConfig);
    });

    it('should return current state', () => {
      const state = engine.getState();

      expect(state).toEqual({
        currentIndex: 0,
        isTransitioning: false,
        isInitialized: true,
        totalSlides: 3,
        isLoading: false,
        loadingProgress: 100,
        isPlaying: false,
      });
    });

    it('should return current index', () => {
      expect(engine.getCurrentIndex()).toBe(0);
    });

    it('should return total slides', () => {
      expect(engine.getTotalSlides()).toBe(3);
    });

    it('should return transition status', () => {
      expect(engine.isTransitioning()).toBe(false);
    });

    it('should emit state change events', async () => {
      await engine.goToSlide(1);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        SLIDER_EVENTS.STATE_CHANGED,
        expect.objectContaining({
          previous: expect.objectContaining({ currentIndex: 0 }),
          current: expect.objectContaining({ currentIndex: 1 }),
        })
      );
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      await engine.initialize(mockConfig);
    });

    it('should subscribe to events', () => {
      const callback = vi.fn();
      engine.on('test-event', callback);

      expect(mockEventEmitter.on).toHaveBeenCalledWith('test-event', callback);
    });

    it('should unsubscribe from events', () => {
      const callback = vi.fn();
      engine.off('test-event', callback);

      expect(mockEventEmitter.off).toHaveBeenCalledWith('test-event', callback);
    });

    it('should emit events', () => {
      engine.emit('test-event', 'test-data');

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'test-event',
        'test-data'
      );
    });
  });

  describe('Drag Interactions', () => {
    beforeEach(async () => {
      await engine.initialize(mockConfig);
    });

    it('should handle drag start events', () => {
      // Simulate drag start through input callbacks
      const inputCallbacks = vi.mocked(mockController.initialize).mock
        .calls[0][1];
      inputCallbacks.onDragStart(100, 200);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        SLIDER_EVENTS.DRAG_START,
        { x: 100, y: 200 }
      );
    });

    it('should apply scale effect during drag move', () => {
      const inputCallbacks = vi.mocked(mockController.initialize).mock
        .calls[0][1];
      inputCallbacks.onDragMove(150, 250, 50, 50);

      expect(mockPhysics.animateScale).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        SLIDER_EVENTS.DRAG_MOVE,
        { x: 150, y: 250, deltaX: 50, deltaY: 50 }
      );
    });

    it('should reset scale on drag end', () => {
      const inputCallbacks = vi.mocked(mockController.initialize).mock
        .calls[0][1];
      inputCallbacks.onDragEnd(120, 220);

      expect(mockPhysics.animateScale).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        SLIDER_EVENTS.DRAG_END,
        { x: 120, y: 220 }
      );
    });
  });

  describe('Input Callbacks', () => {
    beforeEach(async () => {
      await engine.initialize(mockConfig);
    });

    it('should handle swipe left input', async () => {
      const inputCallbacks = vi.mocked(mockController.initialize).mock
        .calls[0][1];
      await inputCallbacks.onSwipeLeft();

      expect(engine.getCurrentIndex()).toBe(1); // Next slide
    });

    it('should handle swipe right input', async () => {
      // Move to slide 1 first
      await engine.goToSlide(1);

      const inputCallbacks = vi.mocked(mockController.initialize).mock
        .calls[0][1];
      await inputCallbacks.onSwipeRight();

      expect(engine.getCurrentIndex()).toBe(0); // Previous slide
    });

    it('should handle keyboard left input', async () => {
      const inputCallbacks = vi.mocked(mockController.initialize).mock
        .calls[0][1];
      await inputCallbacks.onKeyLeft();

      expect(engine.getCurrentIndex()).toBe(2); // Previous slide (wrapped)
    });

    it('should handle keyboard right input', async () => {
      const inputCallbacks = vi.mocked(mockController.initialize).mock
        .calls[0][1];
      await inputCallbacks.onKeyRight();

      expect(engine.getCurrentIndex()).toBe(1); // Next slide
    });
  });

  describe('Cleanup and Destruction', () => {
    beforeEach(async () => {
      await engine.initialize(mockConfig);
    });

    it('should destroy all services and reset state', () => {
      engine.destroy();

      expect(mockPhysics.killAllAnimations).toHaveBeenCalled();
      expect(mockRenderer.destroy).toHaveBeenCalled();
      expect(mockController.destroy).toHaveBeenCalled();
      expect(mockPhysics.cleanup).toHaveBeenCalled();

      const state = engine.getState();
      expect(state.isInitialized).toBe(false);
      expect(state.currentIndex).toBe(0);
      expect(state.totalSlides).toBe(0);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        SLIDER_EVENTS.DESTROYED
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty image array', async () => {
      const emptyConfig = { ...mockConfig, images: [] };
      await engine.initialize(emptyConfig);

      const state = engine.getState();
      expect(state.totalSlides).toBe(0);
      expect(state.isInitialized).toBe(true);
    });

    it('should handle navigation before initialization', async () => {
      await engine.goToSlide(1);

      // Should not navigate
      expect(engine.getCurrentIndex()).toBe(0);
    });

    it('should handle missing services gracefully', async () => {
      // Clear container to simulate missing services
      cleanupServiceContainer();

      await expect(engine.initialize(mockConfig)).rejects.toThrow();
    });
  });
});
