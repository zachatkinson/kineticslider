import * as PIXI from 'pixi.js';
import { vi } from 'vitest';
import { Slide, SliderId } from '../../types/slider';
import { createBrandedNumber, createBrandedId } from '../../types/branded';

/**
 * Test helpers for the Slider components
 */

/**
 * Mock PIXI objects for testing
 * @returns A mocked PIXI.Application instance
 */
export function createMockPixiApp(): PIXI.Application {
  return {
    stage: {
      addChild: vi.fn()
    },
    ticker: {
      add: vi.fn(),
      remove: vi.fn()
    },
    renderer: {
      resize: vi.fn()
    },
    destroy: vi.fn()
  } as unknown as PIXI.Application;
}

/**
 * Create a mock PIXI sprite for testing
 * @param options
 * @param options.width
 * @param options.height
 * @returns A mocked PIXI.Sprite instance
 */
export function createMockSprite(options: { 
  width?: number; 
  height?: number;
}): PIXI.Sprite {
  return {
    position: { x: 0, y: 0 },
    scale: { x: 1, y: 1 },
    anchor: { x: 0, y: 0 },
    alpha: 1,
    visible: true,
    width: options.width || 100,
    height: options.height || 100,
    texture: {
      width: options.width || 100,
      height: options.height || 100,
      baseTexture: {
        width: options.width || 100,
        height: options.height || 100,
        resource: {
          url: 'mock-texture.png'
        }
      }
    },
    destroy: vi.fn()
  } as unknown as PIXI.Sprite;
}

/**
 * Create a mock slide for testing
 * @param overrides
 * @returns A mocked Slide object
 */
export function createMockSlide(overrides: Partial<Slide> = {}): Slide {
  return {
    id: createBrandedId('slide-' + Date.now().toString(), 'SliderId') as SliderId,
    title: 'Test Slide',
    description: 'Test slide description',
    image: 'https://example.com/image.jpg',
    alt: 'Test image alt text',
    ...overrides
  };
}

/**
 * Create a mock slide ID
 * @param id
 * @returns A mocked SliderId branded type
 */
export function createSlideId(id: string): SliderId {
  return createBrandedId(id, 'SliderId') as SliderId;
}

/**
 * Create a mock slide index
 * @param index
 * @returns A branded SlideIndex number
 */
export function createSlideIndex(index: number): number {
  return createBrandedNumber(index, 'SlideIndex');
}

/**
 * Wait for a specified amount of time
 * @param ms
 * @returns A promise that resolves after the specified time
 */
export async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a mock DOM element with dimensions
 * @param width
 * @param height
 * @returns A mocked HTMLElement with specified dimensions
 */
export function createMockElement(width: number, height: number): HTMLElement {
  const element = document.createElement('div');
  
  // Mock getBoundingClientRect()
  element.getBoundingClientRect = () => ({
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    x: 0,
    y: 0,
    toJSON: () => ({})
  });
  
  return element;
} 