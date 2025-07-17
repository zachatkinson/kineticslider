/**
 * @fileoverview DisplacementEffects Unit Tests
 *
 * Comprehensive unit tests for the DisplacementEffects class.
 * Tests individual methods and functionality in isolation.
 *
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Sprite, DisplacementFilter, Texture } from 'pixi.js';
import { gsap } from 'gsap';
import { DisplacementEffects } from '../../rendering/displacement-effects';
import type {
  MouseFollowOptions,
  TransitionOptions,
  IdleEffectOptions,
} from '../../rendering/displacement-effects';
import { EASING } from '../../core/constants';
import { createMockSprite, createMockTexture } from '../utils/pixi-mocks';

// Mock PIXI DisplacementFilter
vi.mock('pixi.js', async () => {
  const actual = await vi.importActual('pixi.js');
  return {
    ...actual,
    DisplacementFilter: vi.fn().mockImplementation(() => ({
      scale: { x: 0, y: 0 },
      enabled: true,
      destroy: vi.fn(),
    })),
  };
});

describe('DisplacementEffects', () => {
  let displacementEffects: DisplacementEffects;
  let sprite: Sprite;
  let texture: Texture;
  let mockFilter: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  beforeEach(() => {
    texture = createMockTexture() as unknown as Texture;
    displacementEffects = new DisplacementEffects(texture);
    sprite = createMockSprite() as unknown as Sprite;

    // Create mock filter
    mockFilter = {
      scale: { x: 0, y: 0 },
      enabled: true,
      destroy: vi.fn(),
      padding: 0,
      antialias: 'inherit',
      _state: { data: 0 },
      blendMode: 'normal',
      resolution: 1,
      multisample: 'inherit',
      blur: 0,
      brightness: 1,
      contrast: 1,
      saturation: 1,
      hue: 0,
      displacement: 0,
      outerStrength: 0,
      innerStrength: 0,
      color: 0xffffff,
      scaleX: 1,
      scaleY: 1,
      amplitude: 0,
      wavelength: 100,
      apply: vi.fn(),
      uid: Math.floor(Math.random() * 1000000),
      uniforms: {},
      program: null,
      gpuProgram: null,
      glProgram: null,
    };

    // Mock DisplacementFilter constructor
    vi.mocked(DisplacementFilter).mockImplementation(() => mockFilter);
  });

  afterEach(() => {
    displacementEffects.dispose();
    gsap.killTweensOf('*');
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create instance with displacement texture', () => {
      expect(displacementEffects).toBeInstanceOf(DisplacementEffects);
    });

    it('should create instance without displacement texture', () => {
      const effects = new DisplacementEffects();
      expect(effects).toBeInstanceOf(DisplacementEffects);
      effects.dispose();
    });

    it('should initialize with default state', () => {
      const metrics = displacementEffects.getPerformanceMetrics();
      expect(metrics.activeEffects).toBe(0);
      expect(metrics.isMouseFollowActive).toBe(false);
      expect(metrics.isIdleActive).toBe(false);
    });
  });

  describe('setDisplacementTexture', () => {
    it('should set displacement texture', () => {
      const effects = new DisplacementEffects();
      const newTexture = createMockTexture() as unknown as Texture;

      effects.setDisplacementTexture(newTexture);

      // Should not throw when creating effects
      expect(() => {
        effects.createMouseFollowEffect(sprite);
      }).not.toThrow();

      effects.dispose();
    });
  });

  describe('createMouseFollowEffect', () => {
    it('should create mouse follow effect with default options', () => {
      const timeline = displacementEffects.createMouseFollowEffect(sprite);

      expect(timeline).toBeDefined();
      expect(DisplacementFilter).toHaveBeenCalled();
      expect(sprite.filters).toContain(mockFilter);

      const metrics = displacementEffects.getPerformanceMetrics();
      expect(metrics.activeEffects).toBe(1);
    });

    it('should create mouse follow effect with custom options', () => {
      const options: MouseFollowOptions = {
        intensity: 0.8,
        radius: 200,
        smoothing: true,
        smoothingFactor: 0.2,
        duration: 0.5,
        ease: EASING.EASE_IN_OUT,
        enabled: true,
        scaleX: 75,
        scaleY: 75,
      };

      const timeline = displacementEffects.createMouseFollowEffect(
        sprite,
        options
      );

      expect(timeline).toBeDefined();
      expect(DisplacementFilter).toHaveBeenCalledWith(
        expect.any(Object), // sprite
        0 // scale
      );
    });

    it('should throw error when displacement texture not set', () => {
      const effects = new DisplacementEffects();

      expect(() => {
        effects.createMouseFollowEffect(sprite);
      }).toThrow('Displacement texture not set');

      effects.dispose();
    });

    it('should handle disabled effect', () => {
      const options: MouseFollowOptions = {
        enabled: false,
      };

      const timeline = displacementEffects.createMouseFollowEffect(
        sprite,
        options
      );

      expect(timeline).toBeDefined();
      const metrics = displacementEffects.getPerformanceMetrics();
      expect(metrics.isMouseFollowActive).toBe(false);
    });
  });

  describe('createTransitionEffect', () => {
    let fromSprite: Sprite;
    let toSprite: Sprite;

    beforeEach(() => {
      fromSprite = createMockSprite() as unknown as Sprite;
      toSprite = createMockSprite() as unknown as Sprite;
    });

    it('should create transition effect with default options', () => {
      const timeline = displacementEffects.createTransitionEffect(
        fromSprite,
        toSprite
      );

      expect(timeline).toBeDefined();
      expect(DisplacementFilter).toHaveBeenCalledTimes(2);

      const metrics = displacementEffects.getPerformanceMetrics();
      expect(metrics.activeEffects).toBe(1);
    });

    it('should create wave transition effect', () => {
      const options: TransitionOptions = {
        type: 'wave',
        intensity: 0.8,
        duration: 1.0,
        ease: EASING.EASE_IN_OUT,
        waveFrequency: 15,
        waveAmplitude: 40,
        reverse: false,
      };

      const timeline = displacementEffects.createTransitionEffect(
        fromSprite,
        toSprite,
        options
      );

      expect(timeline).toBeDefined();
      expect(DisplacementFilter).toHaveBeenCalledTimes(2);
    });

    it('should create ripple transition effect', () => {
      const options: TransitionOptions = {
        type: 'ripple',
        intensity: 0.6,
        duration: 0.8,
      };

      const timeline = displacementEffects.createTransitionEffect(
        fromSprite,
        toSprite,
        options
      );

      expect(timeline).toBeDefined();
    });

    it('should create distortion transition effect', () => {
      const options: TransitionOptions = {
        type: 'distortion',
        intensity: 0.9,
      };

      const timeline = displacementEffects.createTransitionEffect(
        fromSprite,
        toSprite,
        options
      );

      expect(timeline).toBeDefined();
    });

    it('should create swirl transition effect', () => {
      const options: TransitionOptions = {
        type: 'swirl',
        intensity: 0.7,
        rotation: Math.PI,
        reverse: true,
      };

      const timeline = displacementEffects.createTransitionEffect(
        fromSprite,
        toSprite,
        options
      );

      expect(timeline).toBeDefined();
    });

    it('should throw error when displacement texture not set', () => {
      const effects = new DisplacementEffects();

      expect(() => {
        effects.createTransitionEffect(fromSprite, toSprite);
      }).toThrow('Displacement texture not set');

      effects.dispose();
    });
  });

  describe('createIdleEffect', () => {
    it('should create idle effect with default options', () => {
      const timeline = displacementEffects.createIdleEffect(sprite);

      expect(timeline).toBeDefined();
      expect(DisplacementFilter).toHaveBeenCalled();

      const metrics = displacementEffects.getPerformanceMetrics();
      expect(metrics.activeEffects).toBe(1);
      expect(metrics.isIdleActive).toBe(true);
    });

    it('should create float idle effect', () => {
      const options: IdleEffectOptions = {
        type: 'float',
        intensity: 0.5,
        duration: 3,
        loop: true,
        ease: EASING.EASE_IN_OUT,
      };

      const timeline = displacementEffects.createIdleEffect(sprite, options);

      expect(timeline).toBeDefined();
    });

    it('should create breathe idle effect', () => {
      const options: IdleEffectOptions = {
        type: 'breathe',
        intensity: 0.4,
        duration: 2,
      };

      const timeline = displacementEffects.createIdleEffect(sprite, options);

      expect(timeline).toBeDefined();
    });

    it('should create wave idle effect', () => {
      const options: IdleEffectOptions = {
        type: 'wave',
        intensity: 0.6,
      };

      const timeline = displacementEffects.createIdleEffect(sprite, options);

      expect(timeline).toBeDefined();
    });

    it('should create subtle idle effect', () => {
      const options: IdleEffectOptions = {
        type: 'subtle',
        intensity: 0.2,
      };

      const timeline = displacementEffects.createIdleEffect(sprite, options);

      expect(timeline).toBeDefined();
    });

    it('should handle disabled effect', () => {
      const options: IdleEffectOptions = {
        enabled: false,
      };

      const timeline = displacementEffects.createIdleEffect(sprite, options);

      expect(timeline).toBeDefined();
      const metrics = displacementEffects.getPerformanceMetrics();
      expect(metrics.isIdleActive).toBe(false);
    });

    it('should throw error when displacement texture not set', () => {
      const effects = new DisplacementEffects();

      expect(() => {
        effects.createIdleEffect(sprite);
      }).toThrow('Displacement texture not set');

      effects.dispose();
    });
  });

  describe('stopAllEffects', () => {
    it('should stop all active effects', () => {
      displacementEffects.createMouseFollowEffect(sprite);
      displacementEffects.createIdleEffect(sprite);

      let metrics = displacementEffects.getPerformanceMetrics();
      expect(metrics.activeEffects).toBe(2);

      displacementEffects.stopAllEffects();

      metrics = displacementEffects.getPerformanceMetrics();
      expect(metrics.activeEffects).toBe(0);
      expect(metrics.isMouseFollowActive).toBe(false);
      expect(metrics.isIdleActive).toBe(false);
    });

    it('should cancel mouse tracking animation frame', () => {
      // Create mouse follow effect which starts animation loop
      displacementEffects.createMouseFollowEffect(sprite);

      // Verify mouse follow is active
      let metrics = displacementEffects.getPerformanceMetrics();
      expect(metrics.isMouseFollowActive).toBe(true);

      // Stop all effects
      displacementEffects.stopAllEffects();

      // Verify mouse follow is now inactive
      metrics = displacementEffects.getPerformanceMetrics();
      expect(metrics.isMouseFollowActive).toBe(false);
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return current performance metrics', () => {
      const metrics = displacementEffects.getPerformanceMetrics();

      expect(metrics).toEqual({
        activeEffects: 0,
        activeFilters: 0,
        isMouseFollowActive: false,
        isIdleActive: false,
      });
    });

    it('should update metrics when effects are active', () => {
      displacementEffects.createMouseFollowEffect(sprite);
      displacementEffects.createIdleEffect(sprite);

      const metrics = displacementEffects.getPerformanceMetrics();

      expect(metrics.activeEffects).toBe(2);
      expect(metrics.activeFilters).toBe(2);
      expect(metrics.isMouseFollowActive).toBe(true);
      expect(metrics.isIdleActive).toBe(true);
    });
  });

  describe('dispose', () => {
    it('should dispose of all resources', () => {
      displacementEffects.createMouseFollowEffect(sprite);
      displacementEffects.createIdleEffect(sprite);

      displacementEffects.dispose();

      const metrics = displacementEffects.getPerformanceMetrics();
      expect(metrics.activeEffects).toBe(0);
      expect(metrics.activeFilters).toBe(0);
      expect(metrics.isMouseFollowActive).toBe(false);
      expect(metrics.isIdleActive).toBe(false);
    });

    it('should be safe to call multiple times', () => {
      displacementEffects.dispose();
      expect(() => {
        displacementEffects.dispose();
      }).not.toThrow();
    });
  });

  describe('Mouse interaction simulation', () => {
    it('should handle mouse move events', () => {
      // Mock getBounds
      const mockBounds = { x: 0, y: 0, width: 800, height: 600 };
      sprite.parent = {
        getBounds: vi.fn().mockReturnValue(mockBounds),
      } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      const options: MouseFollowOptions = {
        smoothing: false, // Disable smoothing for predictable testing
      };

      displacementEffects.createMouseFollowEffect(sprite, options);

      // Simulate mouse move
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: 400,
        clientY: 300,
      });

      window.dispatchEvent(mouseEvent);

      // Should not throw and should track mouse position
      expect(sprite.parent.getBounds).toHaveBeenCalled();
    });
  });

  describe('Filter application', () => {
    it('should apply filter to sprite correctly', () => {
      sprite.filters = [];

      displacementEffects.createMouseFollowEffect(sprite);

      expect(sprite.filters).toContain(mockFilter);
    });

    it('should not duplicate filters', () => {
      sprite.filters = [mockFilter];

      displacementEffects.createMouseFollowEffect(sprite);

      expect(sprite.filters.filter((f) => f === mockFilter)).toHaveLength(1);
    });

    it('should handle existing filters array', () => {
      const existingFilter = {
        scale: { x: 1, y: 1 },
        enabled: true,
        destroy: vi.fn(),
        padding: 0,
        antialias: 'inherit',
        _state: { data: 0 },
        blendMode: 'normal',
        resolution: 1,
        multisample: 'inherit',
        blur: 0,
        brightness: 1,
        contrast: 1,
        saturation: 1,
        hue: 0,
        displacement: 0,
        outerStrength: 0,
        innerStrength: 0,
        color: 0xffffff,
        scaleX: 1,
        scaleY: 1,
        amplitude: 0,
        wavelength: 100,
        apply: vi.fn(),
        uid: Math.floor(Math.random() * 1000000),
        uniforms: {},
        program: null,
        gpuProgram: null,
        glProgram: null,
      } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      sprite.filters = [existingFilter];

      displacementEffects.createMouseFollowEffect(sprite);

      expect(sprite.filters).toContain(existingFilter);
      expect(sprite.filters).toContain(mockFilter);
    });
  });
});
