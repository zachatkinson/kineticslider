import { vi } from 'vitest';
import type { Slide, SliderId } from '../types/slider';
import type { MockResult, MockPixiApplication, MockPixiContainer, MockPixiSprite, MockPixiAssets } from '../types/test';

/**
 * Creates a mock PIXI.Application instance for testing
 */
export function createMockPixiApplication(): MockPixiApplication {
  return {
    stage: createMockPixiContainer(),
    renderer: {
      view: document.createElement('canvas'),
      resize: vi.fn(),
    },
    destroy: vi.fn(),
  };
}

/**
 * Creates a mock PIXI.Container instance for testing
 */
export function createMockPixiContainer(): MockPixiContainer {
  return {
    addChild: vi.fn(),
    removeChild: vi.fn(),
    children: [],
  };
}

/**
 * Creates a mock PIXI.Sprite instance for testing
 */
export function createMockPixiSprite(): MockPixiSprite {
  return {
    texture: {
      baseTexture: {
        resource: {
          source: document.createElement('img')
        }
      }
    },
    position: { x: 0, y: 0 },
    alpha: 0,
    destroy: vi.fn()
  };
}

/**
 * Creates a mock PIXI.Assets instance for testing
 */
export function createMockPixiAssets(): MockPixiAssets {
  return {
    load: vi.fn()
  };
}

/**
 * Creates a branded slide ID for testing
 */
export function createSlideId(id: string): SliderId {
  return id as SliderId;
}

/**
 * Creates a mock result object for testing async operations
 */
export function createMockResult<T>(data: T | undefined, error?: Error): MockResult<T> {
  return {
    value: data as T, // Type assertion since we know this is safe in our test context
    error,
    loading: false,
    success: Boolean(data && !error),
    failed: Boolean(error)
  };
}

/**
 * Generates an array of mock slides for testing
 */
export function generateMockSlides(count: number): Slide[] {
  return Array.from({ length: count }, (_, index) => ({
    id: createSlideId(`slide-${index}`),
    title: `Slide ${index + 1}`,
    content: `Content for slide ${index + 1}`,
    image: `https://example.com/image-${index + 1}.jpg`,
    alt: `Description for slide ${index + 1}`
  }));
}

/**
 * Returns a predefined set of mock slides for testing
 */
export function getMockSlides(): Slide[] {
  return generateMockSlides(3);
} 