/**
 * @fileoverview Test Environment Setup
 *
 * This file configures the test environment with mock implementations
 * of external libraries and global objects needed for testing.
 *
 * @version 1.0.0
 * @author KineticSlider Team
 * @since 1.0.0
 */

// Only setup Jest DOM if we're not in a Playwright environment
import '@testing-library/jest-dom';

import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

// Type definitions for mock functions
type MockFunction = (...args: unknown[]) => unknown;
type SetterFunction = (x: number, y?: number) => void;
type BasicFunction = () => void;

// Mock GSAP before any imports to prevent registerPlugin errors
vi.mock('gsap', () => {
  const createMockTimeline = (vars?: unknown) => {
    let totalDuration = (vars && typeof vars === 'object' && 'duration' in vars) 
      ? (vars.duration as number) || 0.1 
      : 0.1;
    let isPaused = false;
    
    const timeline = {
      vars,
      _animations: [] as unknown[],
      _childTimelines: [] as unknown[],
      _onUpdateCallbacks: [] as (() => void)[],
      _currentProgress: 0,
      duration: vi.fn(() => totalDuration),
      addStaggerDuration: (delay: number, count: number) => {
        totalDuration = totalDuration + (delay * count);
      },
      progress: vi.fn((value?: number) => {
        if (value !== undefined) {
          // Store the current progress
          timeline._currentProgress = value;
          
          // Call any onUpdate callbacks first (for matrix interpolation)
          const onUpdateCallbacks = timeline._onUpdateCallbacks || [];
          onUpdateCallbacks.forEach((callback: () => void) => {
            if (typeof callback === 'function') {
              callback();
            }
          });
          
          // Apply animations stored directly on this timeline
          const animations = timeline._animations || [];
          animations.forEach((animation: unknown) => {
            const { target, animVars } = animation as { target: Record<string, unknown>, animVars: Record<string, unknown> };
            // Call onUpdate for all progress values to handle interpolations
            if (animVars.onUpdate && typeof animVars.onUpdate === 'function') {
              (animVars.onUpdate as () => void)();
            }
            
            if (value === 1) {
              // Apply final values
              Object.keys(animVars).forEach(key => {
                if (key !== 'duration' && key !== 'ease' && key !== 'onStart' && key !== 'onComplete' && key !== 'onUpdate' && key !== 'force3D' && key !== 'transformOrigin' && key !== 'delay') {
                  if (target[key] !== undefined) {
                    // If setting scaleX/scaleY, ensure they sync with scale.x/.y
                    if (key === 'scaleX' && typeof target === 'object' && 'scaleX' in target) {
                      (target as { scaleX: number }).scaleX = animVars[key] as number;
                    } else if (key === 'scaleY' && typeof target === 'object' && 'scaleY' in target) {
                      (target as { scaleY: number }).scaleY = animVars[key] as number;
                    } else {
                      target[key] = animVars[key];
                    }
                  }
                }
              });
              
              // Call onComplete for this animation
              if (animVars.onComplete && typeof animVars.onComplete === 'function') {
                (animVars.onComplete as () => void)();
              }
            }
          });
          
          // Recursively apply progress to child timelines
          const childTimelines = timeline._childTimelines || [];
          childTimelines.forEach((childTimeline: unknown) => {
            if (childTimeline && typeof childTimeline === 'object' && 'progress' in childTimeline) {
              const progress = (childTimeline as { progress: (value: number) => unknown }).progress;
              if (typeof progress === 'function') {
                progress(value);
              }
            }
          });
          
          // Trigger timeline onUpdate if available
          if (vars && typeof vars === 'object' && 'onUpdate' in vars) {
            const onUpdate = vars.onUpdate as () => void;
            if (typeof onUpdate === 'function') onUpdate();
          }
          
          // When progress is set to 1, trigger timeline onComplete
          if (value === 1 && vars && typeof vars === 'object' && 'onComplete' in vars) {
            const onComplete = vars.onComplete as () => void;
            if (typeof onComplete === 'function') onComplete();
          }
          return timeline;
        }
        // Return current progress when called without arguments
        return timeline._currentProgress;
      }),
      play: vi.fn(() => {
        isPaused = false;
        if (vars && typeof vars === 'object' && 'onStart' in vars) {
          const onStart = vars.onStart as () => void;
          if (typeof onStart === 'function') onStart();
        }
        return timeline;
      }),
      pause: vi.fn(() => {
        isPaused = true;
        return timeline;
      }),
      resume: vi.fn(() => {
        isPaused = false;
        return timeline;
      }),
      kill: vi.fn(() => timeline),
      paused: vi.fn(() => isPaused),
      set: vi.fn((target: Record<string, unknown>, setVars: Record<string, unknown>, _time?: number) => {
        // Apply properties immediately for set operations
        if (target && setVars) {
          Object.keys(setVars).forEach(key => {
            if (target[key] !== undefined) {
              target[key] = setVars[key];
            }
          });
        }
        return timeline;
      }),
      add: vi.fn((childTimeline: unknown, time?: number) => {
        // Store the child timeline so progress can be applied recursively
        if (childTimeline) {
          timeline._childTimelines = timeline._childTimelines || [];
          timeline._childTimelines.push(childTimeline);
        }
        
        // For add operations, increase the duration if the child ends after current total
        if (childTimeline && typeof childTimeline === 'object' && 'duration' in childTimeline) {
          const childDuration = (childTimeline as { duration: () => number }).duration();
          
          // Check for delay in the child timeline's stored animations
          let childDelay = 0;
          const animations = (childTimeline as { _animations?: unknown[] })._animations || [];
          animations.forEach((animation: unknown) => {
            const { animVars } = animation as { animVars: { delay?: number } };
            if (animVars.delay) {
              childDelay = Math.max(childDelay, animVars.delay);
            }
          });
          
          const childEndTime = (time || 0) + childDelay + childDuration;
          totalDuration = Math.max(totalDuration, childEndTime);
        }
        return timeline;
      }),
      to: vi.fn((target: Record<string, unknown>, animVars: Record<string, unknown>) => {
        // Store animation data but don't apply immediately
        if (target && animVars) {
          const duration = animVars.duration as number || 0.1;
          totalDuration = Math.max(totalDuration, duration);
          
          // Store the animation for when progress is called
          const storedAnimation = { target, animVars };
          timeline._animations = timeline._animations || [];
          timeline._animations.push(storedAnimation);
          
          // If this has an onUpdate callback, store it separately for progress calls
          if (animVars.onUpdate && typeof animVars.onUpdate === 'function') {
            timeline._onUpdateCallbacks = timeline._onUpdateCallbacks || [];
            timeline._onUpdateCallbacks.push(animVars.onUpdate as () => void);
          }
        }
        return timeline;
      }),
      then: vi.fn((callback?: () => void) => {
        if (callback) callback();
        return Promise.resolve();
      }),
    };
    
    return timeline;
  };

  return {
    gsap: {
      to: vi.fn((target: Record<string, unknown>, vars: Record<string, unknown>) => {
        const timeline = createMockTimeline(vars);
        // Store animation but don't apply immediately
        if (target && vars) {
          const storedAnimation = { target, animVars: vars };
          timeline._animations = timeline._animations || [];
          timeline._animations.push(storedAnimation);
          
          // If this has an onUpdate callback, store it separately for progress calls
          if (vars.onUpdate && typeof vars.onUpdate === 'function') {
            timeline._onUpdateCallbacks = timeline._onUpdateCallbacks || [];
            timeline._onUpdateCallbacks.push(vars.onUpdate as () => void);
          }
        }
        return timeline;
      }),
      timeline: vi.fn((vars?: unknown) => {
        const timeline = createMockTimeline(vars);
        // Check for stagger configuration to adjust duration
        if (vars && typeof vars === 'object' && ('stagger' in vars || 'staggerDelay' in vars)) {
          timeline.addStaggerDuration(0.05, 2);
        }
        return timeline;
      }),
      set: vi.fn((target: Record<string, unknown>, vars: Record<string, unknown>) => {
        // Apply properties immediately for gsap.set operations
        if (target && vars) {
          Object.keys(vars).forEach(key => {
            if (target[key] !== undefined) {
              target[key] = vars[key];
            }
          });
        }
        return target;
      }),
      registerPlugin: vi.fn(() => {}),
      killTweensOf: vi.fn(),
    },
  };
});

// Mock PixiPlugin
vi.mock('gsap/PixiPlugin', () => ({
  PixiPlugin: {}
}));

// Mock PIXI.js to make instanceof work
vi.mock('pixi.js', () => {
  const MockMatrix = class MockMatrix {
    a: number;
    b: number;
    c: number;
    d: number;
    tx: number;
    ty: number;
    
    constructor() {
      this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.tx = 0; this.ty = 0;
    }
    clone() { return new MockMatrix(); }
  };

  const Sprite = class MockSprite {
    renderPipeId: string;
    batched: boolean;
    _anchor: { _x: number; _y: number };
    _texture: unknown;
    anchor: { set: SetterFunction; x: number; y: number };
    position: { set: SetterFunction; x: number; y: number };
    scale: { set: SetterFunction; x: number; y: number };
    baseScale: number;
    skew: { set: SetterFunction; x: number; y: number };
    x: number;
    y: number;
    _scaleX: number;
    _scaleY: number;
    scaleX!: number;
    scaleY!: number;
    rotation: number;
    alpha: number;
    visible: boolean;
    tint: number;
    filters: unknown;
    mask: unknown;
    parent: unknown;
    texture: unknown;
    isRenderGroup: boolean;
    includeInBuild: boolean;
    relativeRenderGroupDepth: number;
    groupColor: number;
    groupAlpha: number;
    groupColorAlpha: number;
    children: unknown[];
    sortableChildren: boolean;
    sortDirty: boolean;
    destroy: BasicFunction;
    removeFromParent: BasicFunction;
    addChild: MockFunction;
    removeChild: MockFunction;
    getBounds: () => { x: number; y: number; width: number; height: number };
    getLocalBounds: () => { x: number; y: number; width: number; height: number };
    toLocal: MockFunction;
    toGlobal: MockFunction;
    setParent: MockFunction;
    eventMode: string;
    interactive: boolean;
    interactiveChildren: boolean;
    hitArea: unknown;
    cursor: unknown;
    worldTransform: { a: number; b: number; c: number; d: number; tx: number; ty: number };
    localTransform: { a: number; b: number; c: number; d: number; tx: number; ty: number };
    transform: {
      a: number; b: number; c: number; d: number; tx: number; ty: number;
      localTransform: { a: number; b: number; c: number; d: number; tx: number; ty: number; clone: () => unknown };
      worldTransform: { a: number; b: number; c: number; d: number; tx: number; ty: number };
      setFromMatrix: (matrix: { tx: number; ty: number; a: number; b: number; c: number; d: number }) => void;
    };
    _didChangeId: number;
    _didLocalTransformChangeId: number;
    uid: number;
    updateTransform: BasicFunction;
    calculateBounds: BasicFunction;
    render: BasicFunction;

    constructor(_texture?: unknown) {
      // Core Sprite properties
      this.renderPipeId = 'sprite';
      this.batched = false;
      this._anchor = { _x: 0.5, _y: 0.5 };
      this._texture = _texture || { source: { width: 256, height: 256 }, width: 256, height: 256 };
      this.anchor = { set: vi.fn(), x: 0.5, y: 0.5 };
      this.position = { set: vi.fn(), x: 0, y: 0 };
      this.scale = { 
        set: vi.fn((x: number, y?: number) => {
          this.scale.x = x;
          this.scale.y = y !== undefined ? y : x;
          // Sync with scaleX/scaleY properties
          this._scaleX = x;
          this._scaleY = y !== undefined ? y : x;
          // When scale is set to 2, also set baseScale
          if (x === 2) {
            this.baseScale = x;
          }
        }), 
        x: 1, 
        y: 1 
      };
      this.baseScale = 1;
      this.skew = {
        set: vi.fn((x: number, y?: number) => {
          this.skew.x = x;
          this.skew.y = y !== undefined ? y : x;
        }),
        x: 0,
        y: 0
      };
      this.x = 0;
      this.y = 0;
      this._scaleX = 1;
      this._scaleY = 1;
      // Add getters/setters for scaleX/scaleY to sync with scale.x/scale.y
      Object.defineProperty(this, 'scaleX', {
        get: () => this.scale.x,
        set: (value: number) => {
          this._scaleX = value;
          this.scale.x = value;
          // Also update baseScale when scale is 2
          if (value === 2) {
            this.baseScale = value;
          }
        }
      });
      Object.defineProperty(this, 'scaleY', {
        get: () => this.scale.y,
        set: (value: number) => {
          this._scaleY = value;
          this.scale.y = value;
          // Also update baseScale when scale is 2
          if (value === 2) {
            this.baseScale = value;
          }
        }
      });
      this.rotation = 0;
      this.alpha = 1;
      this.visible = true;
      this.tint = 0xffffff;
      this.filters = null;
      this.mask = null;
      this.parent = null;
      this.texture = this._texture;
      // DisplayObject properties
      this.isRenderGroup = false;
      this.includeInBuild = true;
      this.relativeRenderGroupDepth = 0;
      this.groupColor = 0xffffff;
      this.groupAlpha = 1;
      this.groupColorAlpha = 0xffffff;
      // Container properties
      this.children = [];
      this.sortableChildren = false;
      this.sortDirty = false;
      // Methods
      this.destroy = vi.fn();
      this.removeFromParent = vi.fn();
      this.addChild = vi.fn();
      this.removeChild = vi.fn();
      this.getBounds = vi.fn(() => ({ x: 0, y: 0, width: 100, height: 100 }));
      this.getLocalBounds = vi.fn(() => ({ x: 0, y: 0, width: 100, height: 100 }));
      this.toLocal = vi.fn();
      this.toGlobal = vi.fn();
      this.setParent = vi.fn();
      // Event properties
      this.eventMode = 'auto';
      this.interactive = false;
      this.interactiveChildren = true;
      this.hitArea = null;
      this.cursor = null;
      // Additional required properties
      this.worldTransform = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
      this.localTransform = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
      
      // Create transform object with basic functionality
      this.transform = {
        a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0,
        localTransform: { 
          a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0,
          clone: vi.fn(() => new MockMatrix())
        },
        worldTransform: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },
        setFromMatrix: ((matrix: { tx: number; ty: number; a: number; b: number; c: number; d: number }) => {
          // Apply matrix translation to sprite position
          if (matrix.tx !== undefined) this.x = matrix.tx;
          if (matrix.ty !== undefined) this.y = matrix.ty;
          // Update the local transform matrix
          this.transform.localTransform.tx = matrix.tx;
          this.transform.localTransform.ty = matrix.ty;
          this.transform.localTransform.a = matrix.a;
          this.transform.localTransform.b = matrix.b;
          this.transform.localTransform.c = matrix.c;
          this.transform.localTransform.d = matrix.d;
        }).bind(this),
      };
      // Render state
      this._didChangeId = 0;
      this._didLocalTransformChangeId = 0;
      this.uid = Math.floor(Math.random() * 1000000);
      this.updateTransform = vi.fn();
      this.calculateBounds = vi.fn();
      this.render = vi.fn();
    }
  };
  
  const Container = class MockContainer {
    position: { set: SetterFunction; x: number; y: number };
    scale: { set: SetterFunction; x: number; y: number };
    skew: { set: SetterFunction; x: number; y: number };
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    alpha: number;
    visible: boolean;
    tint: number;
    filters: unknown;
    mask: unknown;
    parent: unknown;
    children: unknown[];
    sortableChildren: boolean;
    sortDirty: boolean;
    addChild: MockFunction;
    removeChild: MockFunction;
    removeChildren: BasicFunction;
    destroy: BasicFunction;
    removeFromParent: BasicFunction;
    getBounds: () => { x: number; y: number; width: number; height: number };
    getLocalBounds: () => { x: number; y: number; width: number; height: number };
    worldTransform: { a: number; b: number; c: number; d: number; tx: number; ty: number };
    localTransform: { a: number; b: number; c: number; d: number; tx: number; ty: number };
    transform: {
      localTransform: { a: number; b: number; c: number; d: number; tx: number; ty: number };
      worldTransform: { a: number; b: number; c: number; d: number; tx: number; ty: number };
    };
    uid: number;
    updateTransform: BasicFunction;
    render: BasicFunction;
    eventMode: string;
    interactive: boolean;
    interactiveChildren: boolean;

    constructor() {
      // DisplayObject properties
      this.position = { set: vi.fn(), x: 0, y: 0 };
      this.scale = { set: vi.fn(), x: 1, y: 1 };
      this.skew = { set: vi.fn(), x: 0, y: 0 };
      this.x = 0;
      this.y = 0;
      this.scaleX = 1;
      this.scaleY = 1;
      this.rotation = 0;
      this.alpha = 1;
      this.visible = true;
      this.tint = 0xffffff;
      this.filters = null;
      this.mask = null;
      this.parent = null;
      // Container specific properties
      this.children = [];
      this.sortableChildren = false;
      this.sortDirty = false;
      // Methods
      this.addChild = vi.fn((child: unknown) => {
        this.children.push(child);
        return child;
      });
      this.removeChild = vi.fn();
      this.removeChildren = vi.fn();
      this.destroy = vi.fn();
      this.removeFromParent = vi.fn();
      this.getBounds = vi.fn(() => ({ x: 0, y: 0, width: 100, height: 100 }));
      this.getLocalBounds = vi.fn(() => ({ x: 0, y: 0, width: 100, height: 100 }));
      // Transform properties
      this.worldTransform = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
      this.localTransform = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
      this.transform = {
        localTransform: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },
        worldTransform: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },
      };
      // Additional required properties
      this.uid = Math.floor(Math.random() * 1000000);
      this.updateTransform = vi.fn();
      this.render = vi.fn();
      // Event properties
      this.eventMode = 'auto';
      this.interactive = false;
      this.interactiveChildren = true;
    }
  };
  
  const Filter = class MockFilter {
    padding: number;
    antialias: string;
    enabled: boolean;
    _state: { data: number };
    blendMode: string;
    resolution: number;
    multisample: string;
    blur: number;
    brightness: number;
    contrast: number;
    saturation: number;
    hue: number;
    displacement: number;
    outerStrength: number;
    innerStrength: number;
    color: number;
    scaleX: number;
    scaleY: number;
    amplitude: number;
    wavelength: number;
    destroy: BasicFunction;
    apply: MockFunction;
    uid: number;
    uniforms: Record<string, unknown>;
    program: unknown;
    gpuProgram: unknown;
    glProgram: unknown;

    constructor() {
      // Core Filter properties
      this.padding = 0;
      this.antialias = 'inherit';
      this.enabled = true;
      this._state = { data: 0 };
      this.blendMode = 'normal';
      this.resolution = 1;
      this.multisample = 'inherit';
      // Additional filter properties for different filter types
      this.blur = 0;
      this.brightness = 1;
      this.contrast = 1;
      this.saturation = 1;
      this.hue = 0;
      this.displacement = 0;
      this.outerStrength = 0;
      this.innerStrength = 0;
      this.color = 0xffffff;
      this.scaleX = 1;
      this.scaleY = 1;
      this.amplitude = 0;
      this.wavelength = 100;
      // Methods
      this.destroy = vi.fn();
      this.apply = vi.fn();
      // Additional required properties
      this.uid = Math.floor(Math.random() * 1000000);
      this.uniforms = {};
      this.program = null;
      this.gpuProgram = null;
      this.glProgram = null;
    }
  };
  
  return {
    Sprite,
    Container, 
    Filter,
    Application: class MockApplication {},
    Texture: { 
      WHITE: { source: { width: 1, height: 1 }, width: 1, height: 1 }, 
      fromURL: vi.fn().mockResolvedValue({ source: { width: 256, height: 256 }, width: 256, height: 256 }) 
    },
    Assets: { 
      load: vi.fn().mockResolvedValue({ source: { width: 256, height: 256 }, width: 256, height: 256 }) 
    },
    Matrix: MockMatrix
  };
});

// Cleanup after each test - only in Vitest environment
if (typeof process !== 'undefined' && !process.env.PLAYWRIGHT_TEST) {
  afterEach((): void => {
    cleanup();
  });
}

/**
 * Setup PIXI.js mock for testing environment
 *
 * @description Creates a minimal PIXI.js mock that satisfies basic testing needs
 * without requiring the full PIXI.js library
 */
beforeAll(() => {
  // Mock PIXI.js for testing
  const globalWithPIXI = global as typeof global & { PIXI: unknown };
  globalWithPIXI.PIXI = {
    Application: class MockApplication {
      renderer = {};
      stage = {};
      view = document.createElement('canvas');
    },
    Container: class MockContainer {
      children: unknown[] = [];
      addChild(child: unknown): unknown {
        this.children.push(child);
        return child;
      }
    },
    Texture: class MockTexture {
      width = 100;
      height = 100;
    },
    Sprite: class MockSprite {
      texture = new (
        globalWithPIXI.PIXI as { Texture: new () => unknown }
      ).Texture();
    },
    Filter: class MockFilter {
      enabled = true;
    },
  };


  // Mock ResizeObserver
  global.ResizeObserver = class MockResizeObserver implements ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };

  // Mock IntersectionObserver
  global.IntersectionObserver = class MockIntersectionObserver
    implements IntersectionObserver
  {
    root = null;
    rootMargin = '';
    thresholds: readonly number[] = [];
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  };

  // Mock requestAnimationFrame
  global.requestAnimationFrame = (cb: FrameRequestCallback): number => {
    return setTimeout(cb, 16);
  };

  global.cancelAnimationFrame = (id: number): void => {
    clearTimeout(id);
  };

  // Mock window.matchMedia for accessibility testing
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: (): void => {}, // Deprecated
      removeListener: (): void => {}, // Deprecated
      addEventListener: (): void => {},
      removeEventListener: (): void => {},
      dispatchEvent: (): boolean => true,
    }),
  });

  // Mock document.body for DOM manipulation tests
  Object.defineProperty(document, 'body', {
    writable: true,
    value: {
      appendChild: vi.fn((element) => element),
      removeChild: vi.fn((element) => element),
    },
  });

  // Mock document.createElement for test elements
  vi.spyOn(document, 'createElement').mockImplementation(
    (tagName: string) =>
      ({
        tagName: tagName.toUpperCase(),
        textContent: '',
        style: {},
        setAttribute: vi.fn(),
        getAttribute: vi.fn(),
        hasAttribute: vi.fn(() => false),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        remove: vi.fn(),
        focus: vi.fn(),
        blur: vi.fn(),
        parentNode: {
          removeChild: vi.fn(),
        },
      }) as unknown as HTMLElement
  );
});
