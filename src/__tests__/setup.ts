import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect method with testing-library matchers
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock ResizeObserver which is not available in test environment
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver which is not available in test environment
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}
  
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
}

global.IntersectionObserver = MockIntersectionObserver;

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

// Suppress console errors during tests
console.error = vi.fn();

// Mock window object for tests
declare global {
  interface Window {
    __WORKER_REGISTRY__: Set<any>;
    registerWorker: (worker: any) => void;
  }
}

// Create global worker registry for testing
if (typeof window !== 'undefined') {
  window.__WORKER_REGISTRY__ = new Set();
  window.registerWorker = vi.fn((worker: any) => {
    window.__WORKER_REGISTRY__.add(worker);
  });
}

// Reset mocks between each test
beforeEach(() => {
  if (typeof window !== 'undefined') {
    window.__WORKER_REGISTRY__.clear();
  }
  vi.clearAllMocks();
}); 