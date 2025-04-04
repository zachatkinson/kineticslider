/**
 * Mock types for testing
 */

/**
 * Mock PIXI.js types
 * @example Example usage
 */
export interface MockPixiApplication {
  stage: MockPixiContainer;
  renderer: {
    view: HTMLCanvasElement;
    resize: (width: number, height: number) => void;
    destroy: () => void;
  };
  view: HTMLCanvasElement;
  resize: (width: number, height: number) => void;
  destroy: () => void;
}

export interface MockPixiContainer {
  addChild: (child: MockPixiSprite) => void;
  removeChild: (child: MockPixiSprite) => void;
  children: MockPixiSprite[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  scale?: {
    x: number;
    y: number;
  };
}

export interface MockPixiSprite {
  x: number;
  y: number;
  width: number;
  height: number;
  alpha: number;
  texture: {
    baseTexture: {
      resource: {
        source: HTMLImageElement;
      };
    };
  };
  anchor?: {
    set: (x: number, y: number) => void;
  };
  scale?: {
    x: number;
    y: number;
  };
  visible?: boolean;
}

export interface MockPixiAssets {
  load: (url: string) => Promise<unknown>;
  unload: (url: string) => void;
}

/**
 * Mock GSAP types
 * @example Example usage
 */
export interface MockGsap {
  to: (target: unknown, vars: Record<string, unknown>) => unknown;
  fromTo: (target: unknown, fromVars: Record<string, unknown>, toVars: Record<string, unknown>) => unknown;
  timeline: (vars?: Record<string, unknown>) => unknown;
  ticker: {
    add: (callback: () => void) => void;
    remove: (callback: () => void) => void;
  };
  set: (target: unknown, vars: Record<string, unknown>) => unknown;
  killTweensOf: (target: unknown) => void;
  getProperty: (target: unknown, property: string) => unknown;
  registerPlugin: (...plugins: unknown[]) => void;
  utils: {
    toArray: (selector: unknown) => unknown[];
  };
  config: {
    autoSleep?: number;
    force3D?: boolean;
    nullTargetWarn?: boolean;
  } | ((options: Record<string, unknown>) => void);
}

/**
 * Mock test result type
 */
export type MockResult<T> = {
  success: boolean;
  data?: T;
  error?: Error;
  loading?: boolean;
  failed?: boolean;
  value?: T;
};

/**
 * Mock touch event options that matches browser's TouchInit interface
 * @example Example usage
 */
export interface TouchOptions {
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
 * Mock ResizeObserver type
 * @example Example usage
 */
export interface MockResizeObserver {
  observe: (target: Element) => void;
  unobserve: (target: Element) => void;
  disconnect: () => void;
}

/**
 * Mock IntersectionObserver type
 * @example Example usage
 */
export interface MockIntersectionObserver extends IntersectionObserver {
  observe: (target: Element) => void;
  unobserve: (target: Element) => void;
  disconnect: () => void;
  takeRecords: () => IntersectionObserverEntry[];
}

/**
 * Mock function type
 */
export type MockFunction<T extends (...args: unknown[]) => unknown> = jest.Mock<ReturnType<T>, Parameters<T>>; 