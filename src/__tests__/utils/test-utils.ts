import { render as rtlRender, RenderResult } from '@testing-library/react';
import { act } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ReactElement } from 'react';
import { vi } from 'vitest';
import type { Slide } from '@/types';

// Custom render function with providers if needed
export function render(ui: ReactElement): RenderResult {
  return rtlRender(ui);
}

// Setup user events
export const setupUserEvent = () => userEvent.setup();

// Wait for animation to complete
export const waitForAnimationComplete = async () => {
  await act(async () => {
    // Run any pending timers
    vi.runOnlyPendingTimers();
    // Wait for React to process state updates
    await Promise.resolve();
    // Run any animation frame callbacks
    vi.runAllTimers();
    // Wait for React to process state updates again
    await Promise.resolve();
  });
};

// Test data generator with error cases
export const generateMockSlides = (count: number): Slide[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `slide-${i + 1}`,
    content: `Slide ${i + 1} Content`
  }));
};

type MockFunction = {
  getMockName(): string;
  mock: {
    calls: unknown[][];
  };
};

// Custom matchers for GSAP animations
export const customMatchers = {
  toHaveBeenCalledWithDirection: (received: MockFunction, direction: string) => {
    const calls = received.mock.calls;
    const hasDirectionCall = calls.some((call: unknown[]) => call[0] === direction);

    return {
      pass: hasDirectionCall,
      message: () =>
        `expected ${received.getMockName()} to have been called with direction "${direction}"`,
    };
  },
};

// Mock IntersectionObserver
export class MockIntersectionObserver {
  readonly root: Element | null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;

  constructor(
    _callback: (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => void,
    options: {
      root?: Element | Document | null;
      rootMargin?: string;
      threshold?: number | number[];
    } = {}
  ) {
    this.root = options.root instanceof Element ? options.root : null;
    this.rootMargin = options.rootMargin || '0px';
    this.thresholds = Array.isArray(options.threshold)
      ? options.threshold
      : [options.threshold || 0];
  }

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn();
}

// Mock window.matchMedia
export const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

// Mock requestAnimationFrame
export const mockRequestAnimationFrame = (callback: (timestamp: number) => void): number => {
  return setTimeout(() => callback(Date.now()), 0) as unknown as number;
}; 