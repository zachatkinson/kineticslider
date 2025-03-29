/**
 * GSAP animation types and interfaces
 */

export interface GsapTicker {
  add: (fn: () => void) => void;
  remove: (fn: () => void) => void;
}

export interface GsapTimeline {
  to: (target: Element, vars: any) => GsapTimeline;
  from: (target: Element, vars: any) => GsapTimeline;
  fromTo: (target: Element, vars: any) => GsapTimeline;
  set: (target: Element, vars: any) => GsapTimeline;
  add: (child: any) => GsapTimeline;
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
  to: (target: Element, vars: any) => any;
  from: (target: Element, vars: any) => any;
  fromTo: (target: Element, fromVars: any, toVars: any) => any;
  set: (target: Element, vars: any) => any;
  timeline: (vars?: any) => GsapTimeline;
  isAnimating: () => boolean;
  core: {
    Animation: any;
    Timeline: any;
    Tween: any;
  };
  plugins: any;
  utils: {
    toArray: (value: any) => any[];
    selector: (value: any) => any;
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
  config: any;
  version: string;
  ticker: GsapTicker;
  registerPlugin: (...args: any[]) => void;
  install: (...args: any[]) => void;
  effects: any;
  globalTimeline: {
    clear: () => void;
  };
  context: (func: () => void) => void;
  exportRoot: () => any;
  getById: (id: string) => any;
  getProperty: (target: Element, property: string) => any;
  getTweensOf: (target: Element) => any[];
  killTweensOf: (target: Element) => void;
  parseEase: (ease: string) => any;
  quickTo: (target: Element, property: string, vars?: any) => any;
  registerEffect: (effect: any) => void;
  matchMedia: (mediaQuery: string) => any;
  matchMediaRefresh: () => void;
  registerEase: (name: string, ease: any) => void;
  updateRoot: () => void;
  defaults: {
    duration: number;
    ease: string;
  };
  delayedCall: (delay: number, callback: () => void, params?: any[]) => any;
  isTweening: (target: Element) => boolean;
  quickSetter: (
    target: Element,
    property: string,
    unit?: string
  ) => (value: any) => void;
} 