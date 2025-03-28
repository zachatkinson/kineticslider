import '@testing-library/jest-dom/vitest';
import { vi, expect, afterEach } from 'vitest';
import { customMatchers, MockIntersectionObserver, mockMatchMedia } from './utils/test-utils';
import { gsapMock } from './mocks/gsap';

// Mock GSAP
vi.mock('gsap', () => ({
  gsap: gsapMock.gsap
}));

// Setup custom matchers
expect.extend(customMatchers);

// Mock window.matchMedia
mockMatchMedia(true);

// Mock IntersectionObserver
window.IntersectionObserver = MockIntersectionObserver;

// Mock requestAnimationFrame
const mockRequestAnimationFrame = (callback: (timestamp: number) => void): number => {
  return setTimeout(() => callback(Date.now()), 0) as unknown as number;
};

const mockCancelAnimationFrame = (handle: number): void => {
  clearTimeout(handle);
};

global.requestAnimationFrame = mockRequestAnimationFrame;
global.cancelAnimationFrame = mockCancelAnimationFrame;

// Mock Touch API
interface TouchInit {
  identifier: number;
  target: EventTarget;
  clientX?: number;
  clientY?: number;
  screenX?: number;
  screenY?: number;
  pageX?: number;
  pageY?: number;
  radiusX?: number;
  radiusY?: number;
  rotationAngle?: number;
  force?: number;
}

class Touch {
  identifier: number;
  target: EventTarget;
  clientX: number;
  clientY: number;
  screenX: number;
  screenY: number;
  pageX: number;
  pageY: number;
  radiusX: number;
  radiusY: number;
  rotationAngle: number;
  force: number;

  constructor(init: TouchInit) {
    this.identifier = init.identifier;
    this.target = init.target;
    this.clientX = init.clientX || 0;
    this.clientY = init.clientY || 0;
    this.screenX = init.screenX || 0;
    this.screenY = init.screenY || 0;
    this.pageX = init.pageX || 0;
    this.pageY = init.pageY || 0;
    this.radiusX = init.radiusX || 0;
    this.radiusY = init.radiusY || 0;
    this.rotationAngle = init.rotationAngle || 0;
    this.force = init.force || 0;
  }
}

// Add Touch to global
(global as { Touch?: typeof Touch }).Touch = Touch;

// Mock ResizeObserver
class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

global.ResizeObserver = ResizeObserver;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
  vi.clearAllTimers();
});
