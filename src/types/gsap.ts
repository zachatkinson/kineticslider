/**
 * GSAP animation types and interfaces
 */

export interface GsapTween {
  kill: () => GsapTween;
  pause: () => GsapTween;
  play: () => GsapTween;
  progress: (value?: number) => number | GsapTween;
  restart: () => GsapTween;
  reverse: () => GsapTween;
  timeScale: (value?: number) => number | GsapTween;
}

export interface GsapVars {
  duration?: number;
  delay?: number;
  ease?: string | ((t: number) => number);
  onComplete?: () => void;
  onStart?: () => void;
  onUpdate?: () => void;
  [key: string]: unknown;
}

export interface GsapTicker {
  add: (fn: () => void) => void;
  remove: (fn: () => void) => void;
}

export interface GsapTimeline extends GsapTween {
  to: (target: Element | string | object, vars: GsapVars) => GsapTimeline;
  from: (target: Element | string | object, vars: GsapVars) => GsapTimeline;
  fromTo: (
    target: Element | string | object,
    fromVars: GsapVars,
    toVars: GsapVars
  ) => GsapTimeline;
  set: (target: Element | string | object, vars: GsapVars) => GsapTimeline;
  add: (child: GsapTimeline | GsapTween) => GsapTimeline;
  defaults: {
    duration: number;
    ease: string;
  };
}

export interface GsapTimelineDefaults {
  duration?: number;
  ease?: string;
  force3D?: boolean;
  lazy?: boolean;
  clearProps?: string;
  overwrite?: boolean | 'auto';
  immediateRender?: boolean;
  onComplete?: () => void;
}

export interface GsapEventCallback {
  (type: string, callback: () => void): GsapTimeline;
}

export interface GsapInstance {
  to: (target: Element | string | object, vars: GsapVars) => GsapTween;
  from: (target: Element | string | object, vars: GsapVars) => GsapTween;
  fromTo: (
    target: Element | string | object,
    fromVars: GsapVars,
    toVars: GsapVars
  ) => GsapTween;
  set: (target: Element | string | object, vars: GsapVars) => void;
  timeline: (vars?: GsapTimelineDefaults) => GsapTimeline;
  isAnimating: () => boolean;
  core: {
    Animation: unknown;
    Timeline: unknown;
    Tween: unknown;
  };
  plugins: Record<string, unknown>;
  utils: {
    toArray: <T>(value: T | T[] | NodeList | HTMLCollection) => T[];
    selector: (value: string) => Element | null;
    mapRange: (
      inMin: number,
      inMax: number,
      outMin: number,
      outMax: number,
      value: number
    ) => number;
    clamp: (min: number, max: number, value: number) => number;
    getUnit: (value: string) => string;
  };
  config: Record<string, unknown>;
  version: string;
  ticker: GsapTicker;
  registerPlugin: (...args: unknown[]) => void;
  install: (...args: unknown[]) => void;
  effects: Record<string, unknown>;
  globalTimeline: {
    clear: () => void;
  };
  context: (func: () => void) => void;
  exportRoot: () => GsapTimeline;
  getById: (id: string) => GsapTween | null;
  getProperty: (target: Element | string, property: string) => string | number;
  getTweensOf: (target: Element | string) => GsapTween[];
  killTweensOf: (target: Element | string) => void;
  parseEase: (ease: string) => (progress: number) => number;
  quickTo: (
    target: Element | string,
    property: string,
    vars?: GsapVars
  ) => (value: number) => void;
  registerEffect: (effectConfig: Record<string, unknown>) => void;
  matchMedia: (mediaQuery: string) => {
    add: (callback: () => void) => void;
    remove: (callback: () => void) => void;
  };
  matchMediaRefresh: () => void;
  registerEase: (name: string, ease: (progress: number) => number) => void;
  updateRoot: () => void;
  defaults: {
    duration: number;
    ease: string;
  };
  delayedCall: (
    delay: number,
    callback: () => void,
    params?: unknown[]
  ) => GsapTween;
  isTweening: (target: Element | string) => boolean;
  quickSetter: (
    target: Element | string,
    property: string,
    unit?: string
  ) => (value: number | string) => void;
}
