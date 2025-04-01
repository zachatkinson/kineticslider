/* eslint-env vitest */
import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import type { TouchOptions, MockResizeObserver, MockIntersectionObserver } from '../types/test/mocks';

// Mock Touch class for touch event simulations
class Touch {
  identifier;
  target;
  clientX;
  clientY;
  screenX;
  screenY;
  pageX;
  pageY;
  radiusX;
  radiusY;
  rotationAngle;
  force;

  constructor(options: TouchOptions = {}) {
    this.identifier = options.identifier || 0;
    this.target = options.target || (document.body as unknown as Element);
    this.clientX = options.clientX || 0;
    this.clientY = options.clientY || 0;
    this.screenX = options.screenX || 0;
    this.screenY = options.screenY || 0;
    this.pageX = options.pageX || 0;
    this.pageY = options.pageY || 0;
    this.radiusX = options.radiusX || 0;
    this.radiusY = options.radiusY || 0;
    this.rotationAngle = options.rotationAngle || 0;
    this.force = options.force || 0;
  }
}

// Add Touch to global
global.Touch = Touch;

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  return setTimeout(callback, 0);
});

global.cancelAnimationFrame = vi.fn((id: number) => {
  clearTimeout(id);
});

// Mock the ResizeObserver
class ResizeObserver implements MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

// Add ResizeObserver to global
global.ResizeObserver = ResizeObserver;

// Mock IntersectionObserver
class MockIntersectionObserverImpl implements MockIntersectionObserver {
  readonly root: Element | null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;

  constructor(
    private readonly callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {}
  ) {
    this.root = options.root instanceof Element ? options.root : null;
    this.rootMargin = options.rootMargin || '0px';
    this.thresholds = Array.isArray(options.threshold)
      ? options.threshold
      : [options.threshold || 0];
  }

  observe = vi.fn().mockImplementation((target: Element): void => {
    // You could call the callback with an empty entry if needed
    setTimeout(() => {
      this.callback(
        [
          {
            target,
            isIntersecting: true,
            intersectionRatio: 1,
            boundingClientRect: target.getBoundingClientRect(),
            intersectionRect: target.getBoundingClientRect(),
            rootBounds: this.root?.getBoundingClientRect() || null,
            time: Date.now(),
          } as IntersectionObserverEntry,
        ],
        this
      );
    }, 0);
  });

  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn().mockReturnValue([]);
}

// Add IntersectionObserver to global
global.IntersectionObserver =
  MockIntersectionObserverImpl as unknown as typeof IntersectionObserver;

// Mock window.matchMedia
window.matchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Clean up after each test
afterEach(() => {
  // Reset mocks
  vi.resetAllMocks();

  // Clear the document body
  document.body.innerHTML = '';
});
