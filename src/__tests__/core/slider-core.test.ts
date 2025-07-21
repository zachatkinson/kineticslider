/**
 * @fileoverview Simplified Unit Tests for SliderCore
 *
 * Focuses on basic functionality without complex integration scenarios.
 * Complex navigation and timing tests are in E2E test suite.
 *
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SliderCore } from '../../core/slider-core';
import { serviceContainer } from '../../core/container';
import type { SliderConfig } from '../../core/types';
import { SLIDER_EVENTS } from '../../core/constants';

// Simple mocks for dependencies
const mockPhysics = {
  animateTransition: vi.fn(),
  animateSwipe: vi.fn(),
  animateScale: vi.fn(),
  setPhysicsConfig: vi.fn(),
  getPhysicsConfig: vi.fn(() => ({
    transitionDuration: 0.3,
    transitionEase: 'power2.out',
    scaleIntensity: 10,
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
    { scale: { set: vi.fn() }, x: 0, y: 0, alpha: 1 },
    { scale: { set: vi.fn() }, x: 0, y: 0, alpha: 1 },
    { scale: { set: vi.fn() }, x: 0, y: 0, alpha: 1 },
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

const mockTimelineFactory = {
  createSlideTransition: vi.fn(() => ({
    eventCallback: vi.fn(),
    play: vi.fn(),
    kill: vi.fn(),
  })),
  destroy: vi.fn(),
};

describe('SliderCore Simple Unit Tests', () => {
  let sliderCore: SliderCore;
  let mockConfig: SliderConfig;

  beforeEach(() => {
    vi.clearAllMocks();

    // Register mock services
    serviceContainer.register('_slider-physics', () => mockPhysics);
    serviceContainer.register('_slider-renderer', () => mockRenderer);
    serviceContainer.register('_slider-controller', () => mockController);

    mockConfig = {
      images: [
        { id: '1', src: 'image1.jpg' },
        { id: '2', src: 'image2.jpg' },
        { id: '3', src: 'image3.jpg' },
      ],
      autoPlay: false,
      duration: 3000,
      loop: true,
      physics: {
        scaleIntensity: 10,
        transitionDuration: 0.3,
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

    sliderCore = new SliderCore(mockTimelineFactory);
  });

  afterEach(() => {
    sliderCore.destroy();
  });

  describe('Basic State Management', () => {
    it('should initialize with default state', () => {
      const state = sliderCore.getState();

      expect(state.currentIndex).toBe(0);
      expect(state.totalSlides).toBe(0);
      expect(state.isPlaying).toBe(false);
      expect(state.isTransitioning).toBe(false);
      expect(state.isInitialized).toBe(false);
    });

    it('should return immutable state copies', () => {
      const state1 = sliderCore.getState();
      const state2 = sliderCore.getState();

      expect(state1).not.toBe(state2); // Different objects
      expect(state1).toEqual(state2); // Same content
    });

    it('should update state after initialization', async () => {
      await sliderCore.initialize(mockConfig);

      const state = sliderCore.getState();
      expect(state.totalSlides).toBe(3);
      expect(state.isInitialized).toBe(true);
    });
  });

  describe('Configuration Validation', () => {
    it('should reject empty images array', async () => {
      const invalidConfig = { ...mockConfig, images: [] };

      await expect(sliderCore.initialize(invalidConfig)).rejects.toThrow(
        'Images array is required and must not be empty'
      );
    });

    it('should reject invalid duration', async () => {
      const invalidConfig = { ...mockConfig, duration: 50 };

      await expect(sliderCore.initialize(invalidConfig)).rejects.toThrow(
        'Duration must be between 100ms and 10000ms'
      );
    });

    it('should reject null/undefined config', async () => {
      await expect(
        sliderCore.initialize(null as unknown as SliderConfig)
      ).rejects.toThrow();
    });
  });

  describe('Navigation Validation', () => {
    beforeEach(async () => {
      await sliderCore.initialize(mockConfig);
    });

    it('should validate slide indices', async () => {
      await expect(sliderCore.goToSlide(-1)).rejects.toThrow(
        'INVALID_SLIDE_INDEX'
      );

      await expect(sliderCore.goToSlide(5)).rejects.toThrow(
        'INVALID_SLIDE_INDEX'
      );
    });

    it('should handle same slide navigation', async () => {
      // Should resolve immediately without error
      await expect(sliderCore.goToSlide(0)).resolves.not.toThrow();
    });

    it('should validate slide index types', async () => {
      await expect(sliderCore.goToSlide(1.5)).rejects.toThrow();
    });
  });

  describe('Auto-play Configuration', () => {
    it('should respect autoPlay config', async () => {
      const autoPlayConfig = { ...mockConfig, autoPlay: true };
      await sliderCore.initialize(autoPlayConfig);

      const state = sliderCore.getState();
      expect(state.isPlaying).toBe(true);
    });

    it('should not auto-play when disabled', async () => {
      await sliderCore.initialize(mockConfig); // autoPlay: false

      const state = sliderCore.getState();
      expect(state.isPlaying).toBe(false);
    });
  });

  describe('Event Emission', () => {
    it('should emit initialization events', async () => {
      const startSpy = vi.fn();
      const completeSpy = vi.fn();

      sliderCore.on(SLIDER_EVENTS.INITIALIZATION_START, startSpy);
      sliderCore.on(SLIDER_EVENTS.INITIALIZED, completeSpy);

      await sliderCore.initialize(mockConfig);

      expect(startSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should emit escape events', () => {
      const escapeSpy = vi.fn();
      sliderCore.on(SLIDER_EVENTS.ESCAPE_PRESSED, escapeSpy);

      sliderCore.handleEscape();

      expect(escapeSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing services gracefully', async () => {
      serviceContainer.clear();

      await expect(sliderCore.initialize(mockConfig)).rejects.toThrow(
        'Failed to initialize services'
      );
    });

    it('should emit error events', async () => {
      const errorSpy = vi.fn();
      sliderCore.on(SLIDER_EVENTS.ERROR, errorSpy);

      try {
        await sliderCore.initialize(null as unknown as SliderConfig);
      } catch {
        // Expected to fail
      }

      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup services on destroy', async () => {
      await sliderCore.initialize(mockConfig);

      sliderCore.destroy();

      expect(mockPhysics.cleanup).toHaveBeenCalled();
      expect(mockRenderer.destroy).toHaveBeenCalled();
      expect(mockController.destroy).toHaveBeenCalled();
    });

    it('should reset state on destroy', () => {
      sliderCore.destroy();

      const state = sliderCore.getState();
      expect(state.isInitialized).toBe(false);
      expect(state.currentIndex).toBe(0);
      expect(state.totalSlides).toBe(0);
    });

    it('should handle destroy when not initialized', () => {
      expect(() => sliderCore.destroy()).not.toThrow();
    });
  });

  describe('Getters', () => {
    beforeEach(async () => {
      await sliderCore.initialize(mockConfig);
    });

    it('should return current index', () => {
      expect(sliderCore.getCurrentIndex()).toBe(0);
    });

    it('should return total slides', () => {
      expect(sliderCore.getTotalSlides()).toBe(3);
    });

    it('should return playing state', () => {
      expect(sliderCore.isPlaying()).toBe(false);
    });

    it('should return transition state', () => {
      expect(sliderCore.isTransitioning()).toBe(false);
    });
  });
});
