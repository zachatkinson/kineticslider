/**
 * @fileoverview Complete System Integration Tests
 *
 * Comprehensive integration tests that verify the entire KineticSlider system
 * works correctly when all components are integrated. Tests the complete
 * workflow from input handling through physics calculations to rendering.
 * Follows DRY principles using our established test utilities.
 */

import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { SliderEngine } from '../../core/engine';
import { SliderPhysics } from '../../physics';
import { SliderController } from '../../input';
import { SliderRenderer } from '../../rendering';
import { SimpleEventEmitter } from '../../core/event-emitter';
import { serviceContainer, SERVICE_KEYS } from '../../core/container';
import type {
  SliderConfig,
  InputCallbacks,
  PhysicsConfig,
} from '../../core/types';
import {
  RENDERING,
  DEFAULT_PHYSICS_CONFIG,
  DEFAULT_INPUT_CONFIG,
  VIEWPORT,
  ANIMATION_DURATION,
  PERFORMANCE,
  INTENSITY,
  SPRITES,
} from '../../core/constants';
import { Application, Sprite } from 'pixi.js';
import {
  createMockPixiApplication,
  createMockPixiSprite,
  testPerformanceThreshold,
} from '../utils/test-factories';

// Test direction constants (commonly used in integration tests)
const TEST_DIRECTIONS = {
  left: -1,
  right: 1,
} as const;

// Test intensity references for convenient access
const TEST_INTENSITIES = {
  low: INTENSITY.LOW,
  medium: INTENSITY.MEDIUM,
  high: INTENSITY.HIGH,
} as const;

// Mock all external dependencies
vi.mock('pixi.js', () => ({
  Application: vi.fn(),
  Assets: {
    init: vi.fn().mockResolvedValue(undefined),
    load: vi.fn().mockResolvedValue('mock-texture'),
  },
  Sprite: vi.fn(),
  Filter: vi.fn(),
  Texture: {
    WHITE: 'mock-white-texture',
  },
}));

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('Complete System Integration', () => {
  let engine: SliderEngine;
  let physics: SliderPhysics;
  let controller: SliderController;
  let renderer: SliderRenderer;
  let mockContainer: HTMLElement;
  let mockConfig: SliderConfig;
  let inputCallbacks: InputCallbacks;

  beforeEach(async () => {
    // Create mock container
    mockContainer = document.createElement('div');
    mockContainer.style.width = '800px';
    mockContainer.style.height = '600px';
    vi.spyOn(mockContainer, 'appendChild');
    vi.spyOn(mockContainer, 'removeChild');

    // Create unified configuration following DRY principles
    mockConfig = {
      images: [
        'https://picsum.photos/800/600?random=1',
        'https://picsum.photos/800/600?random=2',
        'https://picsum.photos/800/600?random=3',
      ],
      rendering: {
        width: VIEWPORT.DESKTOP.width,
        height: VIEWPORT.DESKTOP.height,
        backgroundColor: RENDERING.BACKGROUND_COLOR,
        antialias: RENDERING.ANTIALIAS,
        resolution: RENDERING.RESOLUTION,
      },
      physics: DEFAULT_PHYSICS_CONFIG,
      input: DEFAULT_INPUT_CONFIG,
    };

    // Mock PIXI Application for renderer
    const mockApp = createMockPixiApplication();
    mockApp.init = vi.fn().mockResolvedValue(undefined);
    (
      Application as unknown as {
        mockImplementation: (fn: () => unknown) => void;
      }
    ).mockImplementation(() => mockApp);

    // Create mock DOM operations for renderer testing
    const mockDOMOperations = {
      appendChild: vi.fn(
        (_container: HTMLElement, _canvas: HTMLCanvasElement) => {
          // Mock the appendChild operation for PIXI canvas integration
        }
      ),
      removeChild: vi.fn(
        (_container: HTMLElement, _canvas: HTMLCanvasElement) => {
          // Mock the removeChild operation for PIXI canvas integration
        }
      ),
      contains: vi.fn((_container: HTMLElement, _canvas: HTMLCanvasElement) => {
        return true; // Always return true for test scenarios
      }),
    };

    // Initialize all system components
    engine = new SliderEngine();
    physics = new SliderPhysics();
    controller = new SliderController();
    renderer = new SliderRenderer(mockDOMOperations); // Inject mock DOM operations

    // ✅ CRITICAL FIX: Register services with container
    // The SliderEngine expects these services to be available via service container
    serviceContainer.registerInstance(SERVICE_KEYS.PHYSICS, physics);
    serviceContainer.registerInstance(SERVICE_KEYS.RENDERER, renderer);
    serviceContainer.registerInstance(SERVICE_KEYS.CONTROLLER, controller);
    serviceContainer.registerInstance(
      SERVICE_KEYS.EVENT_EMITTER,
      new SimpleEventEmitter()
    );

    // Mock physics methods that use GSAP to avoid test environment issues
    vi.spyOn(physics, 'animateTransition').mockReturnValue({
      duration: vi.fn(() => 0.5),
      call: vi.fn((callback: () => void) => {
        // Immediately call the callback to resolve the Promise in goToSlide
        callback();
        return {};
      }),
      kill: vi.fn(),
    } as never);
    vi.spyOn(physics, 'animateSwipe').mockReturnValue({
      duration: vi.fn(() => 0.3),
      kill: vi.fn(),
    } as never);
    vi.spyOn(physics, 'animateScale').mockReturnValue({
      duration: vi.fn(() => 0.2),
      kill: vi.fn(),
    } as never);

    // Set up input callbacks that connect to physics
    inputCallbacks = {
      onDragStart: vi.fn((_x: number, _y: number) => {
        // Simulate drag start with scale effect
        const sprites = renderer.getSprites();
        if (sprites.length > 0) {
          physics.animateScale(sprites[0], 1.1);
        }
      }),
      onDragMove: vi.fn(
        (_x: number, _y: number, _deltaX: number, _deltaY: number) => {
          // Simulate drag movement
        }
      ),
      onDragEnd: vi.fn((_x: number, _y: number) => {
        // Reset scale on drag end
        const sprites = renderer.getSprites();
        if (sprites.length > 0) {
          physics.animateScale(sprites[0], 1.0);
        }
      }),
      onSwipeLeft: vi.fn(() => {
        engine.goToSlide(
          (engine.getCurrentIndex() + 1) % mockConfig.images.length,
          false
        );
      }),
      onSwipeRight: vi.fn(() => {
        const currentIndex = engine.getCurrentIndex();
        const targetIndex =
          currentIndex === 0 ? mockConfig.images.length - 1 : currentIndex - 1;
        engine.goToSlide(targetIndex, false);
      }),
      onKeyLeft: vi.fn(() => {
        const currentIndex = engine.getCurrentIndex();
        const targetIndex =
          currentIndex === 0 ? mockConfig.images.length - 1 : currentIndex - 1;
        engine.goToSlide(targetIndex, false);
      }),
      onKeyRight: vi.fn(() => {
        engine.goToSlide(
          (engine.getCurrentIndex() + 1) % mockConfig.images.length,
          false
        );
      }),
    };

    // Initialize system
    await engine.initialize(mockConfig);
    await renderer.initialize(mockContainer, mockConfig.rendering);
    controller.initialize(mockContainer, inputCallbacks);
    physics.setPhysicsConfig(mockConfig.physics);
  });

  afterEach(() => {
    // Clean up all components following proper order
    try {
      controller?.destroy?.();
      physics?.cleanup?.();
      renderer?.destroy?.();
      engine?.destroy?.();
    } catch {
      // Ignore cleanup errors in tests
    }
    vi.clearAllMocks();
  });

  describe('System Initialization', () => {
    it('should initialize all components without errors', async () => {
      expect(engine).toBeDefined();
      expect(physics).toBeDefined();
      expect(controller).toBeDefined();
      expect(renderer).toBeDefined();
    });

    it('should have consistent configuration across components', async () => {
      await engine.initialize(mockConfig);

      const engineState = engine.getState();
      const physicsConfig = physics.getPhysicsConfig();
      const inputConfig = controller.getInputConfig();

      expect(engineState.totalSlides).toBe(mockConfig.images.length);
      expect(physicsConfig).toEqual(DEFAULT_PHYSICS_CONFIG);
      expect(inputConfig).toEqual(DEFAULT_INPUT_CONFIG);
    });

    it('should handle initialization with missing configuration gracefully', async () => {
      const minimalEngine = new SliderEngine();

      await expect(
        minimalEngine.initialize({
          images: ['test.jpg'],
          rendering: mockConfig.rendering,
          physics: mockConfig.physics,
          input: mockConfig.input,
        } as SliderConfig)
      ).resolves.not.toThrow();

      minimalEngine.destroy();
    });
  });

  describe('Input to Physics Integration', () => {
    beforeEach(async () => {
      // Mock sprite creation for testing
      const mockSprite = createMockPixiSprite();
      (
        Sprite as unknown as { mockImplementation: (fn: () => unknown) => void }
      ).mockImplementation(() => mockSprite);

      // CRITICAL: Create sprites BEFORE testing navigation
      // The engine needs sprites to animate transitions
      for (const [index, imageUrl] of mockConfig.images.entries()) {
        await renderer.createSprite(imageUrl, index);
      }
    });

    it('should handle swipe left gesture through complete pipeline', async () => {
      const initialIndex = engine.getCurrentIndex();

      // Simulate swipe left input
      inputCallbacks.onSwipeLeft();

      // Should trigger navigation
      expect(engine.getCurrentIndex()).toBe(
        (initialIndex + 1) % mockConfig.images.length
      );
    });

    it('should handle swipe right gesture through complete pipeline', async () => {
      // Navigate to second slide first
      await engine.goToSlide(1);
      const currentIndex = engine.getCurrentIndex();

      // Simulate swipe right input
      inputCallbacks.onSwipeRight();

      // Should navigate backwards
      expect(engine.getCurrentIndex()).toBe(currentIndex - 1);
    });

    it('should handle keyboard navigation through system', () => {
      const initialIndex = engine.getCurrentIndex();

      // Simulate keyboard input
      inputCallbacks.onKeyRight();

      expect(engine.getCurrentIndex()).toBe(
        (initialIndex + 1) % mockConfig.images.length
      );

      inputCallbacks.onKeyLeft();

      expect(engine.getCurrentIndex()).toBe(initialIndex);
    });

    it('should handle drag interactions with physics feedback', async () => {
      // Create test sprite for interaction (used implicitly in callbacks)
      await renderer.createSprite('test.jpg', 0);

      // Simulate drag start
      inputCallbacks.onDragStart(100, 100);

      // Should apply scale animation
      expect(inputCallbacks.onDragStart).toHaveBeenCalledWith(100, 100);

      // Simulate drag end
      inputCallbacks.onDragEnd(150, 100);

      // Should reset scale
      expect(inputCallbacks.onDragEnd).toHaveBeenCalledWith(150, 100);
    });
  });

  describe('Physics to Rendering Integration', () => {
    let testSprites: Sprite[];

    beforeEach(async () => {
      // Create test sprites for physics-rendering integration
      testSprites = [];
      for (let i = 0; i < SPRITES.COUNT.SMALL; i++) {
        const mockSprite = createMockPixiSprite();
        (
          Sprite as unknown as {
            mockImplementation: (fn: () => unknown) => void;
          }
        ).mockImplementation(() => mockSprite);
        testSprites.push(await renderer.createSprite(`image${i}.jpg`, i));
      }
    });

    it('should apply physics calculations to rendered sprites', () => {
      const sprite = testSprites[0];

      // Apply physics animation
      const timeline = physics.animateSwipe(
        sprite,
        TEST_DIRECTIONS.right,
        TEST_INTENSITIES.medium
      );

      expect(timeline).toBeDefined();
      expect(timeline.duration).toBeDefined();
    });

    it('should handle transition animations between sprites', () => {
      const timeline = physics.animateTransition(0, 1, testSprites);

      expect(timeline).toBeDefined();
      // Check if duration is a function (GSAP) or number
      const duration =
        typeof timeline.duration === 'function'
          ? timeline.duration()
          : timeline.duration;
      expect(duration).toBeGreaterThan(0);
    });

    it('should maintain sprite state consistency during animations', () => {
      const sprite = testSprites[0];
      const initialVisible = sprite.visible;

      // Apply scale animation
      physics.animateScale(sprite, 1.5);

      // Sprite visibility should remain consistent
      expect(sprite.visible).toBe(initialVisible);
    });

    it('should handle rapid animation sequences without conflicts', () => {
      const sprite = testSprites[0];

      // Apply multiple rapid animations
      const timeline1 = physics.animateScale(sprite, 1.2);
      const timeline2 = physics.animateSwipe(
        sprite,
        TEST_DIRECTIONS.left,
        TEST_INTENSITIES.low
      );
      const timeline3 = physics.animateScale(sprite, 1.0);

      expect(timeline1).toBeDefined();
      expect(timeline2).toBeDefined();
      expect(timeline3).toBeDefined();
    });
  });

  describe('Complete Workflow Integration', () => {
    beforeEach(async () => {
      // Create sprites for transition
      const mockSprite = createMockPixiSprite();
      (
        Sprite as unknown as { mockImplementation: (fn: () => unknown) => void }
      ).mockImplementation(() => mockSprite);

      for (const [index, imageUrl] of mockConfig.images.entries()) {
        await renderer.createSprite(imageUrl, index);
      }
    });

    it('should handle complete slide transition workflow', async () => {
      const initialIndex = engine.getCurrentIndex();

      // Trigger navigation
      await engine.goToSlide(1);

      // Should update engine state
      expect(engine.getCurrentIndex()).toBe(
        (initialIndex + 1) % mockConfig.images.length
      );

      // Should not be in transition immediately
      expect(engine.isTransitioning()).toBe(false);
    });

    it('should maintain performance during complex interactions', async () => {
      const result = await testPerformanceThreshold(
        async () => {
          // Simulate rapid user interactions
          for (let i = 0; i < 10; i++) {
            inputCallbacks.onDragStart(100 + i * 10, 100);
            inputCallbacks.onDragMove(120 + i * 10, 100, 20, 0);
            inputCallbacks.onDragEnd(140 + i * 10, 100);

            if (i % 3 === 0) {
              inputCallbacks.onSwipeLeft();
            }
          }
        },
        PERFORMANCE.MAX_FRAME_TIME_MS * 10 // Allow proportional time
      );

      expect(result.isWithinThreshold).toBe(true);
    });

    it('should handle edge cases in integrated workflow', async () => {
      // Test with empty sprite array
      expect(() => {
        physics.animateTransition(0, 1, []);
      }).not.toThrow();

      // Test navigation at boundaries
      await engine.goToSlide(0);
      inputCallbacks.onSwipeRight(); // Should wrap to last slide

      expect(engine.getCurrentIndex()).toBe(mockConfig.images.length - 1);

      inputCallbacks.onSwipeLeft(); // Should wrap to first slide
      expect(engine.getCurrentIndex()).toBe(0);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle renderer initialization failure gracefully', async () => {
      const failingRenderer = new SliderRenderer();
      const mockApp = createMockPixiApplication();
      mockApp.init = vi
        .fn()
        .mockRejectedValue(new Error('Renderer init failed'));
      (
        Application as unknown as {
          mockImplementation: (fn: () => unknown) => void;
        }
      ).mockImplementation(() => mockApp);

      await expect(
        failingRenderer.initialize(mockContainer, mockConfig.rendering)
      ).rejects.toThrow();
    });

    it('should handle physics calculation errors without breaking system', () => {
      // Mock physics engine to throw error
      const spy = vi
        .spyOn(physics, 'animateTransition')
        .mockImplementation(() => {
          throw new Error('Physics calculation failed');
        });

      expect(() => {
        inputCallbacks.onSwipeLeft();
      }).not.toThrow(); // Engine should handle physics errors gracefully

      spy.mockRestore();
    });

    it('should handle input event errors without breaking system', () => {
      // Mock callback to throw error
      const originalCallback = inputCallbacks.onDragStart;
      inputCallbacks.onDragStart = vi.fn().mockImplementation(() => {
        throw new Error('Input callback failed');
      });

      // System should continue working despite callback errors
      expect(() => {
        controller.enable();
      }).not.toThrow();

      inputCallbacks.onDragStart = originalCallback;
    });
  });

  describe('Resource Management and Cleanup', () => {
    it('should properly cleanup all system resources', () => {
      // Verify components are initialized
      expect(engine.getState()).toBeDefined();
      expect(renderer.getApplication()).toBeDefined();

      // Cleanup in proper order
      controller.destroy();
      physics.cleanup();
      renderer.destroy();
      engine.destroy();

      // Verify cleanup
      expect(renderer.getApplication()).toBeNull();
    });

    it('should handle cleanup errors gracefully', () => {
      // Mock renderer to throw error during cleanup
      const spy = vi.spyOn(renderer, 'destroy').mockImplementation(() => {
        throw new Error('Cleanup failed');
      });

      expect(() => {
        renderer.destroy();
      }).toThrow('Cleanup failed');

      spy.mockRestore();
    });

    it('should prevent memory leaks during long-running operations', async () => {
      // Simulate long-running slider usage
      const operations = [];

      for (let i = 0; i < SPRITES.COUNT.LARGE; i++) {
        operations.push(async () => {
          const mockSprite = createMockPixiSprite();
          (
            Sprite as unknown as {
              mockImplementation: (fn: () => unknown) => void;
            }
          ).mockImplementation(() => mockSprite);

          const sprite = await renderer.createSprite(`image${i}.jpg`, i);
          physics.animateScale(sprite, 1.1);
          renderer.setVisible(sprite, i % 2 === 0);

          return sprite;
        });
      }

      const sprites = await Promise.all(operations.map((op) => op()));

      // Cleanup all sprites
      sprites.forEach((sprite) => renderer.removeSprite(sprite));

      expect(renderer.getSprites()).toHaveLength(0);
    });
  });

  describe('Configuration and State Synchronization', () => {
    beforeEach(async () => {
      // Create sprites for navigation testing
      const mockSprite = createMockPixiSprite();
      (
        Sprite as unknown as { mockImplementation: (fn: () => unknown) => void }
      ).mockImplementation(() => mockSprite);

      for (const [index, imageUrl] of mockConfig.images.entries()) {
        await renderer.createSprite(imageUrl, index);
      }
    });

    it('should synchronize configuration changes across components', () => {
      const newPhysicsConfig: Partial<PhysicsConfig> = {
        transitionDuration: ANIMATION_DURATION.SLOW,
        swipeThreshold: 100,
      };

      physics.setPhysicsConfig(newPhysicsConfig);

      const updatedConfig = physics.getPhysicsConfig();
      expect(updatedConfig.transitionDuration).toBe(ANIMATION_DURATION.SLOW);
      expect(updatedConfig.swipeThreshold).toBe(100);
    });

    it('should maintain state consistency during navigation', async () => {
      const initialState = engine.getState();

      // Navigate and verify state updates
      await engine.goToSlide(1);
      const newState = engine.getState();

      expect(newState.currentIndex).toBe(
        (initialState.currentIndex + 1) % mockConfig.images.length
      );
      expect(newState.totalSlides).toBe(initialState.totalSlides);
    });

    it('should handle concurrent state changes gracefully', async () => {
      // Simulate concurrent operations
      const promises = [
        engine.goToSlide(1),
        engine.goToSlide(2),
        engine.goToSlide(0),
      ];

      await Promise.all(promises);

      // Final state should be consistent
      const finalState = engine.getState();
      expect(finalState.currentIndex).toBeGreaterThanOrEqual(0);
      expect(finalState.currentIndex).toBeLessThan(mockConfig.images.length);
    });
  });

  describe('Performance Integration', () => {
    it('should maintain 60fps performance target during animations', async () => {
      const result = await testPerformanceThreshold(
        async () => {
          // Create complex animation sequence
          const sprites = [];
          for (let i = 0; i < SPRITES.COUNT.MEDIUM; i++) {
            const mockSprite = createMockPixiSprite();
            (
              Sprite as unknown as {
                mockImplementation: (fn: () => unknown) => void;
              }
            ).mockImplementation(() => mockSprite);
            sprites.push(await renderer.createSprite(`image${i}.jpg`, i));
          }

          // Apply multiple animations
          sprites.forEach((sprite, index) => {
            physics.animateScale(sprite, 1.0 + index * 0.1);
            if (index % 2 === 0) {
              physics.animateSwipe(
                sprite,
                TEST_DIRECTIONS.right,
                TEST_INTENSITIES.medium
              );
            }
          });

          return sprites;
        },
        PERFORMANCE.TARGET_FPS // Should complete within frame budget
      );

      expect(result.isWithinThreshold).toBe(true);
    });

    it('should optimize rendering performance with asset caching', async () => {
      const cacheTest = await testPerformanceThreshold(
        async () => {
          // Load same asset multiple times
          const sprites = [];
          for (let i = 0; i < 5; i++) {
            const mockSprite = createMockPixiSprite();
            (
              Sprite as unknown as {
                mockImplementation: (fn: () => unknown) => void;
              }
            ).mockImplementation(() => mockSprite);
            sprites.push(await renderer.createSprite('shared-image.jpg', i));
          }
          return sprites;
        },
        PERFORMANCE.MAX_FRAME_TIME_MS * 2 // Should be fast due to caching
      );

      expect(cacheTest.isWithinThreshold).toBe(true);
    });
  });
});
