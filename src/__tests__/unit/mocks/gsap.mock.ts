/* eslint-env vitest */
import { vi } from 'vitest';

import type {
  GsapMockInstance,
  TimelineInstance,
  ToVars,
  TweenInstance,
} from '../types/gsap-mock';

/**
 * Mock implementation for GSAP animations
 */

// Keep track of animation state
let isAnimating = false;

// Helper functions to control animation in tests
export const startAnimation = (): void => {
  isAnimating = true;
};

export const completeAnimation = (): void => {
  isAnimating = false;

  // If there's a stored callback, execute it
  if (typeof mockToParams?.vars?.onComplete === 'function') {
    mockToParams.vars.onComplete();
  }
};

export const getIsAnimating = (): boolean => isAnimating;

// Store params passed to the mock
const mockToParams: {
  target?: Element | string;
  vars?: {
    onComplete?: () => void;
    [key: string]: any;
  };
} = {};

// Mock tween instance
const mockTween: TweenInstance = {
  kill: vi.fn(),
  pause: vi.fn().mockReturnThis(),
  play: vi.fn().mockReturnThis(),
  progress: vi.fn().mockReturnValue(0),
  restart: vi.fn().mockReturnThis(),
  reverse: vi.fn().mockReturnThis(),
  timeScale: vi.fn().mockReturnThis(),
};

// Mock GSAP to function
const mockTo = vi.fn(
  (target: Element | string, vars: ToVars): TweenInstance => {
    // Store params for later inspection
    mockToParams.target = target;
    mockToParams.vars = vars;

    isAnimating = true;

    return { ...mockTween };
  }
);

// Mock timeline object
const mockTimeline: TimelineInstance = {
  to: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  fromTo: vi.fn().mockReturnThis(),
  add: vi.fn().mockReturnThis(),
  kill: vi.fn(),
  pause: vi.fn().mockReturnThis(),
  play: vi.fn().mockReturnThis(),
  progress: vi.fn().mockReturnValue(0),
  restart: vi.fn().mockReturnThis(),
  reverse: vi.fn().mockReturnThis(),
  timeScale: vi.fn().mockReturnThis(),
};

// Create GSAP instance
export const gsap: GsapMockInstance = {
  to: mockTo,
  timeline: vi.fn((): TimelineInstance => ({ ...mockTimeline })),
  set: vi.fn(),
  isAnimating: (): boolean => isAnimating,
  getById: vi.fn(() => null),
  getTweensOf: vi.fn(() => []),
  killTweensOf: vi.fn(),
  registerPlugin: vi.fn(),
  ticker: {
    remove: vi.fn(),
  },
  effects: {},
  globalTimeline: {
    clear: vi.fn(),
  },
};

// Initialize the mock on window - use type assertion to avoid TypeScript errors
window.gsap = gsap as any;

// Export mock params for test inspection
export const getMockToParams = (): {
  target?: Element | string;
  vars?: {
    onComplete?: () => void;
    [key: string]: any;
  };
} => mockToParams;
