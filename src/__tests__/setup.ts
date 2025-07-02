/**
 * @fileoverview Test Environment Setup
 *
 * This file configures the test environment with mock implementations
 * of external libraries and global objects needed for testing.
 *
 * @version 1.0.0
 * @author KineticSlider Team
 * @since 1.0.0
 */

// Only setup Jest DOM if we're not in a Playwright environment
import '@testing-library/jest-dom';

import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';

// Cleanup after each test - only in Vitest environment
if (typeof process !== 'undefined' && !process.env.PLAYWRIGHT_TEST) {
  afterEach((): void => {
    cleanup();
  });
}

/**
 * Setup PIXI.js mock for testing environment
 *
 * @description Creates a minimal PIXI.js mock that satisfies basic testing needs
 * without requiring the full PIXI.js library
 */
beforeAll(() => {
  // Mock PIXI.js for testing
  const globalWithPIXI = global as typeof global & { PIXI: unknown };
  globalWithPIXI.PIXI = {
    Application: class MockApplication {
      renderer = {};
      stage = {};
      view = document.createElement('canvas');
    },
    Container: class MockContainer {
      children: unknown[] = [];
      addChild(child: unknown): unknown {
        this.children.push(child);
        return child;
      }
    },
    Texture: class MockTexture {
      width = 100;
      height = 100;
    },
    Sprite: class MockSprite {
      texture = new (
        globalWithPIXI.PIXI as { Texture: new () => unknown }
      ).Texture();
    },
    Filter: class MockFilter {
      enabled = true;
    },
  };

  // Mock GSAP for testing
  const globalWithGSAP = global as typeof global & { gsap: unknown };
  globalWithGSAP.gsap = {
    to: (target: unknown, vars: unknown): unknown => ({ target, vars }),
    timeline: (vars?: unknown): unknown => ({ vars }),
    registerPlugin: (): void => {},
  } as unknown as typeof gsap;

  // Mock ResizeObserver
  global.ResizeObserver = class MockResizeObserver implements ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };

  // Mock IntersectionObserver
  global.IntersectionObserver = class MockIntersectionObserver
    implements IntersectionObserver
  {
    root = null;
    rootMargin = '';
    thresholds: readonly number[] = [];
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  };

  // Mock requestAnimationFrame
  global.requestAnimationFrame = (cb: FrameRequestCallback): number => {
    return setTimeout(cb, 16);
  };

  global.cancelAnimationFrame = (id: number): void => {
    clearTimeout(id);
  };

  // Mock window.matchMedia for accessibility testing
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: (): void => {}, // Deprecated
      removeListener: (): void => {}, // Deprecated
      addEventListener: (): void => {},
      removeEventListener: (): void => {},
      dispatchEvent: (): boolean => true,
    }),
  });

  // Mock document.body for DOM manipulation tests
  Object.defineProperty(document, 'body', {
    writable: true,
    value: {
      appendChild: vi.fn((element) => element),
      removeChild: vi.fn((element) => element),
    },
  });

  // Mock document.createElement for test elements
  vi.spyOn(document, 'createElement').mockImplementation(
    (tagName: string) =>
      ({
        tagName: tagName.toUpperCase(),
        textContent: '',
        style: {},
        setAttribute: vi.fn(),
        getAttribute: vi.fn(),
        hasAttribute: vi.fn(() => false),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        remove: vi.fn(),
        focus: vi.fn(),
        blur: vi.fn(),
        parentNode: {
          removeChild: vi.fn(),
        },
      }) as unknown as HTMLElement
  );
});
