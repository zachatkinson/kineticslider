/**
 * Mock types for testing
 */

/**
 * Mock PIXI.js types
 */
export interface MockPixiApplication {
  stage: MockPixiContainer;
  renderer: {
    view: HTMLCanvasElement;
    resize: (width: number, height: number) => void;
  };
  destroy: () => void;
}

export interface MockPixiContainer {
  addChild: (child: MockPixiSprite) => void;
  removeChild: (child: MockPixiSprite) => void;
  children: MockPixiSprite[];
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
}

export interface MockPixiAssets {
  load: (url: string) => Promise<any>;
  unload: (url: string) => void;
}

/**
 * Mock GSAP types
 */
export interface MockGsap {
  to: (target: any, vars: any) => any;
  timeline: (vars?: any) => any;
  ticker: {
    add: (callback: () => void) => void;
    remove: (callback: () => void) => void;
  };
}

/**
 * Mock test result type
 */
export type MockResult<T> = {
  success: boolean;
  data?: T;
  error?: Error;
};

/**
 * Mock touch event options that matches browser's TouchInit interface
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
 */
export interface MockResizeObserver {
  observe: (target: Element) => void;
  unobserve: (target: Element) => void;
  disconnect: () => void;
}

/**
 * Mock IntersectionObserver type
 */
export interface MockIntersectionObserver extends IntersectionObserver {
  observe: (target: Element) => void;
  unobserve: (target: Element) => void;
  disconnect: () => void;
  takeRecords: () => IntersectionObserverEntry[];
} 