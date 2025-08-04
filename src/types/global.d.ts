/**
 * @fileoverview Global Type Declarations for KineticSlider
 *
 * This file contains global type declarations and ambient module definitions
 * for external libraries and browser APIs used throughout the KineticSlider project.
 * These declarations ensure proper TypeScript integration with external dependencies.
 *
 * @version 1.0.0
 * @author KineticSlider Team
 * @since 1.0.0
 */

/**
 * Global type declarations for external libraries
 *
 * These declarations provide TypeScript support for libraries that may not
 * have complete type definitions or require custom augmentation.
 */

/**
 * PIXI.js Application instance for slider rendering
 *
 * @global
 * @namespace PIXI
 * @description Global PIXI.js namespace for WebGL-based rendering
 */
declare global {
  /**
   * KineticSlider Engine interface for testing
   */
  interface KineticSliderEngine {
    getCurrentIndex?: () => number;
    isPlaying?: () => boolean;
    getState?: () => {
      isInitialized: boolean;
      isPlaying: boolean;
      isTransitioning: boolean;
      currentIndex: number;
      totalSlides: number;
    };
    nextSlide?: () => Promise<void>;
    previousSlide?: () => Promise<void>;
    play?: () => void;
    pause?: () => void;
    goToSlide?: (index: number, animated?: boolean) => Promise<void>;
    togglePlayPause?: () => void;
    getTotalSlides?: () => number;
  }
  /**
   * Window interface extensions for slider-specific globals
   */
  interface Window {
    /**
     * Debug flag for development mode
     * @type {boolean}
     */
    __KINETIC_SLIDER_DEBUG__?: boolean;

    /**
     * Performance monitoring flag
     * @type {boolean}
     */
    __KINETIC_SLIDER_PERF__?: boolean;

    /**
     * Global PIXI application instance reference
     * @type {unknown}
     */
    __KINETIC_SLIDER_PIXI__?: unknown;

    /**
     * Global KineticSlider instance for testing
     * @type {object}
     */
    kineticSlider?: {
      engine?: KineticSliderEngine;
    };

    /**
     * Global KineticSlider configuration for E2E tests
     * @type {object}
     */
    kineticSliderConfig?: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ConfigurationSystem: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ConfigValidator: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      DefaultsManager: any;
    };

    /**
     * Keyboard debug information for testing
     * @type {object}
     */
    __keyboardDebug?: {
      lastKey?: string;
      keyCount?: number;
      enabled?: boolean;
      length?: number;
    };

    /**
     * PIXI.js global instance for testing
     * @type {object}
     */
    PIXI?: {
      Application: unknown;
      Container: unknown;
      Sprite: unknown;
      Texture: unknown;
      Assets: { load: (url: string) => Promise<unknown> };
      Filter: unknown;
    };

    /**
     * Slider instance for testing
     * @type {object}
     */
    sliderInstance?: {
      getCurrentIndex: () => number;
      isPlaying: () => boolean;
      getState: () => unknown;
      nextSlide: () => Promise<void>;
      previousSlide: () => Promise<void>;
      play: () => void;
      pause: () => void;
      goToSlide: (index: number) => Promise<void>;
      togglePlayPause: () => void;
    };

    /**
     * Test-specific error tracking
     */
    __sliderInitErrors?: unknown[];
    __serviceInitErrors?: Array<{ service: string; error: unknown }>;
    __lastInitError?: { message: string };
    __filterInitError?: { name: string; error: unknown };
  }

  /**
   * Performance API extensions for custom metrics
   */
  interface Performance {
    /**
     * Memory usage information (Chrome-specific)
     * @type {object}
     */
    memory?: {
      /** Used heap size in bytes */
      usedJSHeapSize: number;
      /** Total heap size in bytes */
      totalJSHeapSize: number;
      /** Heap size limit in bytes */
      jsHeapSizeLimit: number;
    };
  }

  /**
   * Navigator API extensions for device capabilities
   */
  interface Navigator {
    /**
     * Device memory information (experimental)
     * @type {number}
     */
    deviceMemory?: number;

    /**
     * Hardware concurrency (CPU cores)
     * @type {number}
     */
    hardwareConcurrency?: number;

    /**
     * Connection information for adaptive loading
     * @type {object}
     */
    connection?: {
      /** Effective connection type */
      effectiveType: string;
      /** Downlink speed estimate */
      downlink: number;
      /** Round-trip time estimate */
      rtt: number;
    };
  }

  /**
   * NodeJS global object extensions for testing
   */

  declare var global: typeof globalThis & {
    /** PIXI.js mock for testing */
    PIXI?: unknown;
    /** GSAP mock for testing */
    gsap?: unknown;
  };
}

/**
 * Module augmentations for external libraries
 */

/**
 * PIXI.js namespace declaration for global usage
 *
 * @namespace PIXI
 * @description Global PIXI.js namespace for WebGL-based rendering
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Global namespace declaration for type support
declare namespace PIXI {
  /**
   * PIXI Application class
   */
  export class Application {
    /** Application renderer */
    renderer: unknown;
    /** Application stage */
    stage: unknown;
    /** Application view canvas */
    view: HTMLCanvasElement;
  }

  /**
   * PIXI Container class
   */
  export class Container {
    /** Child containers */
    children: Container[];
    /** Add child */
    addChild(child: Container): Container;
  }

  /**
   * PIXI Texture class
   */
  export class Texture {
    /** Texture width */
    width: number;
    /** Texture height */
    height: number;
  }

  /**
   * PIXI Filter base class
   */
  export class Filter {
    /** Filter enabled state */
    enabled: boolean;
  }

  /**
   * PIXI Point class
   */
  export class Point {
    /** X coordinate */
    x: number;
    /** Y coordinate */
    y: number;
  }
}

/**
 * GSAP namespace declaration for global usage
 *
 * @namespace gsap
 * @description Global GSAP namespace for animations
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Global namespace declaration for type support
declare namespace gsap {
  /**
   * GSAP to method for animations
   */
  export function to(target: unknown, vars: unknown): unknown;

  /**
   * GSAP timeline method
   */
  export function timeline(vars?: unknown): unknown;
}

/**
 * GSAP (GreenSock Animation Platform) module declaration
 *
 * @module gsap
 * @description High-performance animation library for smooth transitions
 */
declare module 'gsap' {
  /**
   * GSAP timeline for complex animation sequences
   */
  export interface Timeline {
    /** Play the timeline */
    play(): Timeline;
    /** Pause the timeline */
    pause(): Timeline;
    /** Reverse the timeline */
    reverse(): Timeline;
    /** Restart the timeline */
    restart(): Timeline;
  }

  /**
   * GSAP tween for individual animations
   */
  export interface Tween {
    /** Kill the tween */
    kill(): void;
    /** Get/set progress */
    progress(value?: number): number | Tween;
  }
}

/**
 * PIXI.js module augmentation for custom filters and extensions
 *
 * @module pixi.js
 * @description WebGL-based 2D rendering library
 */
declare module 'pixi.js' {
  /**
   * Custom filter namespace for slider-specific effects
   */
  namespace filters {
    /**
     * Custom blur filter with enhanced performance
     */
    class KineticBlurFilter extends Filter {
      /** Blur strength */
      blur: number;
      /** Blur quality */
      quality: number;
    }

    /**
     * Custom displacement filter for distortion effects
     */
    class KineticDisplacementFilter extends Filter {
      /** Displacement texture */
      map: Texture;
      /** Displacement scale */
      scale: Point;
    }
  }
}

/**
 * CSS Module declarations for type-safe imports
 *
 * @description Enables importing CSS files with TypeScript support
 */
declare module '*.css' {
  /**
   * CSS module class names
   * @type {Record<string, string>}
   */
  const classes: Record<string, string>;
  export default classes;
}

declare module '*.scss' {
  /**
   * SCSS module class names
   * @type {Record<string, string>}
   */
  const classes: Record<string, string>;
  export default classes;
}

declare module '*.module.css' {
  /**
   * CSS module class names with explicit module extension
   * @type {Record<string, string>}
   */
  const classes: Record<string, string>;
  export default classes;
}

/**
 * Asset module declarations for multimedia imports
 *
 * @description Enables importing various asset types with TypeScript support
 */
declare module '*.png' {
  /**
   * PNG image asset URL
   * @type {string}
   */
  const src: string;
  export default src;
}

declare module '*.jpg' {
  /**
   * JPEG image asset URL
   * @type {string}
   */
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  /**
   * JPEG image asset URL
   * @type {string}
   */
  const src: string;
  export default src;
}

declare module '*.webp' {
  /**
   * WebP image asset URL
   * @type {string}
   */
  const src: string;
  export default src;
}

declare module '*.svg' {
  /**
   * SVG image asset URL
   * @type {string}
   */
  const src: string;
  export default src;
}

declare module '*.mp4' {
  /**
   * MP4 video asset URL
   * @type {string}
   */
  const src: string;
  export default src;
}

declare module '*.webm' {
  /**
   * WebM video asset URL
   * @type {string}
   */
  const src: string;
  export default src;
}

/**
 * Shader module declarations for WebGL effects
 *
 * @description Enables importing shader files for custom PIXI.js filters
 */
declare module '*.vert' {
  /**
   * Vertex shader source code
   * @type {string}
   */
  const shader: string;
  export default shader;
}

declare module '*.frag' {
  /**
   * Fragment shader source code
   * @type {string}
   */
  const shader: string;
  export default shader;
}

declare module '*.glsl' {
  /**
   * GLSL shader source code
   * @type {string}
   */
  const shader: string;
  export default shader;
}

export {};
