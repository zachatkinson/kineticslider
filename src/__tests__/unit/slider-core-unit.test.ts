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

  describe('Displacement Texture Loading', () => {
    let mockDisplacementTextureLoader: MockService;
    let mockEffectPresets: MockService;

    beforeEach(() => {
      // Mock DisplacementTextureLoader
      mockDisplacementTextureLoader = createMockService([
        'loadDisplacementTextures',
      ]);

      // Mock EffectPresets
      mockEffectPresets = createMockService(['setDisplacementTexture']);

      // Replace the real instances with our mocks
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sliderCore as any).displacementTextureLoader =
        mockDisplacementTextureLoader;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sliderCore as any).effectPresets = mockEffectPresets;
    });

    it('should load displacement textures during initialization', async () => {
      const mockTexture = { width: 256, height: 256 };
      mockDisplacementTextureLoader.loadDisplacementTextures.mockResolvedValue({
        background: mockTexture,
        cursor: null,
      });

      mockRenderer.initialize.mockResolvedValue(undefined);
      mockRenderer.getSprites.mockReturnValue([{}, {}, {}]);

      await sliderCore.initialize(mockConfig);

      expect(
        mockDisplacementTextureLoader.loadDisplacementTextures
      ).toHaveBeenCalled();
      expect(mockEffectPresets.setDisplacementTexture).toHaveBeenCalledWith(
        mockTexture
      );
    });

    it('should handle successful displacement texture loading', async () => {
      const mockBackgroundTexture = { width: 512, height: 512 };
      const mockCursorTexture = { width: 128, height: 128 };

      mockDisplacementTextureLoader.loadDisplacementTextures.mockResolvedValue({
        background: mockBackgroundTexture,
        cursor: mockCursorTexture,
      });

      mockRenderer.initialize.mockResolvedValue(undefined);
      mockRenderer.getSprites.mockReturnValue([{}, {}, {}]);

      await sliderCore.initialize(mockConfig);

      expect(
        mockDisplacementTextureLoader.loadDisplacementTextures
      ).toHaveBeenCalledTimes(1);
      expect(mockEffectPresets.setDisplacementTexture).toHaveBeenCalledWith(
        mockBackgroundTexture
      );
    });

    it('should handle null background texture gracefully', async () => {
      mockDisplacementTextureLoader.loadDisplacementTextures.mockResolvedValue({
        background: null,
        cursor: null,
      });

      mockRenderer.initialize.mockResolvedValue(undefined);
      mockRenderer.getSprites.mockReturnValue([{}, {}, {}]);

      await sliderCore.initialize(mockConfig);

      expect(
        mockDisplacementTextureLoader.loadDisplacementTextures
      ).toHaveBeenCalled();
      expect(mockEffectPresets.setDisplacementTexture).not.toHaveBeenCalled();
    });

    it('should handle displacement texture loading errors gracefully', async () => {
      const loadingError = new Error('Failed to load displacement texture');
      mockDisplacementTextureLoader.loadDisplacementTextures.mockRejectedValue(
        loadingError
      );

      mockRenderer.initialize.mockResolvedValue(undefined);
      mockRenderer.getSprites.mockReturnValue([{}, {}, {}]);

      // Should not throw - error should be caught and logged
      await expect(sliderCore.initialize(mockConfig)).resolves.not.toThrow();

      expect(
        mockDisplacementTextureLoader.loadDisplacementTextures
      ).toHaveBeenCalled();
      expect(mockEffectPresets.setDisplacementTexture).not.toHaveBeenCalled();
    });

    it('should handle non-Error displacement texture loading failures', async () => {
      // Test with string error
      mockDisplacementTextureLoader.loadDisplacementTextures.mockRejectedValue(
        'Network error'
      );

      mockRenderer.initialize.mockResolvedValue(undefined);
      mockRenderer.getSprites.mockReturnValue([{}, {}, {}]);

      await expect(sliderCore.initialize(mockConfig)).resolves.not.toThrow();

      expect(
        mockDisplacementTextureLoader.loadDisplacementTextures
      ).toHaveBeenCalled();
      expect(mockEffectPresets.setDisplacementTexture).not.toHaveBeenCalled();
    });

    it('should handle undefined displacement texture result', async () => {
      mockDisplacementTextureLoader.loadDisplacementTextures.mockResolvedValue(
        undefined
      );

      mockRenderer.initialize.mockResolvedValue(undefined);
      mockRenderer.getSprites.mockReturnValue([{}, {}, {}]);

      await expect(sliderCore.initialize(mockConfig)).resolves.not.toThrow();

      expect(
        mockDisplacementTextureLoader.loadDisplacementTextures
      ).toHaveBeenCalled();
      expect(mockEffectPresets.setDisplacementTexture).not.toHaveBeenCalled();
    });

    it('should handle displacement texture loading timeout', async () => {
      // Simulate a timeout by never resolving the promise
      let rejectTimeout: (reason?: unknown) => void;
      const timeoutPromise = new Promise((_, reject) => {
        rejectTimeout = reject;
      });

      mockDisplacementTextureLoader.loadDisplacementTextures.mockReturnValue(
        timeoutPromise
      );

      mockRenderer.initialize.mockResolvedValue(undefined);
      mockRenderer.getSprites.mockReturnValue([{}, {}, {}]);

      // Start initialization
      const initPromise = sliderCore.initialize(mockConfig);

      // Simulate timeout after a short delay
      setTimeout(() => {
        rejectTimeout!(new Error('Timeout loading displacement textures'));
      }, 10);

      await expect(initPromise).resolves.not.toThrow();
      expect(mockEffectPresets.setDisplacementTexture).not.toHaveBeenCalled();
    });

    it('should load displacement textures only once per initialization', async () => {
      const mockTexture = { width: 256, height: 256 };
      mockDisplacementTextureLoader.loadDisplacementTextures.mockResolvedValue({
        background: mockTexture,
        cursor: null,
      });

      mockRenderer.initialize.mockResolvedValue(undefined);
      mockRenderer.getSprites.mockReturnValue([{}, {}, {}]);

      // Initialize slider
      await sliderCore.initialize(mockConfig);

      // Verify displacement texture loading was called once
      expect(
        mockDisplacementTextureLoader.loadDisplacementTextures
      ).toHaveBeenCalledTimes(1);
      expect(mockEffectPresets.setDisplacementTexture).toHaveBeenCalledTimes(1);
    });

    it('should not interfere with initialization if displacement texture loading fails', async () => {
      mockDisplacementTextureLoader.loadDisplacementTextures.mockRejectedValue(
        new Error('Displacement texture loading failed')
      );

      mockRenderer.initialize.mockResolvedValue(undefined);
      mockRenderer.getSprites.mockReturnValue([{}, {}, {}]);

      // Initialization should complete successfully despite displacement texture failure
      await sliderCore.initialize(mockConfig);

      const state = sliderCore.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.totalSlides).toBe(3);
    });

    it('should handle concurrent displacement texture loading', async () => {
      const mockTexture = { width: 256, height: 256 };
      let resolveTextureLoading: (value: unknown) => void;
      const textureLoadingPromise = new Promise((resolve) => {
        resolveTextureLoading = resolve;
      });

      mockDisplacementTextureLoader.loadDisplacementTextures.mockReturnValue(
        textureLoadingPromise
      );

      mockRenderer.initialize.mockResolvedValue(undefined);
      mockRenderer.getSprites.mockReturnValue([{}, {}, {}]);

      // Start initialization
      const initPromise = sliderCore.initialize(mockConfig);

      // Resolve texture loading after a delay
      setTimeout(() => {
        resolveTextureLoading!({
          background: mockTexture,
          cursor: null,
        });
      }, 50);

      await initPromise;

      expect(
        mockDisplacementTextureLoader.loadDisplacementTextures
      ).toHaveBeenCalled();
      expect(mockEffectPresets.setDisplacementTexture).toHaveBeenCalledWith(
        mockTexture
      );
    });
  });
});
