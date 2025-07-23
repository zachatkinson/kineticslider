/**
 * @fileoverview Pure Unit Tests for SliderCore Logic
 *
 * Tests SliderCore's core logic in isolation without external dependencies.
 * Complex integration scenarios are tested in integration tests.
 *
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SliderCore } from '../../core/slider-core';
import { serviceContainer } from '../../core/container';
import type { SliderConfig } from '../../core/types';
import { SLIDER_EVENTS } from '../../core/constants';

// Minimal mocks for dependencies
type MockService = Record<string, ReturnType<typeof vi.fn>>;
const createMockService = (methods: string[]): MockService => {
  const mock: MockService = {};
  methods.forEach((method) => {
    mock[method] = vi.fn();
  });
  return mock;
};

const mockPhysics = createMockService([
  'animateTransition',
  'cleanup',
  'setPhysicsConfig',
]);
const mockRenderer = createMockService(['initialize', 'getSprites', 'destroy']);
const mockController = createMockService([
  'initialize',
  'updateSlideState',
  'updatePlayState',
  'destroy',
]);

// Simple timeline factory that resolves immediately
const mockTimelineFactory = {
  createSlideTransition: vi.fn(() => ({
    eventCallback: vi.fn(),
    play: vi.fn(),
    kill: vi.fn(),
  })),
  destroy: vi.fn(),
};

describe('SliderCore Unit Tests', () => {
  let sliderCore: SliderCore;
  let mockConfig: SliderConfig;

  beforeEach(() => {
    vi.clearAllMocks();

    // Register minimal mock services
    serviceContainer.register('_slider-physics', () => mockPhysics);
    serviceContainer.register('_slider-renderer', () => mockRenderer);
    serviceContainer.register('_slider-controller', () => mockController);

    mockConfig = {
      slides: [
        { id: '1', src: 'image1.jpg' },
        { id: '2', src: 'image2.jpg' },
        { id: '3', src: 'image3.jpg' },
      ],
      autoPlay: false,
      duration: 3000,
      loop: true,
      physics: { scaleIntensity: 0.1 },
      rendering: {},
      input: {},
    };

    sliderCore = new SliderCore(mockTimelineFactory);
  });

  afterEach(() => {
    sliderCore.destroy();
  });

  describe('State Management', () => {
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
      mockRenderer.initialize.mockResolvedValue(undefined);
      mockRenderer.getSprites.mockReturnValue([{}, {}, {}]);

      await sliderCore.initialize(mockConfig);

      const state = sliderCore.getState();
      expect(state.totalSlides).toBe(3);
      expect(state.isInitialized).toBe(true);
    });
  });

  describe('Configuration Validation', () => {
    it('should reject empty slides array', async () => {
      const invalidConfig = { ...mockConfig, slides: [] };

      await expect(sliderCore.initialize(invalidConfig)).rejects.toThrow(
        'Configuration validation failed'
      );
    });

    it('should reject invalid duration', async () => {
      const invalidConfig = { ...mockConfig, duration: -100 };

      await expect(sliderCore.initialize(invalidConfig)).rejects.toThrow(
        'Configuration validation failed'
      );
    });

    it('should reject null/undefined slides', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invalidConfig = { ...mockConfig, slides: null as any };

      await expect(sliderCore.initialize(invalidConfig)).rejects.toThrow();
    });
  });

  describe('Navigation Logic', () => {
    beforeEach(async () => {
      mockRenderer.initialize.mockResolvedValue(undefined);
      mockRenderer.getSprites.mockReturnValue([{}, {}, {}]);
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

    it('should handle transition blocking', async () => {
      // Set transition state through StateManager to test blocking
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sliderCore as any).stateManager.updateState({ isTransitioning: true });

      await expect(sliderCore.goToSlide(1)).rejects.toThrow(
        'TRANSITION_IN_PROGRESS'
      );
    });
  });

  describe('Event Emission', () => {
    it('should emit initialization events', async () => {
      const startSpy = vi.fn();
      const completeSpy = vi.fn();

      sliderCore.on(SLIDER_EVENTS.INITIALIZATION_START, startSpy);
      sliderCore.on(SLIDER_EVENTS.INITIALIZED, completeSpy);

      mockRenderer.initialize.mockResolvedValue(undefined);
      mockRenderer.getSprites.mockReturnValue([{}, {}, {}]);

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
    it('should handle missing services', async () => {
      serviceContainer.clear();

      await expect(sliderCore.initialize(mockConfig)).rejects.toThrow(
        "Service '_slider-controller' not found"
      );
    });

    it('should handle physics configuration errors', async () => {
      mockPhysics.setPhysicsConfig.mockImplementation(() => {
        throw new Error('Physics config error');
      });

      await expect(sliderCore.initialize(mockConfig)).rejects.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup services on destroy', async () => {
      // Initialize first so services are available for cleanup
      mockRenderer.initialize.mockResolvedValue(undefined);
      mockRenderer.getSprites.mockReturnValue([{}, {}, {}]);
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
      mockRenderer.initialize.mockResolvedValue(undefined);
      mockRenderer.getSprites.mockReturnValue([{}, {}, {}]);
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
