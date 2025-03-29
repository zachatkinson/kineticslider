/**
 * Type definitions for GSAP mock
 */

export interface ToVars {
  [key: string]: any;
  duration?: number;
  delay?: number;
  ease?: string;
  onComplete?: () => void;
  onStart?: () => void;
  onUpdate?: () => void;
}

export interface TimelineParams {
  paused?: boolean;
  repeat?: number;
  yoyo?: boolean;
  onComplete?: () => void;
  onStart?: () => void;
  onUpdate?: () => void;
}

export interface TweenInstance {
  kill: () => void;
  pause: () => TweenInstance;
  play: () => TweenInstance;
  progress: (value?: number) => number | TweenInstance;
  restart: () => TweenInstance;
  reverse: () => TweenInstance;
  timeScale: (value: number) => TweenInstance;
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

/**
 * Extended GSAP instance for mocks
 */
export interface GsapMockInstance {
  isAnimating: () => boolean;
  to: (target: Element | string, vars: ToVars) => TweenInstance;
  timeline: (params?: TimelineParams) => TimelineInstance;
  set: (target: Element | string, vars: any) => void;
  getById: (id: string) => TweenInstance | null;
  getTweensOf: (target: Element | string) => TweenInstance[];
  killTweensOf: (target: Element | string) => void;
  registerPlugin: (...args: any[]) => void;
  ticker: {
    remove: (fn: (...args: any[]) => void) => void;
  };
  effects: Record<string, any>;
  globalTimeline: {
    clear: () => void;
  };
}

/**
 * Mock Animation class
 */
export interface MockAnimation {
  kill: () => void;
  getTarget: () => HTMLElement | SVGElement | null;
  getConfig: () => Record<string, any>;
}

/**
 * Animation state helpers
 */
export type AnimationState = {
  isAnimating: boolean;
  currentAnimation: MockAnimation | null;
  completionCallback: (() => void) | null;
};

declare global {
  interface Window {
    gsap: GsapMockInstance;
    analytics: {
      track: (event: string, data: Record<string, unknown>) => void;
    };
    errorTracker: {
      captureError: (
        error: Error | null,
        context: Record<string, unknown>
      ) => void;
    };
  }
}

export {};
