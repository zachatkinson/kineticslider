/**
 * Test-specific type definitions
 */
import type { Mock } from 'vitest';

export interface MockTimelineVars {
  paused?: boolean;
  repeat?: number;
  repeatDelay?: number;
  yoyo?: boolean;
  defaults?: {
    duration?: number;
    ease?: string;
  };
}

export interface MockTimeline {
  to: Mock;
  from: Mock;
  fromTo: Mock;
  set: Mock;
  play: Mock;
  pause: Mock;
  progress: Mock;
  kill: Mock;
  add: Mock;
}

export interface MockGsap {
  timeline: (vars?: MockTimelineVars) => MockTimeline;
  to: Mock;
  set: Mock;
  quickSetter: Mock;
  killTweensOf: Mock;
}

export interface ToVars {
  [key: string]: any;
  duration?: number;
  delay?: number;
  ease?: string;
  onComplete?: () => void;
  onStart?: () => void;
  onUpdate?: () => void;
}

export interface TweenInstance {
  kill: () => void;
  pause: () => void;
  play: () => void;
  progress: (value?: number) => number;
  restart: () => void;
  resume: () => void;
  reverse: () => void;
  seek: (position: number | string) => void;
  timeScale: (value?: number) => number;
}

export interface TimelineInstance extends TweenInstance {
  add: (tween: TweenInstance, position?: string | number) => TimelineInstance;
  to: (target: Element | string, vars: ToVars) => TimelineInstance;
  from: (target: Element | string, vars: ToVars) => TimelineInstance;
  fromTo: (
    target: Element | string,
    fromVars: ToVars,
    toVars: ToVars
  ) => TimelineInstance;
}

export interface MockAnimation {
  kill: () => void;
  getTarget: () => HTMLElement | SVGElement | null;
  getConfig: () => Record<string, any>;
}

/**
 * Touch API mock interfaces
 */
export interface TouchInit {
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

/**
 * Mock function type for custom matchers
 */
export type MockFunction = {
  getMockName(): string;
  mock: {
    calls: unknown[][];
  };
};

// Extend global for test environment
declare global {
  var gsapMock: MockGsap;

  var timelineMock: MockTimeline;
}
