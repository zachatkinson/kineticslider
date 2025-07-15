/**
 * @fileoverview Test Factories and Utilities
 *
 * Shared utilities to eliminate DRY violations across test suites.
 * Provides consistent test data, mocks, and common patterns.
 *
 * ✅ Phase 1.3 Complete: Comprehensive mock factories for Phase 2 readiness
 */

import { vi, expect } from 'vitest';

// Mock interfaces for test objects
interface MockMonitor {
  start?: () => void;
  stop?: () => void;
  recordAnimationStart?: () => void;
  recordAnimationEnd?: () => void;
  recordAnimationFailed?: () => void;
  getPerformanceGrade?: () => string;
  getMetrics?: () => unknown;
}

interface MockMemoryManager {
  start?: () => void;
  getMemoryStats?: () => {
    totalResources: number;
    estimatedMemoryUsage: number;
  };
  forceCleanup?: () => number;
}

interface MockAnimationQueue {
  start?: () => void;
  enqueue?: (id: string, config: unknown, priority: number) => Promise<unknown>;
}
import { Sprite, Texture } from 'pixi.js';
import { SliderPhysicsEngine } from '../../physics/engine';
import { SliderRenderer } from '../../rendering';
import { serviceContainer } from '../../core/container';
import { SimpleEventEmitter } from '../../core/event-emitter';
import type { PhysicsConfig } from '../../core/types';
import {
  PERFORMANCE,
  ANIMATION_DURATION,
  EASING,
  PHYSICS,
  SCALE,
  INTENSITY,
  VIEWPORT,
  INPUT,
  RENDERING,
  DEFAULT_PHYSICS_CONFIG,
  GSAP_DEFAULTS,
  TEST_CONFIG,
  DOM_PROPERTIES,
} from '../../core';

// =============================================================================
// Test Type Interfaces - Proper TypeScript instead of any
// =============================================================================

interface TestPage {
  goto: (path: string) => Promise<unknown>;
  waitForLoadState: (state: string) => Promise<unknown>;
  setViewportSize: (size: {
    width: number;
    height: number;
  }) => Promise<unknown>;
  waitForTimeout: (ms: number) => Promise<unknown>;
  locator: (selector: string) => {
    first: () => { isVisible: () => Promise<boolean> };
  };
}

interface TestGSAP {
  killTweensOf?: (target: string) => void;
  globalTimeline?: { clear: () => void };
}

interface TestGestureRecognizer {
  processEvent: (event: unknown) => { gesture?: string } | null;
}

interface TestAnimationSequence {
  targetSprite: {
    index: number;
    initialState: unknown;
    finalState: unknown;
  };
  hideSprites: number[];
}

interface TestSwipeAnimation {
  initialPhase: {
    movement: number;
    scale: number;
    duration: number;
  };
  springPhase: {
    movement: number;
    scale: number;
    duration: number;
  };
}

interface TestGSAPIntegration {
  timeline: unknown;
  tweens: unknown[];
  duration: number;
  play: () => void;
  pause: () => void;
  kill: () => void;
}

interface TestVelocityTracker {
  samples: unknown[];
  currentVelocity: unknown;
  addSample: (sample: unknown) => void;
  getVelocity: () => number;
  reset: () => void;
}

// =============================================================================
// ✨ Phase 1.3: Performance Benchmark Factories
// =============================================================================

/**
 * Performance benchmark configuration for testing
 */
export const PERFORMANCE_BENCHMARKS = {
  // Target 60fps (PERFORMANCE.FRAME_BUDGET_MS per frame)
  fps60: PERFORMANCE.FRAME_BUDGET_MS,

  // Animation timing benchmarks (ms)
  animation: {
    quickTransition: ANIMATION_DURATION.QUICK * 1000, // Snappy UI response
    standardTransition: ANIMATION_DURATION.STANDARD * 1000, // Standard UI timing
    smoothTransition: ANIMATION_DURATION.MEDIUM * 1000, // Smooth animations
    maxAcceptable: ANIMATION_DURATION.VERY_SLOW * 1000, // Maximum acceptable delay
  },

  // Physics calculation benchmarks (ms)
  physics: {
    basicCalculation: 1, // Simple math operations
    complexCalculation: 5, // Multi-step calculations
    batchCalculation: 10, // Multiple sprite calculations
    maxAcceptable: PERFORMANCE.MAX_FRAME_TIME_MS, // Must not block 60fps
  },

  // Memory usage benchmarks (bytes)
  memory: {
    baselineHeap: 10 * 1024 * 1024, // 10MB baseline
    spriteOverhead: 1024, // 1KB per sprite
    timelineOverhead: 512, // 512B per timeline
    maxLeakThreshold: 1024 * 1024, // 1MB max memory leak
  },

  // PIXI rendering benchmarks (ms)
  rendering: {
    spriteCreation: 2, // Create sprite object
    textureLoading: 100, // Load texture from URL
    sceneRender: 8, // Render full scene
    maxRenderTime: PERFORMANCE.MAX_FRAME_TIME_MS, // Must not exceed frame budget
  },
} as const;

/**
 * Create performance measurement factory
 */
export const createPerformanceMeasure = () => {
  const measurements: Array<{
    name: string;
    duration: number;
    timestamp: number;
  }> = [];

  return {
    start: (name: string) => {
      const startTime = performance.now();
      return {
        end: () => {
          const endTime = performance.now();
          const duration = endTime - startTime;
          measurements.push({ name, duration, timestamp: startTime });
          return duration;
        },
      };
    },

    getMeasurements: () => [...measurements],

    getAverageDuration: (name: string) => {
      const matching = measurements.filter((m) => m.name === name);
      if (matching.length === 0) return 0;
      return matching.reduce((sum, m) => sum + m.duration, 0) / matching.length;
    },

    getMaxDuration: (name: string) => {
      const matching = measurements.filter((m) => m.name === name);
      return matching.length > 0
        ? Math.max(...matching.map((m) => m.duration))
        : 0;
    },

    clear: () => {
      measurements.length = 0;
    },
  };
};

/**
 * Create memory usage measurement factory
 */
export const createMemoryMeasure = () => {
  const snapshots: Array<{
    name: string;
    heapUsed: number;
    timestamp: number;
  }> = [];

  return {
    snapshot: (name: string) => {
      // Note: performance.memory is only available in Chrome with --enable-precise-memory-info
      const heapUsed =
        (performance as Performance & { memory?: { usedJSHeapSize: number } })
          .memory?.usedJSHeapSize || 0;
      snapshots.push({ name, heapUsed, timestamp: Date.now() });
      return heapUsed;
    },

    getMemoryDelta: (startName: string, endName: string) => {
      const start = snapshots.find((s) => s.name === startName);
      const end = snapshots.find((s) => s.name === endName);
      if (!start || !end) return 0;
      return end.heapUsed - start.heapUsed;
    },

    getSnapshots: () => [...snapshots],

    clear: () => {
      snapshots.length = 0;
    },
  };
};

/**
 * Create benchmark test data for stress testing
 */
export const createBenchmarkTestData = () => ({
  // Sprite count variations for performance testing
  spriteCounts: [1, 3, 5, 10, 25, 50, 100],

  // Animation complexity levels
  animationComplexity: {
    simple: { properties: ['x'], duration: ANIMATION_DURATION.STANDARD },
    standard: {
      properties: ['x', 'y', 'scale'],
      duration: ANIMATION_DURATION.MEDIUM,
    },
    complex: {
      properties: ['x', 'y', 'scale', 'rotation', 'alpha'],
      duration: ANIMATION_DURATION.SLOW,
    },
    extreme: {
      properties: [
        'x',
        'y',
        'scaleX',
        'scaleY',
        'rotation',
        'alpha',
        'skewX',
        'skewY',
      ],
      duration: ANIMATION_DURATION.EXTENDED,
    },
  },

  // Timeline complexity levels
  timelineComplexity: {
    simple: { steps: 1, duration: ANIMATION_DURATION.STANDARD },
    standard: { steps: 3, duration: ANIMATION_DURATION.SLOW },
    complex: { steps: 5, duration: ANIMATION_DURATION.EXTENDED },
    extreme: { steps: 10, duration: ANIMATION_DURATION.EXTENDED * 2 },
  },

  // Physics calculation loads
  physicsLoads: {
    minimal: { sprites: 1, calculations: 1 },
    light: { sprites: 3, calculations: 5 },
    moderate: { sprites: 5, calculations: 10 },
    heavy: { sprites: 10, calculations: 25 },
    extreme: { sprites: 25, calculations: 100 },
  },
});

/**
 * Performance assertion helper
 */
// Security-safe benchmark lookup with zero dynamic property access
const getBenchmarkValue = (
  benchmarkKey: keyof typeof PERFORMANCE_BENCHMARKS,
  subKey?: string
): number => {
  // Completely eliminate dynamic property access - use explicit property checks
  if (benchmarkKey === 'animation') {
    const animBench = PERFORMANCE_BENCHMARKS.animation;
    if (typeof animBench === 'number') return animBench;
    if (subKey === 'quickTransition') return animBench.quickTransition;
    if (subKey === 'standardTransition') return animBench.standardTransition;
    if (subKey === 'smoothTransition') return animBench.smoothTransition;
    if (subKey === 'maxAcceptable') return animBench.maxAcceptable;
    return 16;
  }

  if (benchmarkKey === 'physics') {
    const physBench = PERFORMANCE_BENCHMARKS.physics;
    if (typeof physBench === 'number') return physBench;
    if (subKey === 'basicCalculation') return physBench.basicCalculation;
    if (subKey === 'complexCalculation') return physBench.complexCalculation;
    if (subKey === 'batchCalculation') return physBench.batchCalculation;
    if (subKey === 'maxAcceptable') return physBench.maxAcceptable;
    return 16;
  }

  if (benchmarkKey === 'memory') {
    const memBench = PERFORMANCE_BENCHMARKS.memory;
    if (typeof memBench === 'number') return memBench;
    if (subKey === 'baselineHeap') return memBench.baselineHeap;
    if (subKey === 'spriteOverhead') return memBench.spriteOverhead;
    if (subKey === 'timelineOverhead') return memBench.timelineOverhead;
    if (subKey === 'maxLeakThreshold') return memBench.maxLeakThreshold;
    return 16;
  }

  if (benchmarkKey === 'rendering') {
    const renderBench = PERFORMANCE_BENCHMARKS.rendering;
    if (typeof renderBench === 'number') return renderBench;
    if (subKey === 'spriteCreation') return renderBench.spriteCreation;
    if (subKey === 'textureLoading') return renderBench.textureLoading;
    if (subKey === 'sceneRender') return renderBench.sceneRender;
    if (subKey === 'maxRenderTime') return renderBench.maxRenderTime;
    return 16;
  }

  // Exhaustive safety fallback
  return 16;
};

export const assertPerformanceWithinBenchmark = (
  actualDuration: number,
  benchmarkKey: keyof typeof PERFORMANCE_BENCHMARKS,
  subKey?: string,
  tolerance = 20.0 // 20x tolerance for test environment
) => {
  const targetDuration = getBenchmarkValue(benchmarkKey, subKey);
  const maxAcceptable = targetDuration * tolerance;

  expect(actualDuration).toBeLessThanOrEqual(maxAcceptable);

  return {
    actualDuration,
    targetDuration,
    maxAcceptable,
    isWithinBenchmark: actualDuration <= maxAcceptable,
    performanceRatio: actualDuration / targetDuration,
  };
};

// =============================================================================
// Mock Factories
// =============================================================================

/**
 * Create mock service objects with consistent structure
 */
export const createMockService = (suffix = 'value') => ({
  test: suffix,
  id: Math.random(),
});

/**
 * Create mock event listeners with Vitest spies
 */
export const createMockListeners = (count = 1) => {
  return Array.from({ length: count }, () => vi.fn());
};

/**
 * Create test event emitter with common setup
 */
export const createTestEventEmitter = () => {
  return new SimpleEventEmitter();
};

/**
 * Create mock canvas for PIXI tests
 */
export const createMockCanvas = () =>
  ({
    getContext: vi.fn(() => ({
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(),
      putImageData: vi.fn(),
      createImageData: vi.fn(),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      fillText: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      measureText: vi.fn(() => ({ width: 10 })),
      transform: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
    })),
    style: {},
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getAttribute: vi.fn(),
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    clientWidth: 800,
    clientHeight: 600,
    width: 800,
    height: 600,
  }) as unknown as HTMLCanvasElement;

// =============================================================================
// ✨ Phase 2 Ready: GSAP Mock Factories
// =============================================================================

/**
 * Create mock GSAP timeline for testing GSAP integration
 */
export const createMockGSAPTimeline = (
  duration = ANIMATION_DURATION.VERY_SLOW
) => ({
  duration: vi.fn(() => duration),
  play: vi.fn(),
  pause: vi.fn(),
  restart: vi.fn(),
  reverse: vi.fn(),
  kill: vi.fn(),
  to: vi.fn(),
  from: vi.fn(),
  fromTo: vi.fn(),
  set: vi.fn(),
  add: vi.fn(),
  progress: vi.fn(),
  time: vi.fn(),
  totalTime: vi.fn(),
  isActive: vi.fn(() => false),
  paused: vi.fn(() => false),
  reversed: vi.fn(() => false),
  invalidate: vi.fn(),
  then: vi.fn(() => Promise.resolve()),
  eventCallback: vi.fn(),
  vars: {},
  timeline: null,
  data: null,
});

/**
 * Create mock GSAP tween for testing individual animations
 */
export const createMockGSAPTween = (duration = ANIMATION_DURATION.MEDIUM) => ({
  duration: vi.fn(() => duration),
  play: vi.fn(),
  pause: vi.fn(),
  restart: vi.fn(),
  reverse: vi.fn(),
  kill: vi.fn(),
  progress: vi.fn(),
  time: vi.fn(),
  totalTime: vi.fn(),
  isActive: vi.fn(() => false),
  paused: vi.fn(() => false),
  invalidate: vi.fn(),
  then: vi.fn(() => Promise.resolve()),
  eventCallback: vi.fn(),
  target: {},
  vars: {},
});

/**
 * Create comprehensive GSAP mock with all methods needed for Phase 2
 */
/**
 * Create mock HTML element for testing
 */
export const createMockElement = (tagName = 'div') =>
  ({
    tagName,
    style: {},
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    hasAttribute: vi.fn(() => false),
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(() => false),
    },
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    remove: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    parentNode: {
      removeChild: vi.fn(),
    },
  }) as unknown as HTMLElement;

export const createMockGSAP = () => ({
  timeline: vi.fn(() => createMockGSAPTimeline()),
  to: vi.fn(() => createMockGSAPTween()),
  from: vi.fn(() => createMockGSAPTween()),
  fromTo: vi.fn(() => createMockGSAPTween()),
  set: vi.fn(),
  killTweensOf: vi.fn(),
  getTweensOf: vi.fn(() => []),
  isTweening: vi.fn(() => false),
  globalTimeline: createMockGSAPTimeline(),
  ticker: {
    add: vi.fn(),
    remove: vi.fn(),
    fps: vi.fn(() => 60),
  },
  config: vi.fn(),
  registerPlugin: vi.fn(),
  utils: {
    toArray: vi.fn((target) => (Array.isArray(target) ? target : [target])),
    selector: vi.fn((selector) => document.querySelector(selector)),
    random: vi.fn((min, max) => Math.random() * (max - min) + min),
    clamp: vi.fn((min, max, value) => Math.max(min, Math.min(max, value))),
  },
});

// =============================================================================
// ✨ Phase 2 Ready: Advanced PIXI Mock Factories
// =============================================================================

/**
 * Create mock PIXI Application with enhanced features for Phase 2
 */
export const createMockPixiApplication = () => {
  // Create a proper canvas mock that can be appended to DOM
  const mockCanvas = {
    width: 800,
    height: 600,
    style: {},
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getContext: vi.fn(() => ({
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(),
      putImageData: vi.fn(),
      createImageData: vi.fn(),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      fillText: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      measureText: vi.fn(() => ({ width: 10 })),
      transform: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
    })),
    // Mock DOM node properties
    nodeType: 1,
    nodeName: 'CANVAS',
    parentNode: null,
    cloneNode: vi.fn(),
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  };

  return {
    canvas: mockCanvas,
    stage: {
      addChild: vi.fn(),
      removeChild: vi.fn(),
      removeChildren: vi.fn(),
      getChildAt: vi.fn(),
      getChildIndex: vi.fn(),
      children: [],
      width: 800,
      height: 600,
      scale: { x: 1, y: 1, set: vi.fn() },
      position: { x: 0, y: 0, set: vi.fn() },
      pivot: { x: 0, y: 0, set: vi.fn() },
      rotation: 0,
      alpha: 1,
      visible: true,
      interactive: false,
      filters: [],
      mask: null,
    },
    renderer: {
      width: 800,
      height: 600,
      resolution: 1,
      type: 1, // WebGL
      resize: vi.fn(),
      render: vi.fn(),
      generateTexture: vi.fn(),
      destroy: vi.fn(),
      background: { color: 0x000000 },
    },
    ticker: {
      add: vi.fn(),
      remove: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      destroy: vi.fn(),
      deltaTime: 1,
      elapsedMS: PERFORMANCE.FRAME_BUDGET_MS,
      FPS: 60,
      speed: 1,
      started: false,
    },
    loader: {
      add: vi.fn(),
      load: vi.fn(),
      reset: vi.fn(),
      destroy: vi.fn(),
      resources: {},
      progress: 0,
      loading: false,
    },
    init: vi.fn(() => Promise.resolve()),
    start: vi.fn(),
    stop: vi.fn(),
    render: vi.fn(),
    resize: vi.fn(),
    destroy: vi.fn(),
  };
};

/**
 * Create mock PIXI sprite with enhanced properties for animation testing
 */
export const createMockPixiSprite = (texture?: unknown) => ({
  texture: texture || Texture.WHITE,
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  scale: { x: 1, y: 1, set: vi.fn() },
  anchor: {
    x: RENDERING.CENTER_ANCHOR,
    y: RENDERING.CENTER_ANCHOR,
    set: vi.fn(),
  },
  position: { x: 0, y: 0, set: vi.fn() },
  pivot: { x: 0, y: 0, set: vi.fn() },
  rotation: 0,
  alpha: 1,
  visible: true,
  interactive: true,
  buttonMode: false,
  filters: [],
  mask: null,
  tint: 0xffffff,
  blendMode: 0,
  eventMode: 'auto',
  cursor: 'pointer',
  label: '',
  destroy: vi.fn(),
  getBounds: vi.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })),
  getLocalBounds: vi.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })),
  toGlobal: vi.fn((point) => point),
  toLocal: vi.fn((point) => point),
});

// =============================================================================
// ✨ Phase 2 Ready: Input Event Mock Factories
// =============================================================================

/**
 * Create mock mouse events for drag testing
 */
export const createMockMouseEvent = (
  type: string,
  options: Partial<MouseEvent> = {}
) => ({
  type,
  clientX: options.clientX || 100,
  clientY: options.clientY || 100,
  pageX: options.pageX || 100,
  pageY: options.pageY || 100,
  screenX: options.screenX || 100,
  screenY: options.screenY || 100,
  movementX: options.movementX || 0,
  movementY: options.movementY || 0,
  button: options.button || 0,
  buttons: options.buttons || 1,
  ctrlKey: options.ctrlKey || false,
  shiftKey: options.shiftKey || false,
  altKey: options.altKey || false,
  metaKey: options.metaKey || false,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  stopImmediatePropagation: vi.fn(),
  target: options.target || {},
  currentTarget: options.currentTarget || {},
  timeStamp: options.timeStamp || Date.now(),
});

/**
 * Create mock touch events for swipe testing
 */
export const createMockTouchEvent = (type: string, touches: Touch[] = []) => ({
  type,
  touches,
  targetTouches: touches,
  changedTouches: touches,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  metaKey: false,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  stopImmediatePropagation: vi.fn(),
  target: {},
  currentTarget: {},
  timeStamp: Date.now(),
});

/**
 * Create mock touch point for touch events
 */
export const createMockTouch = (options: Partial<Touch> = {}) => ({
  identifier: options.identifier || 0,
  clientX: options.clientX || 100,
  clientY: options.clientY || 100,
  pageX: options.pageX || 100,
  pageY: options.pageY || 100,
  screenX: options.screenX || 100,
  screenY: options.screenY || 100,
  radiusX: options.radiusX || 5,
  radiusY: options.radiusY || 5,
  rotationAngle: options.rotationAngle || 0,
  force: options.force || 1,
  target: options.target || {},
});

/**
 * Create mock keyboard events for navigation testing
 */
export const createMockKeyboardEvent = (
  type: string,
  keyOrOptions: string | Partial<KeyboardEvent> = '',
  options: Partial<KeyboardEvent> = {}
) => {
  // Handle both function signatures: (type, key, options) and (type, { key, ...options })
  let key: string;
  let eventOptions: Partial<KeyboardEvent>;

  if (typeof keyOrOptions === 'string') {
    key = keyOrOptions;
    eventOptions = options;
  } else {
    key = keyOrOptions.key || '';
    eventOptions = keyOrOptions;
  }

  return {
    type,
    key,
    code: eventOptions.code || `Key${key.toUpperCase()}`,
    keyCode: eventOptions.keyCode || (key ? key.charCodeAt(0) : 0),
    which: eventOptions.which || (key ? key.charCodeAt(0) : 0),
    ctrlKey: eventOptions.ctrlKey || false,
    shiftKey: eventOptions.shiftKey || false,
    altKey: eventOptions.altKey || false,
    metaKey: eventOptions.metaKey || false,
    repeat: eventOptions.repeat || false,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    stopImmediatePropagation: vi.fn(),
    target: eventOptions.target || {},
    currentTarget: eventOptions.currentTarget || {},
    timeStamp: eventOptions.timeStamp || Date.now(),
  };
};

// =============================================================================
// ✨ Phase 2 Ready: Animation Config Mock Factories
// =============================================================================

/**
 * Create comprehensive animation configurations for Phase 2 testing
 */
export const createMockAnimationConfigs = () => ({
  slideTransition: {
    ...GSAP_DEFAULTS.TIMELINE,
    duration: ANIMATION_DURATION.SLOW,
    x: 100,
    scale: SCALE.EMPHASIS,
    alpha: 1,
    clearProps: 'all',
  },

  momentumAnimation: {
    duration: ANIMATION_DURATION.EXTENDED * INTENSITY.HIGH,
    ease: 'power3.out',
    x: 200,
    velocity: 150,
    friction: PHYSICS.FRICTION,
    snap: true,
    bounds: { min: 0, max: 800 },
  },

  springAnimation: {
    duration: ANIMATION_DURATION.MEDIUM + INTENSITY.VERY_LOW,
    ease: EASING.ELASTIC,
    x: 0,
    y: 0,
    scale: SCALE.DEFAULT,
    rotation: 0,
    stiffness: 100,
    damping: 12,
  },

  displacementEffect: {
    duration: ANIMATION_DURATION.EXTENDED + INTENSITY.MEDIUM,
    ease: EASING.LINEAR,
    repeat: -1,
    yoyo: true,
    scale: 20,
    rotation: INTENSITY.VERY_LOW,
    autoAlpha: INTENSITY.HIGH,
  },

  snapToSlide: {
    ...GSAP_DEFAULTS.PERFORMANCE,
    duration: ANIMATION_DURATION.FAST * 2,
    ease: EASING.EASE_IN_OUT,
    x: 0,
    clearProps: DOM_PROPERTIES.TRANSFORM,
    onComplete: vi.fn(),
    onUpdate: vi.fn(),
  },
});

/**
 * Create velocity tracking test data for kinetic scrolling
 */
export const createMockVelocityData = () => ({
  samples: [
    { time: 0, position: 0, velocity: 0 },
    {
      time: PERFORMANCE.FRAME_BUDGET_MS,
      position: 5,
      velocity: TEST_CONFIG.EXPECTED.VELOCITY_312_5,
    },
    { time: PERFORMANCE.FRAME_BUDGET_MS * 2, position: 15, velocity: 625 },
    {
      time: PERFORMANCE.FRAME_BUDGET_MS * 3,
      position: 30,
      velocity: TEST_CONFIG.EXPECTED.VELOCITY_937_5,
    },
    { time: PERFORMANCE.FRAME_BUDGET_MS * 4, position: 50, velocity: 1250 },
  ],
  threshold: INPUT.SWIPE_THRESHOLD,
  maxVelocity: PHYSICS.MAX_VELOCITY * 1000, // Convert to px/s
  dampening: PHYSICS.MOMENTUM_DAMPING,
  snapThreshold: INTENSITY.VERY_LOW,
});

// =============================================================================
// Test Assertion Helpers to Eliminate DRY Violations
// =============================================================================

/**
 * Standard existence assertion pattern
 */
export const assertExists = (value: unknown, message?: string) => {
  expect(value, message).toBeDefined();
};

/**
 * Standard timeline existence and validity pattern
 */
export const assertTimelineExists = (timeline: unknown) => {
  assertExists(timeline);
  expect(typeof (timeline as { duration?: () => number }).duration).toBe(
    'function'
  );
};

/**
 * Standard animation object existence pattern
 */
export const assertAnimationExists = (animation: unknown) => {
  assertExists(animation);
  expect(typeof animation).toBe(DOM_PROPERTIES.TYPE_OBJECT);
};

/**
 * Test object structure constants to eliminate duplication
 */
export const TEST_OBJECT_PATTERNS = {
  /** Standard sprite initial state for tests */
  SPRITE_INITIAL_STATE: {
    visible: true,
    alpha: 0,
    scale: 1,
  },
  /** Standard sprite final state for tests */
  SPRITE_FINAL_STATE: {
    alpha: 1,
    scale: 1,
  },
  /** Standard malformed animation for error testing */
  MALFORMED_ANIMATION: {
    hideSprites: [],
    targetSprite: {
      index: 0,
      initialState: { visible: true, alpha: 0, scale: 1 },
      finalState: { alpha: 1, scale: 1 },
      duration: -1, // Invalid duration
      ease: 'invalid-ease',
    },
  },
} as const;

// =============================================================================
// Test Data Factories
// =============================================================================

/**
 * Standard physics configurations for testing
 */
export const TEST_PHYSICS_CONFIGS = {
  default: DEFAULT_PHYSICS_CONFIG,

  fast: {
    transitionDuration: ANIMATION_DURATION.STANDARD,
    transitionEase: EASING.EASE_OUT,
    swipeThreshold: INPUT.SWIPE_THRESHOLD * INTENSITY.HIGH,
  } as Partial<PhysicsConfig>,

  slow: {
    transitionDuration: ANIMATION_DURATION.EXTENDED,
    transitionEase: EASING.ELASTIC,
    swipeThreshold: INPUT.SWIPE_THRESHOLD * 2,
  } as Partial<PhysicsConfig>,
};

/**
 * Standard sprite counts for testing
 */
export const TEST_SPRITE_COUNTS = {
  minimal: 1,
  small: 3,
  medium: 5,
  large: 10,
} as const;

/**
 * Standard test intensities
 */
export const TEST_INTENSITIES = {
  zero: INTENSITY.NONE,
  low: INTENSITY.LOW,
  medium: INTENSITY.MEDIUM,
  high: INTENSITY.HIGH,
  max: INTENSITY.MAX,
} as const;

/**
 * Standard test directions
 */
export const TEST_DIRECTIONS = {
  left: -1,
  right: 1,
} as const;

// =============================================================================
// Sprite Factories
// =============================================================================

/**
 * Create test sprites with consistent setup
 */
export const createTestSprites = (count = 3): Sprite[] => {
  const texture = Texture.WHITE;
  const sprites = Array.from({ length: count }, () => new Sprite(texture));

  sprites.forEach((sprite, index) => {
    sprite.x = index * 100;
    sprite.y = 0;
    sprite.alpha = 1;
    sprite.scale.set(1, 1);
    sprite.visible = true;
  });

  return sprites;
};

// =============================================================================
// Engine and Renderer Factories
// =============================================================================

/**
 * Create physics engine with optional config
 */
export const createTestPhysicsEngine = (
  config?: Partial<PhysicsConfig>
): SliderPhysicsEngine => {
  const engine = new SliderPhysicsEngine();
  if (config) {
    engine.setConfig(config);
  }
  return engine;
};

/**
 * Create renderer with mock setup
 */
export const createTestRenderer = (): SliderRenderer => {
  return new SliderRenderer();
};

// =============================================================================
// Test Pattern Utilities
// =============================================================================

/**
 * Test service registration pattern
 */
export const testServiceRegistration = (
  serviceKey: string,
  factory: () => unknown,
  expectedBehavior: 'singleton' | 'factory' = 'singleton'
) => {
  const isSingleton = expectedBehavior === 'singleton';
  serviceContainer.register(serviceKey, factory, isSingleton);

  const instance1 = serviceContainer.get(serviceKey);
  const instance2 = serviceContainer.get(serviceKey);

  return { instance1, instance2, areSame: instance1 === instance2 };
};

/**
 * Test event emission pattern
 */
export const testEventEmission = (
  emitter: SimpleEventEmitter,
  eventName: string,
  data?: unknown
) => {
  const listener = vi.fn();
  emitter.on(eventName, listener);

  if (data !== undefined) {
    emitter.emit(eventName, data);
  } else {
    emitter.emit(eventName);
  }

  return {
    listener,
    wasCalledOnce: listener.mock.calls.length === 1,
    wasCalledWith:
      data !== undefined
        ? listener.mock.calls[0]?.[0] === data
        : listener.mock.calls[0]?.length === 0,
  };
};

/**
 * Test physics calculation pattern
 */
export const testPhysicsCalculation = <T>(
  engine: SliderPhysicsEngine,
  calculationFn: (engine: SliderPhysicsEngine) => T,
  validator: (result: T) => boolean
) => {
  const result = calculationFn(engine);
  const isValid = validator(result);

  return { result, isValid };
};

/**
 * Test timeline creation pattern
 */
export const testTimelineCreation = (
  createTimelineFn: () => gsap.core.Timeline,
  expectedMinDuration = 0
) => {
  const timeline = createTimelineFn();
  const duration = timeline.duration();
  const isValid = duration > expectedMinDuration;

  return { timeline, duration, isValid };
};

// =============================================================================
// ✨ Phase 2 Ready: Advanced Test Patterns
// =============================================================================

/**
 * Test GSAP animation sequence pattern
 */
export const testGSAPAnimationSequence = (
  timeline: gsap.core.Timeline,
  expectedSteps: number = 1
) => {
  const children = timeline.getChildren ? timeline.getChildren() : [];
  const totalDuration = timeline.duration();
  const hasSteps = children.length >= expectedSteps;

  return {
    timeline,
    children,
    stepCount: children.length,
    totalDuration,
    hasSteps,
    isValid: hasSteps && totalDuration > 0,
  };
};

/**
 * Test input gesture recognition pattern
 */
export const testGestureRecognition = (
  recognizer: TestGestureRecognizer,
  eventSequence: unknown[],
  expectedGesture: string
) => {
  let detectedGesture = '';

  // Simulate event sequence
  eventSequence.forEach((event) => {
    const result = recognizer.processEvent(event);
    if (result && result.gesture) {
      detectedGesture = result.gesture;
    }
  });

  return {
    detectedGesture,
    expectedGesture,
    isCorrect: detectedGesture === expectedGesture,
    eventCount: eventSequence.length,
  };
};

/**
 * Test performance threshold pattern
 */
export const testPerformanceThreshold = async (
  operation: () => Promise<unknown> | unknown,
  maxDurationMs: number = PERFORMANCE.MAX_FRAME_TIME_MS // Target 60fps
) => {
  const startTime = performance.now();
  const result = await operation();
  const endTime = performance.now();
  const duration = endTime - startTime;

  return {
    result,
    duration,
    maxDurationMs,
    isWithinThreshold: duration <= maxDurationMs,
    performanceRatio: duration / maxDurationMs,
  };
};

// =============================================================================
// E2E Test Utilities
// =============================================================================

/**
 * Standard viewport sizes for responsive testing
 */
export const VIEWPORT_SIZES = {
  mobile: VIEWPORT.MOBILE,
  tablet: VIEWPORT.TABLET,
  desktop: VIEWPORT.LARGE_DESKTOP,
} as const;

/**
 * Common page navigation with wait
 */
export const navigateAndWait = async (page: TestPage, path = '/') => {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
};

/**
 * Test viewport responsiveness pattern
 */
export const testViewportResponsiveness = async (
  page: TestPage,
  selector: string,
  sizes = [VIEWPORT_SIZES.mobile, VIEWPORT_SIZES.tablet, VIEWPORT_SIZES.desktop]
) => {
  const results = [];

  for (const size of sizes) {
    await page.setViewportSize(size);
    await page.waitForTimeout(100); // Reduced from 500ms

    const element = page.locator(selector).first();
    const isVisible = await element.isVisible();

    results.push({ size, isVisible });
  }

  return results;
};

// =============================================================================
// Cleanup Utilities
// =============================================================================

/**
 * Clean up service container
 */
export const cleanupServiceContainer = () => {
  serviceContainer.clear();
};

/**
 * Clean up renderer
 */
export const cleanupRenderer = (renderer: SliderRenderer) => {
  renderer.cleanup();
};

/**
 * Clean up GSAP animations (for Phase 2)
 */
export const cleanupGSAPAnimations = (gsap: TestGSAP) => {
  if (gsap && gsap.killTweensOf) {
    gsap.killTweensOf('*');
  }
  if (gsap && gsap.globalTimeline) {
    gsap.globalTimeline.clear();
  }
};

// =============================================================================
// Assertion Helpers
// =============================================================================

/**
 * Assert timeline properties
 */
export const assertTimelineValid = (
  timeline: gsap.core.Timeline,
  minDuration = 0
) => {
  assertTimelineExists(timeline);
  expect(timeline.duration()).toBeGreaterThan(minDuration);
  expect(typeof timeline.play).toBe('function');
  expect(typeof timeline.pause).toBe('function');
  expect(typeof timeline.kill).toBe('function');
};

/**
 * Assert animation sequence properties
 */
export const assertAnimationSequenceValid = (
  sequence: TestAnimationSequence,
  targetIndex: number
) => {
  assertAnimationExists(sequence);
  assertExists(sequence.targetSprite);
  expect(sequence.targetSprite.index).toBe(targetIndex);
  assertExists(sequence.targetSprite.initialState);
  assertExists(sequence.targetSprite.finalState);
  expect(sequence.hideSprites).toBeInstanceOf(Array);
  expect(sequence.hideSprites).not.toContain(targetIndex);
};

/**
 * Assert swipe animation properties
 */
export const assertSwipeAnimationValid = (animation: TestSwipeAnimation) => {
  expect(animation).toBeDefined();
  expect(animation.initialPhase).toBeDefined();
  expect(animation.springPhase).toBeDefined();
  expect(typeof animation.initialPhase.movement).toBe('number');
  expect(typeof animation.initialPhase.scale).toBe('number');
  expect(typeof animation.initialPhase.duration).toBe('number');
  expect(typeof animation.springPhase.movement).toBe('number');
  expect(typeof animation.springPhase.scale).toBe('number');
  expect(typeof animation.springPhase.duration).toBe('number');
};

/**
 * ✨ Phase 2 Ready: Assert GSAP integration properties
 */
export const assertGSAPIntegrationValid = (
  integration: TestGSAPIntegration
) => {
  expect(integration).toBeDefined();
  expect(integration.timeline).toBeDefined();
  expect(integration.tweens).toBeInstanceOf(Array);
  expect(integration.duration).toBeGreaterThan(0);
  expect(typeof integration.play).toBe('function');
  expect(typeof integration.pause).toBe('function');
  expect(typeof integration.kill).toBe('function');
};

/**
 * ✨ Phase 2 Ready: Assert velocity tracking properties
 */
export const assertVelocityTrackingValid = (tracker: TestVelocityTracker) => {
  expect(tracker).toBeDefined();
  expect(tracker.samples).toBeInstanceOf(Array);
  expect(tracker.currentVelocity).toBeDefined();
  expect(typeof tracker.addSample).toBe('function');
  expect(typeof tracker.getVelocity).toBe('function');
  expect(typeof tracker.reset).toBe('function');
};

// =============================================================================
// ✨ Phase 2.3: Animation Coordination Test Factories
// =============================================================================

/**
 * Create mock AnimationManager for testing coordination
 */
export const createMockAnimationManager = () => ({
  queueAnimation: vi.fn().mockResolvedValue(createMockGSAPTimeline()),
  executeImmediate: vi.fn().mockResolvedValue(createMockGSAPTimeline()),
  createTimelineGroup: vi.fn().mockResolvedValue(createMockGSAPTimeline()),
  getPerformanceStats: vi.fn(() => ({
    activeAnimations: 2,
    completedAnimations: 15,
    failedAnimations: 0,
    averageExecutionTime: 150,
    peakMemoryUsage: 50 * 1024 * 1024,
    currentAnimationCount: 2,
    queueLength: 3,
    activeTimelineGroups: 1,
    activeTimelines: 2,
  })),
  getAnimationState: vi.fn(() => ({
    isProcessingQueue: true,
    activeAnimations: ['anim-1', 'anim-2'],
    queuedAnimations: [
      { id: 'anim-3', priority: 800, context: {} },
      { id: 'anim-4', priority: 500, context: {} },
    ],
    timelineGroups: ['group-1'],
    performanceStats: {},
  })),
  dispose: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  removeAllListeners: vi.fn(),
});

/**
 * Create mock PerformanceMonitor for testing performance tracking
 */
export const createMockPerformanceMonitor = () => ({
  start: vi.fn(),
  stop: vi.fn(),
  getMetrics: vi.fn(() => ({
    fps: { current: 58, average: 56, min: 45, max: 60 },
    memory: {
      used: 45 * 1024 * 1024,
      total: 100 * 1024 * 1024,
      percentage: 45,
      peak: 50 * 1024 * 1024,
    },
    animations: {
      active: 3,
      completed: 25,
      failed: 1,
      averageExecutionTime: 180,
    },
    system: { cpuUsage: 25, loadTime: 1200, responseTime: 50 },
  })),
  getHistory: vi.fn(() => []),
  recordAnimationStart: vi.fn(),
  recordAnimationComplete: vi.fn(),
  recordAnimationFailed: vi.fn(),
  getPerformanceGrade: vi.fn(() => 'A'),
  dispose: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  removeAllListeners: vi.fn(),
});

/**
 * Create mock MemoryManager for testing resource management
 */
export const createMockMemoryManager = () => ({
  start: vi.fn(),
  stop: vi.fn(),
  trackResource: vi.fn(),
  addReference: vi.fn(),
  removeReference: vi.fn(),
  cleanupResource: vi.fn().mockReturnValue(true),
  forceCleanup: vi.fn().mockReturnValue(5),
  getMemoryStats: vi.fn(() => ({
    totalResources: 15,
    activeResources: 12,
    estimatedMemoryUsage: 25 * 1024 * 1024,
    byType: {
      timeline: { count: 5, memory: 10 * 1024 * 1024 },
      tween: { count: 3, memory: 5 * 1024 * 1024 },
      sprite: { count: 4, memory: 8 * 1024 * 1024 },
      texture: { count: 2, memory: 2 * 1024 * 1024 },
      filter: { count: 1, memory: 1024 * 1024 },
    },
    cleanup: {
      totalCleaned: 8,
      memoryReclaimed: 15 * 1024 * 1024,
      lastCleanupAt: Date.now() - 30000,
    },
  })),
  getResourceInfo: vi.fn(),
  getAllResources: vi.fn(() => []),
  detectMemoryLeaks: vi.fn(() => []),
  configure: vi.fn(),
  dispose: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  removeAllListeners: vi.fn(),
});

/**
 * Create mock AnimationQueue for testing priority scheduling
 */
export const createMockAnimationQueue = () => ({
  start: vi.fn(),
  stop: vi.fn(),
  enqueue: vi.fn().mockResolvedValue({ animationId: 'test', completed: true }),
  dequeue: vi.fn().mockReturnValue(true),
  clear: vi.fn(),
  getStats: vi.fn(() => ({
    totalItems: 8,
    byPriority: {
      critical: 1,
      high: 2,
      normal: 3,
      low: 2,
      minimal: 0,
    },
    processing: {
      currentlyProcessing: 2,
      processed: 45,
      failed: 3,
      retried: 8,
    },
    timing: {
      averageWaitTime: 120,
      averageExecutionTime: 250,
      totalWaitTime: 5400,
      totalExecutionTime: 11250,
    },
  })),
  getQueueState: vi.fn(() => ({
    queueLength: 6,
    processingCount: 2,
    nextItems: [],
  })),
  configure: vi.fn(),
  dispose: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  removeAllListeners: vi.fn(),
});

/**
 * Create test animation configurations for Phase 2.3 testing
 */
export const createTestAnimationConfigs = () => ({
  simple: {
    duration: ANIMATION_DURATION.STANDARD,
    ease: EASING.EASE_OUT,
    animations: [
      {
        targets: '.test-sprite',
        properties: { x: 100, alpha: 1 },
        duration: ANIMATION_DURATION.STANDARD,
        ease: EASING.EASE_OUT,
      },
    ],
  },
  complex: {
    duration: ANIMATION_DURATION.SLOW,
    ease: EASING.ELASTIC,
    animations: [
      {
        targets: '.test-sprite-1',
        properties: { x: 200, y: 100, scale: 1.2, rotation: 45 },
        duration: ANIMATION_DURATION.MEDIUM,
        ease: EASING.BACK,
      },
      {
        targets: '.test-sprite-2',
        properties: { alpha: 0, scale: 0.8 },
        duration: ANIMATION_DURATION.FAST,
        ease: EASING.EASE_IN,
        delay: 0.1,
      },
    ],
  },
  grouped: {
    duration: ANIMATION_DURATION.EXTENDED,
    ease: EASING.EASE_IN_OUT,
    animations: [
      {
        targets: '.group-1',
        properties: { x: 300 },
        duration: ANIMATION_DURATION.STANDARD,
      },
      {
        targets: '.group-2',
        properties: { y: 200 },
        duration: ANIMATION_DURATION.MEDIUM,
        delay: 0.2,
      },
    ],
  },
});

/**
 * Create test resource information for memory management testing
 */
export const createTestResourceInfo = (
  id: string = 'test-resource',
  type: 'timeline' | 'tween' | 'sprite' | 'texture' | 'filter' = 'timeline'
) => ({
  id,
  type,
  createdAt: Date.now() - 5000,
  lastAccessed: Date.now() - 1000,
  refCount: 1,
  memorySize: 1024 * 1024, // 1MB
  isActive: true,
  metadata: {
    [type]: type === 'timeline' ? createMockGSAPTimeline() : { mock: true },
  },
});

/**
 * Create test performance metrics for performance monitoring
 */
export const createTestPerformanceMetrics = () => ({
  fps: {
    current: 58,
    average: 56,
    min: 45,
    max: 60,
  },
  memory: {
    used: 45 * 1024 * 1024,
    total: 100 * 1024 * 1024,
    percentage: 45,
    peak: 50 * 1024 * 1024,
  },
  animations: {
    active: 3,
    completed: 25,
    failed: 1,
    averageExecutionTime: 180,
  },
  system: {
    cpuUsage: 25,
    loadTime: 1200,
    responseTime: 50,
  },
});

/**
 * Create test queue items for animation queue testing
 */
export const createTestQueueItem = (
  id: string = 'test-item',
  priority: number = 500
) => ({
  id,
  config: createTestAnimationConfigs().simple,
  priority,
  context: { source: 'test', groupId: 'test-group' },
  createdAt: Date.now() - 1000,
  estimatedDuration: 300,
  retryCount: 0,
  maxRetries: 3,
  resolve: vi.fn(),
  reject: vi.fn(),
});

/**
 * Test helper for animation coordination workflow
 */
export const testAnimationCoordination = async (
  managers: {
    animationManager: {
      start: () => void;
      stop: () => void;
      getStatus: () => string;
    };
    performanceMonitor: { getMetrics: () => unknown; recordFrame: () => void };
    memoryManager: {
      checkMemory: () => { used: number; available: number };
      cleanup: () => void;
    };
    animationQueue: {
      add: (id: string, priority: number) => void;
      process: () => void;
      getStats: () => unknown;
    };
  },
  scenario: {
    animationId: string;
    priority: number;
    expectSuccess: boolean;
  }
) => {
  const { performanceMonitor, memoryManager, animationQueue } = managers;
  const { animationId, priority, expectSuccess } = scenario;

  try {
    // Start monitoring
    (
      performanceMonitor as MockMonitor & MockMemoryManager & MockAnimationQueue
    ).start?.();
    (
      memoryManager as MockMonitor & MockMemoryManager & MockAnimationQueue
    ).start?.();
    (
      animationQueue as MockMonitor & MockMemoryManager & MockAnimationQueue
    ).start?.();

    // Queue animation
    const animationPromise = (
      animationQueue as MockMonitor & MockMemoryManager & MockAnimationQueue
    ).enqueue?.(animationId, createTestAnimationConfigs().simple, priority);

    // Track performance
    (
      performanceMonitor as MockMonitor & MockMemoryManager & MockAnimationQueue
    ).recordAnimationStart?.();

    // Execute animation
    const result = await animationPromise;

    // Verify results
    if (expectSuccess) {
      expect(result).toBeDefined();
      (
        performanceMonitor as MockMonitor &
          MockMemoryManager &
          MockAnimationQueue
      ).recordAnimationEnd?.();
    }

    return { success: true, result };
  } catch (error) {
    if (!expectSuccess) {
      (
        performanceMonitor as MockMonitor &
          MockMemoryManager &
          MockAnimationQueue
      ).recordAnimationFailed?.();
      return { success: false, error };
    }
    throw error;
  }
};

/**
 * Test helper for memory management validation
 */
export const testMemoryManagement = (
  memoryManager: {
    trackResource: (resource: {
      id: string;
      type: string;
      memorySize: number;
      isActive: boolean;
    }) => void;
    cleanup: () => void;
    getStats: () => {
      totalMemory: number;
      usedMemory: number;
      trackedResources: number;
    };
  },
  resources: Array<{ id: string; type: string; size: number }>
) => {
  // Track resources
  resources.forEach((resource) => {
    memoryManager.trackResource({
      id: resource.id,
      type: resource.type,
      memorySize: resource.size,
      isActive: true,
    });
  });

  // Verify tracking
  const stats = (
    memoryManager as MockMonitor & MockMemoryManager & MockAnimationQueue
  ).getMemoryStats?.() || { totalResources: 0, estimatedMemoryUsage: 0 };
  expect(stats.totalResources).toBe(resources.length);
  expect(stats.estimatedMemoryUsage).toBeGreaterThanOrEqual(0);

  // Test cleanup
  const cleanedCount =
    (
      memoryManager as MockMonitor & MockMemoryManager & MockAnimationQueue
    ).forceCleanup?.() || 0;
  expect(cleanedCount).toBeGreaterThanOrEqual(0);

  return { stats, cleanedCount };
};

/**
 * Test helper for performance monitoring validation
 */
export const testPerformanceMonitoring = async (
  performanceMonitor: {
    start: () => void;
    recordAnimationStart: () => void;
    recordAnimationEnd: () => void;
    getMetrics: () => {
      averageFPS: number;
      memoryUsage: number;
      animationStats: { total: number; successful: number };
    };
    stop: () => void;
  },
  _duration: number = 1000
) => {
  performanceMonitor.start();

  // Simulate performance data
  performanceMonitor.recordAnimationStart();
  await new Promise((resolve) => setTimeout(resolve, 100));
  (
    performanceMonitor as MockMonitor & MockMemoryManager & MockAnimationQueue
  ).recordAnimationEnd?.();

  const metrics = performanceMonitor.getMetrics();
  const grade =
    (
      performanceMonitor as MockMonitor & MockMemoryManager & MockAnimationQueue
    ).getPerformanceGrade?.() || 'good';

  performanceMonitor.stop();

  return { metrics, grade };
};

// =============================================================================
// ✨ PIXI.js Integration Test Factories
// =============================================================================

/**
 * Create mock PixiRenderer for testing
 */
export const createMockPixiRenderer = () => ({
  initialize: vi.fn().mockResolvedValue(undefined),
  createSlide: vi.fn().mockResolvedValue(createMockPixiSprite()),
  updateViewport: vi.fn(),
  getPerformanceMetrics: vi.fn(() => createTestPerformanceMetrics()),
  dispose: vi.fn(),
});

/**
 * Create mock TextureManager for testing
 */
export const createMockTextureManager = () => ({
  loadTexture: vi.fn().mockResolvedValue(Texture.WHITE),
  loadTextures: vi.fn().mockResolvedValue([Texture.WHITE]),
  preloadTextures: vi.fn().mockResolvedValue(undefined),
  getCachedTexture: vi.fn().mockReturnValue(Texture.WHITE),
  clearCache: vi.fn(),
  getMemoryUsage: vi.fn(() => ({ used: 1024, cached: 5, total: 10240 })),
  dispose: vi.fn(),
});

/**
 * Create mock ResourceLoader for testing
 */
export const createMockResourceLoader = () => ({
  loadResources: vi.fn().mockResolvedValue(new Map([['test.jpg', {}]])),
  loadResource: vi.fn().mockResolvedValue({}),
  cancelLoading: vi.fn(),
  getLoadingStats: vi.fn(() => ({ pending: 0, completed: 1, failed: 0 })),
  dispose: vi.fn(),
});

/**
 * Create mock SpritePool for testing
 */
export const createMockSpritePool = () => ({
  getSprite: vi.fn().mockReturnValue(createMockPixiSprite()),
  returnSprite: vi.fn(),
  clear: vi.fn(),
  getStats: vi.fn(() => ({ available: 5, inUse: 3, total: 8 })),
  resize: vi.fn(),
  dispose: vi.fn(),
  optimize: vi.fn(),
});

/**
 * Create mock ShaderManager for testing
 */
export const createMockShaderManager = () => ({
  compileShader: vi.fn().mockResolvedValue({}),
  getShader: vi.fn().mockReturnValue({}),
  clearCache: vi.fn(),
  getStats: vi.fn(() => ({ cached: 5, compiled: 3, failed: 0 })),
  dispose: vi.fn(),
  precompileCommonShaders: vi.fn().mockResolvedValue(undefined),
  validateShaderSource: vi.fn(() => ({ isValid: true, errors: [] })),
});

/**
 * Create mock PerformanceMonitor for rendering testing
 */
export const createMockPhase3PerformanceMonitor = () => ({
  start: vi.fn(),
  stop: vi.fn(),
  getMetrics: vi.fn(() => createTestPerformanceMetrics()),
  getHistory: vi.fn(() => []),
  getTrends: vi.fn(() => ({
    fps: { trend: 'stable', change: 0 },
    memory: { trend: 'stable', change: 0 },
    overall: 'good',
  })),
  reset: vi.fn(),
  setThresholds: vi.fn(),
  onWarning: vi.fn(),
  onCritical: vi.fn(),
  recordFrame: vi.fn(),
  dispose: vi.fn(),
});

/**
 * Create test loading progress data
 */
export const createTestLoadingProgress = (
  loaded: number = 5,
  total: number = 10
) => ({
  loaded,
  total,
  percentage: (loaded / total) * 100,
  currentResource: 'test-resource.jpg',
  estimatedTimeRemaining: 1000,
});

/**
 * Create test PIXI configuration
 */
export const createTestPixiConfig = () => ({
  maxInitTime: 2000,
  developmentMode: false,
  shaderCache: {
    enabled: true,
    maxSize: 50,
  },
  texturePool: {
    initialSize: 10,
    maxSize: 100,
  },
});

/**
 * Create test texture configuration
 */
export const createTestTextureConfig = () => ({
  supportedFormats: ['jpg', 'png', 'webp'] as const,
  quality: 1.0,
  cacheSize: 20,
  lazyLoadThreshold: 2,
  loadTimeout: 100, // Short timeout for tests
  maxRetries: 1, // Fewer retries for tests
  retryDelay: {
    base: 10, // Short retry delay for tests
    multiplier: 2,
  },
});

/**
 * Create test sprite pool configuration
 */
export const createTestSpritePoolConfig = () => ({
  initialSize: 10,
  maxSize: 100,
  growthFactor: 1.5,
  shrinkThreshold: 0.25,
  resetProperties: ['x', 'y', 'scale', 'rotation', 'alpha', 'visible'] as const,
});

/**
 * Create test shader configuration
 */
export const createTestShaderConfig = () => ({
  compileTimeout: 100, // Short timeout for tests
  cacheExpiry: 300000,
  maxCached: 25,
  maxRecompiles: 1, // Fewer recompiles for tests
  enableDebugging: false,
});

/**
 * Create test resource configuration
 */
export const createTestResourceConfig = () => ({
  cleanupInterval: 5000, // Small interval for testing
  idleTimeout: 1000, // Short timeout for tests
  memoryPressureThreshold: 0.8,
  criticalMemoryThreshold: 0.95,
  trackReferences: true,
  autoCleanup: true,
});

/**
 * Create test resource information
 */
export const createTestPhase3ResourceInfo = (id: string = 'test-resource') => ({
  id,
  type: 'texture' as const,
  source: 'test-texture.jpg',
  memorySize: 1024 * 1024,
  createdAt: Date.now() - 5000,
  lastAccessed: Date.now() - 1000,
  refCount: 1,
  isActive: true,
  metadata: {},
});

/**
 * Test helper for rendering component initialization
 */
export const testPhase3ComponentInit = async (
  component: {
    initialize?: (config?: unknown) => Promise<void>;
    start?: () => void;
  },
  config?: unknown
) => {
  try {
    if (typeof component.initialize === 'function') {
      await component.initialize(config);
    } else if (typeof component.start === 'function') {
      component.start();
    }
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
};

/**
 * Test helper for rendering component cleanup
 */
export const testPhase3ComponentCleanup = (component: {
  dispose?: () => void;
  destroy?: () => void;
  cleanup?: () => void;
}) => {
  try {
    if (typeof component.dispose === 'function') {
      component.dispose();
    } else if (typeof component.destroy === 'function') {
      component.destroy();
    } else if (typeof component.cleanup === 'function') {
      component.cleanup();
    }
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
};

/**
 * Test helper for texture loading validation
 */
export const testTextureLoading = async (
  textureManager: {
    loadTextures: (
      urls: string[],
      onProgress?: (progress: {
        loaded: number;
        total: number;
        percentage: number;
      }) => void
    ) => Promise<unknown[]>;
  },
  urls: string[] = ['test1.jpg', 'test2.jpg']
) => {
  try {
    const progressUpdates: Array<{
      loaded: number;
      total: number;
      percentage: number;
    }> = [];

    const onProgress = (progress: {
      loaded: number;
      total: number;
      percentage: number;
    }) => {
      progressUpdates.push(progress);
    };

    const textures = await textureManager.loadTextures(urls, onProgress);

    return {
      success: true,
      textures,
      progressUpdates,
      loadedCount: textures.length,
    };
  } catch (error) {
    return { success: false, error, textures: [], progressUpdates: [] };
  }
};

/**
 * Test helper for sprite pool performance
 */
export const testSpritePoolPerformance = (
  spritePool: {
    getSprite: () => unknown;
    returnSprite: (sprite: unknown) => void;
    getStats: () => { available: number; inUse: number; total: number };
  },
  iterations: number = 100
) => {
  const startTime = performance.now();
  const sprites: unknown[] = [];

  // Get sprites
  for (let i = 0; i < iterations; i++) {
    sprites.push(spritePool.getSprite());
  }

  const getTime = performance.now() - startTime;

  // Return sprites
  const returnStartTime = performance.now();
  sprites.forEach((sprite) => spritePool.returnSprite(sprite));
  const returnTime = performance.now() - returnStartTime;

  const stats = spritePool.getStats();

  return {
    getTime,
    returnTime,
    totalTime: getTime + returnTime,
    averageGetTime: getTime / iterations,
    averageReturnTime: returnTime / iterations,
    stats,
  };
};

/**
 * Test helper for shader compilation validation
 */
export const testShaderCompilation = async (
  shaderManager: {
    compileShader: (
      vertexSrc: string,
      fragmentSrc: string,
      name?: string
    ) => Promise<unknown>;
    getStats: () => { cached: number; compiled: number; failed: number };
  },
  vertexSrc: string = 'vertex shader',
  fragmentSrc: string = 'fragment shader'
) => {
  try {
    const startTime = performance.now();
    const shader = await shaderManager.compileShader(
      vertexSrc,
      fragmentSrc,
      'test-shader'
    );
    const compilationTime = performance.now() - startTime;

    const stats = shaderManager.getStats();

    return {
      success: true,
      shader,
      compilationTime,
      stats,
    };
  } catch (error) {
    return { success: false, error, compilationTime: 0 };
  }
};

/**
 * Test helper for performance monitoring validation
 */
export const testPhase3PerformanceMonitoring = async (
  monitor: {
    start: () => void;
    recordFrame: () => void;
    getMetrics: () => unknown;
    getTrends: () => unknown;
    getHistory: (duration: number) => unknown;
    stop: () => void;
  },
  duration: number = 1000
) => {
  monitor.start();

  // Simulate frames
  for (let i = 0; i < 60; i++) {
    monitor.recordFrame();
    await new Promise((resolve) => setTimeout(resolve, 16)); // ~60fps
  }

  const metrics = monitor.getMetrics();
  const trends = monitor.getTrends();
  const history = monitor.getHistory(duration);

  monitor.stop();

  return { metrics, trends, history };
};

/**
 * Create mock GlProgram for shader testing
 */
export const createMockGlProgram = (name = 'test-shader') => ({
  name,
  vertex: 'vertex-shader-source',
  fragment: 'fragment-shader-source',
  destroy: vi.fn(),
  bind: vi.fn(),
  unbind: vi.fn(),
  uniforms: {},
  attributes: {},
});

/**
 * Create mock asset loader for resource testing
 */
export const createMockAssetLoader = () => ({
  load: vi.fn().mockResolvedValue({}),
  loadBundle: vi.fn().mockResolvedValue({}),
  unload: vi.fn(),
  get: vi.fn(),
  cache: new Map(),
  resolver: {
    add: vi.fn(),
    resolve: vi.fn(),
  },
});

/**
 * Create test shader sources
 */
export const createTestShaderSources = () => ({
  vertex: `
    attribute vec2 aVertexPosition;
    uniform mat3 projectionMatrix;
    void main(void) {
      gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    }
  `,
  fragment: `
    precision mediump float;
    uniform vec4 uColor;
    void main(void) {
      gl_FragColor = uColor;
    }
  `,
});

/**
 * Create test resource definitions
 */
export const createTestResourceDefinitions = () => [
  { url: 'test-texture-1.jpg', type: 'texture' },
  { url: 'test-texture-2.png', type: 'texture' },
  { url: 'test-audio.mp3', type: 'audio' },
  { url: 'test-data.json', type: 'json' },
];

/**
 * Create mock resource definition
 */
export const createMockResourceDefinition = (
  url = 'test-resource.jpg',
  type = 'texture'
) => ({
  url,
  type,
  priority: 100,
  metadata: { size: 1024 },
});

/**
 * Create mock loading progress
 */
export const createMockLoadingProgress = (loaded = 0, total = 100) => ({
  loaded,
  total,
  percentage: (loaded / total) * 100,
  estimatedTimeRemaining: 1000,
});
