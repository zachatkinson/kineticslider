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

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';

// Cleanup after each test
afterEach((): void => {
  cleanup();
});

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
  };

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
