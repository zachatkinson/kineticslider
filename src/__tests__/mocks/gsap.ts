import { vi } from 'vitest';
import type { GsapInstance, GsapTimeline, GsapTicker } from '../../types';

// Mock Animation class
class Animation {
  static version = '3.12.2';
  data = {};
  parent = null;
  delay = 0;
  duration() { return 0; }
  endTime() { return 0; }
  eventCallback() { return this; }
  invalidate() { return this; }
  isActive() { return false; }
  kill() { return this; }
  pause() { return this; }
  paused() { return false; }
  play() { return this; }
  progress() { return 0; }
  restart() { return this; }
  resume() { return this; }
  reverse() { return this; }
  reversed() { return false; }
  seek() { return this; }
  startTime() { return 0; }
  time() { return 0; }
  timeScale() { return 1; }
  totalDuration() { return 0; }
  totalProgress() { return 0; }
  totalTime() { return 0; }
  
  constructor(vars?: object, time?: number) {
    if (vars) {
      Object.assign(this.data, vars);
    }
    if (time) {
      this.startTime();
    }
  }
}

// Mock Timeline class
class Timeline extends Animation {
  static override version = '3.12.2';
  add() { return this; }
  addLabel() { return this; }
  addPause() { return this; }
  call() { return this; }
  clear() { return this; }
  currentLabel() { return ''; }
  from() { return this; }
  fromTo() { return this; }
  getChildren() { return []; }
  getTweensOf() { return []; }
  nextLabel() { return ''; }
  previousLabel() { return ''; }
  recent() { return null; }
  remove() { return this; }
  removeLabel() { return this; }
  set() { return this; }
  shiftChildren() { return this; }
  staggerFrom() { return this; }
  staggerFromTo() { return this; }
  staggerTo() { return this; }
  to() { return this; }
  tweenFromTo() { return this; }
  tweenTo() { return this; }
}

// Mock Tween class
class Tween extends Animation {
  static override version = '3.12.2';
  vars = {};
  targets() { return []; }
}

// Track animation state
let isAnimating = false;
let currentAnimation: { 
  target: Element;
  vars: {
    onComplete?: () => void;
    onStart?: () => void;
    x?: string | number;
    duration?: number;
    ease?: string;
  };
} | null = null;

// Helper to complete current animation
export const completeAnimation = () => {
  if (currentAnimation?.vars.onComplete) {
    currentAnimation.vars.onComplete();
  }
  isAnimating = false;
  currentAnimation = null;
};

// Helper to start animation
export const startAnimation = () => {
  if (currentAnimation?.vars.onStart) {
    currentAnimation.vars.onStart();
  }
  isAnimating = true;
};

// Helper to check animation state
export const getIsAnimating = () => isAnimating;

const timelineMock = {
  to: vi.fn((target: Element, vars: { onComplete?: () => void; onStart?: () => void; x?: string | number; duration?: number; ease?: string }) => {
    currentAnimation = { target, vars };
    startAnimation();
    return timelineMock;
  }),
  from: vi.fn(() => timelineMock),
  fromTo: vi.fn(() => timelineMock),
  set: vi.fn(() => timelineMock),
  add: vi.fn(() => timelineMock),
  defaults: {
    duration: 1,
    ease: 'none',
  }
} as unknown as GsapTimeline;

const ticker: GsapTicker = {
  add: vi.fn(),
  remove: vi.fn()
};

const gsapInstance: GsapInstance = {
  to: vi.fn((target: Element, vars: { onComplete?: () => void; onStart?: () => void; x?: string | number; duration?: number; ease?: string }) => {
    currentAnimation = { target, vars };
    startAnimation();
    const tween = new Tween();
    Object.assign(tween, {
      kill: vi.fn(() => {
        completeAnimation();
        return tween;
      }),
      ...gsapInstance
    });
    return tween;
  }),
  from: vi.fn(() => timelineMock),
  fromTo: vi.fn(() => timelineMock),
  set: vi.fn(() => timelineMock),
  timeline: vi.fn(() => timelineMock),
  core: {
    Animation,
    Timeline,
    Tween
  },
  plugins: {},
  utils: {
    toArray: vi.fn(),
    selector: vi.fn(),
    mapRange: vi.fn(),
    clamp: vi.fn(),
    getUnit: vi.fn(),
  },
  config: {},
  version: '3.12.2',
  ticker,
  registerPlugin: vi.fn(),
  install: vi.fn(),
  effects: {},
  globalTimeline: {
    clear: vi.fn()
  },
  context: vi.fn(),
  exportRoot: vi.fn(),
  getById: vi.fn(),
  getProperty: vi.fn(),
  getTweensOf: vi.fn(),
  killTweensOf: vi.fn(),
  parseEase: vi.fn(),
  quickTo: vi.fn(),
  registerEffect: vi.fn(),
  matchMedia: vi.fn(),
  matchMediaRefresh: vi.fn(),
  registerEase: vi.fn(),
  updateRoot: vi.fn(),
  defaults: {
    duration: 0.5,
    ease: 'power2.out'
  },
  delayedCall: vi.fn(),
  isTweening: vi.fn(),
  quickSetter: vi.fn(),
  isAnimating: () => isAnimating
};

export const gsapMock = {
  gsap: gsapInstance
};

// Also export helper functions and types for testing
export {
  Animation,
  Timeline,
  Tween
}; 