import {
  RenderResult,
  render as testRender,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { ReactElement } from 'react';

import type { Slide } from '@/types/slider';
import { MockFunction } from '@/types/test';

import { createSlideId } from '../../utils/id-helpers';

// Re-export render with wrapper if needed
export function render(ui: ReactElement): RenderResult {
  return testRender(ui);
}

// User event setup helper
export const setupUserEvent = (): ReturnType<typeof userEvent.setup> =>
  userEvent.setup();

// Wait for animation to complete
export const waitForAnimationComplete = async (): Promise<void> => {
  await waitFor(
    () => {
      // Check if animation has completed
      const isAnimating = false; // Replace with actual implementation
      if (isAnimating) {
        throw new Error('Animation still in progress');
      }
    },
    { timeout: 3000 }
  );
};

// Generate mock slides for testing
export const generateMockSlides = (count: number): Slide[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: createSlideId(`slide-${i + 1}`),
    title: `Slide ${i + 1}`,
    description: `Description for slide ${i + 1}`,
    image: `/images/slide-${i + 1}.jpg`,
    alt: `Test image ${i + 1}`,
  }));
};

// Custom matchers for GSAP animations
export const customMatchers = {
  toHaveBeenCalledWithDirection: (
    received: MockFunction,
    direction: string
  ) => {
    const calls = received.mock.calls;
    const hasDirectionCall = calls.some(
      (call: unknown[]) => call[0] === direction
    );

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
    _callback: (
      entries: IntersectionObserverEntry[],
      observer: IntersectionObserver
    ) => void,
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
export const mockMatchMedia = (matches: boolean): void => {
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
export const mockRequestAnimationFrame = (
  callback: (timestamp: number) => void
): number => {
  return setTimeout(() => callback(Date.now()), 0) as unknown as number;
};

// Mock data that can be exported and used in tests
export const getMockSlides = (): Slide[] => [
  {
    id: createSlideId('1'),
    title: 'Test Slide 1',
    description: 'Test Description 1',
    image: 'test-image-1.jpg',
    alt: 'Test Image 1',
  },
  {
    id: createSlideId('2'),
    title: 'Test Slide 2',
    description: 'Test Description 2',
    image: 'test-image-2.jpg',
    alt: 'Test Image 2',
  },
];
