import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';

// Cleanup after each test
afterEach((): void => {
  cleanup();
});

// Mock PIXI.js for testing
beforeAll((): void => {
  // Mock PIXI global
  global.PIXI = {
    Application: class MockApplication {
      constructor() {}
      destroy(): void {}
    },
    Container: class MockContainer {
      constructor() {}
      addChild(): void {}
      removeChild(): void {}
    },
    Sprite: class MockSprite {
      constructor() {}
    },
    Texture: class MockTexture {
      static from(): MockTexture {
        return new MockTexture();
      }
    },
    Filter: class MockFilter {
      constructor() {}
    },
  } as unknown as typeof PIXI;

  // Mock GSAP
  global.gsap = {
    to: (): Record<string, unknown> => ({}),
    from: (): Record<string, unknown> => ({}),
    fromTo: (): Record<string, unknown> => ({}),
    timeline: (): Record<string, unknown> => ({}),
    set: (): Record<string, unknown> => ({}),
    killTweensOf: (): void => {},
  } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  // Mock ResizeObserver
  global.ResizeObserver = class MockResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  // Mock IntersectionObserver
  global.IntersectionObserver = class MockIntersectionObserver {
    root = null;
    rootMargin = '';
    thresholds = [];
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  // Mock requestAnimationFrame
  global.requestAnimationFrame = (cb: FrameRequestCallback): number => {
    return setTimeout(cb, 16);
  };

  global.cancelAnimationFrame = (id: number): void => {
    clearTimeout(id);
  };
});
