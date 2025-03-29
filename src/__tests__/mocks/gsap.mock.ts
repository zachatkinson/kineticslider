import { vi } from 'vitest';

import type {
  AnimationState,
  GsapMock,
  GsapMockInstance,
  MockAnimation,
} from '../types/gsap-mock';

// Create a state object to track animation status
const animationState: AnimationState = {
  isAnimating: false,
  currentAnimation: null,
  completionCallback: null,
};

/**
 * Animation class for mocking GSAP animations
 */
class Animation implements MockAnimation {
  private target: HTMLElement | SVGElement | null = null;
  private config: Record<string, any> = {};

  constructor(target: HTMLElement | SVGElement, config: Record<string, any>) {
    this.target = target;
    this.config = config;

    // Store completion callback
    if (typeof config['onComplete'] === 'function') {
      animationState.completionCallback = config['onComplete'];
    }
  }

  kill(): void {
    if (animationState.currentAnimation === this) {
      animationState.currentAnimation = null;
      animationState.isAnimating = false;
    }
  }

  getTarget(): HTMLElement | SVGElement | null {
    return this.target;
  }

  getConfig(): Record<string, any> {
    return this.config;
  }
}

// Export helper functions for controlling animations in tests
export function startAnimation(): void {
  animationState.isAnimating = true;
}

export function completeAnimation(): void {
  if (animationState.completionCallback) {
    animationState.completionCallback();
  }

  animationState.isAnimating = false;
  animationState.currentAnimation = null;
  animationState.completionCallback = null;
}

export function getIsAnimating(): boolean {
  return animationState.isAnimating;
}

// Create the mock timeline
const timelineMock = {
  to: vi.fn(() => timelineMock),
  from: vi.fn(() => timelineMock),
  fromTo: vi.fn(() => timelineMock),
  add: vi.fn(() => timelineMock),
  set: vi.fn(() => timelineMock),
};

// Create the GSAP mock with minimal implementation
const gsapMockImplementation = {
  // Core animation methods
  to: (element: HTMLElement | SVGElement, config: Record<string, any>) => {
    const animation = new Animation(element, config);
    animationState.currentAnimation = animation;
    return animation;
  },

  // Timeline method
  timeline: vi.fn(() => timelineMock),

  // Animation state check
  isAnimating: () => animationState.isAnimating,

  // Add kill tweens method
  killTweensOf: vi.fn(),

  // Add minimal required methods
  registerPlugin: vi.fn(),
  ticker: {
    remove: vi.fn(),
  },
  effects: {},
  globalTimeline: {
    clear: vi.fn(),
  },
};

// Create and export the GSAP mock
export const gsapMock: GsapMock = {
  gsap: gsapMockImplementation as GsapMockInstance,
};

// For direct import in tests
export default gsapMock;
