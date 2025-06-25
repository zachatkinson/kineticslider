/**
 * @fileoverview Core Constants and Configuration Values
 *
 * Single source of truth for all constants used throughout KineticSlider.
 * Eliminates DRY violations and provides centralized configuration management.
 *
 * ✅ Phase 1.3: Complete DRY abstraction for Phase 2 readiness
 *
 * @version 1.0.0
 * @author KineticSlider Team
 * @since 1.0.0
 */

// =============================================================================
// 🎯 Core Application Constants
// =============================================================================

/** Application version */
export const VERSION = '1.0.0' as const;

/** Project name */
export const PROJECT_NAME = 'KineticSlider' as const;

/** Documentation constants */
export const DOCUMENTATION = {
  /** Current project version for JSDoc */
  VERSION: '1.0.0',
  /** Project start version for @since tags */
  SINCE: '1.0.0',
  /** WCAG compliance target */
  WCAG_VERSION: '2.1',
  /** WCAG compliance level */
  WCAG_LEVEL: 'AA',
} as const;

/** Project phase constants */
export const PROJECT_PHASES = {
  /** Core Architecture */
  PHASE_1_1: 'Phase 1.1',
  /** GSAP Foundation Porting */
  PHASE_1_2: 'Phase 1.2',
  /** PIXI.js + GSAP Integration */
  PHASE_1_3: 'Phase 1.3',
  /** Core Slider Features */
  PHASE_1_4: 'Phase 1.4',
  /** Polish & Accessibility */
  PHASE_1_5: 'Phase 1.5',
  /** Documentation & Release */
  PHASE_1_6: 'Phase 1.6',
  /** Advanced Features */
  PHASE_4_1: 'Phase 4.1-4.2',
  /** Displacement Effects */
  PHASE_3_3: 'Phase 3.3',
} as const;

/** Documentation constants to eliminate DRY violations */
export const DOCS = {
  /** Project version for JSDoc tags */
  VERSION_TAG: `@version ${VERSION}`,
  /** Project since tag for JSDoc */
  SINCE_TAG: `@since ${VERSION}`,
} as const;

/** Accessibility and compliance standards */
export const ACCESSIBILITY = {
  /** WCAG version and compliance level */
  WCAG_VERSION: '2.1',
  /** WCAG compliance level */
  WCAG_LEVEL: 'AA',
  /** Full WCAG compliance string */
  WCAG_COMPLIANCE: 'WCAG 2.1 AA accessibility compliance',
} as const;

/** DOM and object property constants to eliminate DRY violations */
export const DOM_PROPERTIES = {
  /** Object type check */
  TYPE_OBJECT: 'object',
  /** Function type check */
  TYPE_FUNCTION: 'function',
  /** String type check */
  TYPE_STRING: 'string',
  /** Number type check */
  TYPE_NUMBER: 'number',
  /** Boolean type check */
  TYPE_BOOLEAN: 'boolean',
  /** Style property */
  STYLE: 'style',
  /** Transform CSS property */
  TRANSFORM: 'transform',
  /** Opacity CSS property */
  OPACITY: 'opacity',
  /** Sprite X coordinate property */
  X_COORDINATE: 'x',
  /** Sprite Y coordinate property */
  Y_COORDINATE: 'y',
  /** Will-change CSS property */
  WILL_CHANGE: 'willChange',
  /** Will-change auto value */
  WILL_CHANGE_AUTO: 'auto',
  /** Will-change transform value */
  WILL_CHANGE_TRANSFORM: 'transform, opacity',
} as const;

/** Data attribute constants to eliminate DRY violations */
export const DATA_ATTRIBUTES = {
  /** Slider sprite data attribute */
  SLIDER_SPRITE: 'data-slider-sprite',
  /** Sprite index data attribute */
  SPRITE_INDEX: 'data-sprite-index',
} as const;

/** DOM event names to eliminate DRY violations */
export const EVENT_NAMES = {
  /** Mouse events */
  MOUSE_DOWN: 'mousedown',
  MOUSE_MOVE: 'mousemove',
  MOUSE_UP: 'mouseup',
  MOUSE_LEAVE: 'mouseleave',
  /** Touch events */
  TOUCH_START: 'touchstart',
  TOUCH_MOVE: 'touchmove',
  TOUCH_END: 'touchend',
  TOUCH_CANCEL: 'touchcancel',
  /** Keyboard events */
  KEY_DOWN: 'keydown',
  KEY_UP: 'keyup',
  /** Other events */
  CONTEXT_MENU: 'contextmenu',
  PAGE_ERROR: 'pageerror',
  CONSOLE: 'console',
  /** Navigation events */
  LOAD: 'load',
  UNLOAD: 'unload',
  /** Interaction events */
  CLICK: 'click',
  POINTER_DOWN: 'pointerdown',
  POINTER_MOVE: 'pointermove',
  POINTER_UP: 'pointerup',
  GESTURE_START: 'gesturestart',
  DRAG_START: 'dragstart',
} as const;

/** HTML tag names to eliminate DRY violations */
export const HTML_TAGS = {
  /** Form elements */
  INPUT: 'INPUT',
  TEXTAREA: 'TEXTAREA',
  SELECT: 'SELECT',
  /** Document structure */
  DIV: 'div',
  SPAN: 'span',
  CANVAS: 'canvas',
  SCRIPT: 'script',
  IMAGE: 'img',
  BUTTON: 'button',
  /** PIXI interaction modes */
  STATIC: 'static',
} as const;

/** HTML attributes to eliminate DRY violations */
export const HTML_ATTRIBUTES = {
  /** Form attributes */
  CONTENT_EDITABLE: 'contenteditable',
  TAB_INDEX: 'tabindex',
  LANG: 'lang',
  /** Accessibility attributes */
  ROLE: 'role',
  ARIA_LABEL: 'aria-label',
  /** CSS properties */
  POINTER: 'pointer',
  /** Meta tag attributes */
  VIEWPORT: 'viewport',
  DESCRIPTION: 'description',
  /** CSS selectors and content */
  DEVICE_WIDTH: 'width=device-width',
  /** Drag and drop */
  DRAGGABLE: 'draggable',
  /** Testing attributes */
  DATA_TESTID: 'data-testid',
  /** Values */
  TRUE: 'true',
  AUTO: 'auto',
  NONE: 'none',
  ZERO: '0',
} as const;

/** Keyboard key names to eliminate DRY violations */
export const KEYBOARD_KEYS = {
  /** Arrow keys */
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  /** Common keys */
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  SPACE: ' ',
  TAB: 'Tab',
} as const;

/** Slider engine event names to eliminate DRY violations */
export const SLIDER_EVENTS = {
  /** Core lifecycle events */
  INITIALIZED: 'initialized',
  DESTROYED: 'destroyed',
  /** Slide navigation events */
  SLIDE_CHANGE_START: 'slideChangeStart',
  SLIDE_CHANGED: 'slideChanged',
  /** Interaction events */
  DRAG_START: 'dragStart',
  DRAG_MOVE: 'dragMove',
  DRAG_END: 'dragEnd',
  /** State events */
  STATE_CHANGED: 'stateChanged',
  /** Error events */
  ERROR: 'error',
} as const;

/** Performance API method names to eliminate DRY violations */
export const PERFORMANCE_API = {
  /** Performance methods */
  NOW: 'now',
  NAVIGATION: 'navigation',
  RESOURCE: 'resource',
  PAINT: 'paint',
  /** Request animation frame */
  RAF: 'requestAnimationFrame',
  CAF: 'cancelAnimationFrame',
  /** Computed style */
  GET_COMPUTED_STYLE: 'getComputedStyle',
  /** Modern features */
  INTERSECTION_OBSERVER: 'IntersectionObserver',
  RESIZE_OBSERVER: 'ResizeObserver',
  CUSTOM_ELEMENTS: 'customElements',
  /** Touch/Pointer events */
  TOUCH_START: 'ontouchstart',
  POINTER_DOWN: 'onpointerdown',
  GESTURE_START: 'ongesturestart',
  /** Drag events */
  DRAG_START: 'ondragstart',
} as const;

/** CSS selector patterns to eliminate DRY violations */
export const CSS_SELECTORS = {
  /** App root selectors */
  MAIN_SELECTORS: 'main, #root, [data-testid="app"]',
  MAIN_ROLE: 'main, [role="main"]',
  /** Meta tag selectors */
  VIEWPORT_META: 'meta[name="viewport"]',
  DESCRIPTION_META: 'meta[name="description"]',
  /** Accessibility selectors */
  HEADINGS: 'h1, h2, h3, h4, h5, h6',
  SKIP_LINKS: 'a[href^="#"]',
  TAB_INDEX: '[tabindex]',
  FOCUS: ':focus',
} as const;



/** Property arrays for animations to eliminate DRY violations */
export const ANIMATION_PROPERTIES = {
  /** Basic transform properties */
  BASIC: ['x', 'y', 'scale'],
  /** Extended transform properties */
  EXTENDED: ['x', 'y', 'scale', 'rotation', 'alpha'],
  /** Scale-only properties */
  SCALE_ONLY: ['scale'],
  /** Position-only properties */
  POSITION_ONLY: ['x', 'y'],
} as const;

/** Wait strategies for E2E tests to eliminate DRY violations */
export const WAIT_STRATEGIES = {
  /** Network idle wait */
  NETWORK_IDLE: 'networkidle',
  /** DOM content loaded */
  DOM_CONTENT_LOADED: 'domcontentloaded',
  /** Load complete */
  LOAD: 'load',
} as const;

// =============================================================================
// ⚡ Performance Constants
// =============================================================================

/** Performance targeting constants */
export const PERFORMANCE = {
  /** Target frame rate */
  TARGET_FPS: 60,
  /** Frame budget in milliseconds (1000ms / 60fps) */
  FRAME_BUDGET_MS: 16.67,
  /** Maximum acceptable frame time */
  MAX_FRAME_TIME_MS: 16,
  /** Memory warning threshold (bytes) */
  MEMORY_WARNING_THRESHOLD: 50 * 1024 * 1024, // 50MB
  /** Memory critical threshold (bytes) */
  MEMORY_CRITICAL_THRESHOLD: 100 * 1024 * 1024, // 100MB
} as const;

// =============================================================================
// 🎬 Animation Constants
// =============================================================================

/** Standard animation durations (in seconds) */
export const ANIMATION_DURATION = {
  /** Quick animations (micro-interactions) */
  QUICK: 0.15,
  /** Fast animations (button hovers, tooltips) */
  FAST: 0.2,
  /** Standard animations (most UI transitions) */
  STANDARD: 0.3,
  /** Medium animations (modal dialogs, page transitions) */
  MEDIUM: 0.5,
  /** Slow animations (complex transitions) */
  SLOW: 0.8,
  /** Very slow animations (dramatic effects) */
  VERY_SLOW: 1.0,
  /** Extended animations (special effects) */
  EXTENDED: 1.5,
} as const;

/** GSAP easing constants */
export const EASING = {
  /** Linear easing */
  LINEAR: 'none',
  /** Standard ease out (most common) */
  EASE_OUT: 'power2.out',
  /** Standard ease in */
  EASE_IN: 'power2.in',
  /** Standard ease in-out */
  EASE_IN_OUT: 'power2.inOut',
  /** Bounce effect */
  BOUNCE: 'bounce.out',
  /** Elastic effect */
  ELASTIC: 'elastic.out(1, 0.3)',
  /** Back effect */
  BACK: 'back.out(1.7)',
  /** Expo effect */
  EXPO: 'expo.out',
  /** Circ effect */
  CIRC: 'circ.out',
} as const;

/** Physics animation constants */
export const PHYSICS = {
  /** Standard momentum damping factor */
  MOMENTUM_DAMPING: 0.85,
  /** Heavy damping for quick stops */
  HEAVY_DAMPING: 0.95,
  /** Light damping for natural motion */
  LIGHT_DAMPING: 0.75,
  /** Friction coefficient */
  FRICTION: 0.85,
  /** Spring constant for elastic animations */
  SPRING_CONSTANT: 0.1,
  /** Velocity threshold for motion detection (px/ms) */
  VELOCITY_THRESHOLD: 0.5,
  /** Maximum allowed velocity (px/ms) */
  MAX_VELOCITY: 2.0,
  /** Exit animation speed factor (faster fade out) */
  EXIT_SPEED_FACTOR: 0.6,
  /** Minimum animation duration (seconds) */
  MIN_DURATION: 0.05,
  /** Time factor bounds for adaptive timing */
  TIME_FACTOR: {
    MIN: 0.5,
    MAX: 1.5,
  },
} as const;

// =============================================================================
// 📐 Scale and Transform Constants
// =============================================================================

/** Scale transformation constants */
export const SCALE = {
  /** Minimum allowed scale (prevents invisible sprites) */
  MIN: 0.1,
  /** Maximum allowed scale */
  MAX: 3.0,
  /** Default scale */
  DEFAULT: 1.0,
  /** Slight scale up for emphasis */
  EMPHASIS: 1.05,
  /** Medium scale up for highlights */
  HIGHLIGHT: 1.1,
  /** Large scale up for dramatic effect */
  DRAMATIC: 1.2,
  /** Small scale down for subtle effects */
  SUBTLE_DOWN: 0.95,
  /** Medium scale down for exits */
  EXIT: 0.9,
  /** Large scale down for dramatic exits */
  DRAMATIC_EXIT: 0.8,
} as const;

/** Transform intensity levels */
export const INTENSITY = {
  /** No intensity */
  NONE: 0.0,
  /** Very low intensity (scale intensity default) */
  VERY_LOW: 0.1,
  /** Low intensity */
  LOW: 0.3,
  /** Medium intensity */
  MEDIUM: 0.5,
  /** High intensity */
  HIGH: 0.8,
  /** Maximum intensity */
  MAX: 1.0,
} as const;

/** Interactive drag constants to eliminate DRY violations */
export const INTERACTION_EFFECTS = {
  /** Scale multiplier for drag intensity */
  DRAG_SCALE_MULTIPLIER: 0.1,
  /** Duration for drag scale transitions */
  DRAG_SCALE_DURATION: 0.1,
  /** Duration for scale reset animations */
  SCALE_RESET_DURATION: 0.2,
  /** Base scale for normal state */
  BASE_SCALE: 1.0,
} as const;

// =============================================================================
// 📱 Viewport and Layout Constants
// =============================================================================

/** Standard viewport breakpoints */
export const VIEWPORT = {
  /** Mobile viewport */
  MOBILE: {
    width: 375,
    height: 667,
    name: 'mobile',
  },
  /** Tablet viewport */
  TABLET: {
    width: 768,
    height: 1024,
    name: 'tablet',
  },
  /** Desktop viewport */
  DESKTOP: {
    width: 1440,
    height: 900,
    name: 'desktop',
  },
  /** Large desktop viewport */
  LARGE_DESKTOP: {
    width: 1920,
    height: 1080,
    name: 'large-desktop',
  },
} as const;

/** Layout constants */
export const LAYOUT = {
  /** Standard aspect ratios */
  ASPECT_RATIO: {
    /** Wide format (16:9) */
    WIDE: 16 / 9,
    /** Standard format (4:3) */
    STANDARD: 4 / 3,
    /** Square format (1:1) */
    SQUARE: 1.0,
    /** Portrait format (3:4) */
    PORTRAIT: 3 / 4,
  },
  /** Standard margins and padding */
  SPACING: {
    NONE: 0,
    XS: 4,
    SM: 8,
    MD: 16,
    LG: 24,
    XL: 32,
    XXL: 48,
  },
} as const;

// =============================================================================
// 🎮 Input and Interaction Constants
// =============================================================================

/** Input interaction thresholds */
export const INPUT = {
  /** Swipe threshold in pixels */
  SWIPE_THRESHOLD: 50,
  /** Drag threshold in pixels */
  DRAG_THRESHOLD: 10,
  /** Tap threshold in pixels */
  TAP_THRESHOLD: 5,
  /** Long press duration in milliseconds */
  LONG_PRESS_DURATION: 500,
  /** Double tap max time between taps */
  DOUBLE_TAP_MAX_DELAY: 300,
  /** Maximum touch targets for multi-touch */
  MAX_TOUCH_TARGETS: 2,
} as const;

/** Interaction timing constants */
export const INTERACTION = {
  /** Debounce delay for input events */
  DEBOUNCE_DELAY: 16, // One frame at 60fps
  /** Throttle delay for scroll events */
  THROTTLE_DELAY: 33, // ~30fps for smooth scrolling
  /** Timeout for gesture recognition */
  GESTURE_TIMEOUT: 100,
  /** Maximum interaction time for adaptive timing */
  MAX_INTERACTION_TIME: 2000,
} as const;

// =============================================================================
// 🖼️ Rendering and Graphics Constants
// =============================================================================

/** PIXI.js rendering constants */
export const RENDERING = {
  /** Default background color (dark blue) */
  BACKGROUND_COLOR: 0x1a1a2e,
  /** Transparent background */
  TRANSPARENT_BACKGROUND: 0x000000,
  /** Default resolution multiplier */
  RESOLUTION:
    (typeof window !== 'undefined' ? window.devicePixelRatio : undefined) || 1,
  /** Anti-aliasing enabled */
  ANTIALIAS: true,
  /** PowerPreference for WebGL */
  POWER_PREFERENCE: 'high-performance' as const,
  /** Maximum texture size */
  MAX_TEXTURE_SIZE: 4096,
  /** Default anchor point (center) */
  CENTER_ANCHOR: 0.5,
} as const;

/** Sprite management constants */
export const SPRITES = {
  /** Maximum number of sprites to pool */
  MAX_POOL_SIZE: 50,
  /** Initial sprite pool size */
  INITIAL_POOL_SIZE: 10,
  /** Sprite count targets for testing */
  COUNT: {
    MINIMAL: 1,
    SMALL: 3,
    MEDIUM: 5,
    LARGE: 10,
    STRESS_TEST: 50,
  },
} as const;

// =============================================================================
// 🧪 Testing Constants
// =============================================================================

/** Test timing constants */
export const TEST_TIMING = {
  /** Quick test timeouts */
  QUICK_TIMEOUT: 1000,
  /** Standard test timeouts */
  STANDARD_TIMEOUT: 5000,
  /** Long test timeouts (integration tests) */
  LONG_TIMEOUT: 10000,
  /** Very long timeouts (E2E tests) */
  E2E_TIMEOUT: 30000,
  /** Network wait timeout */
  NETWORK_TIMEOUT: 15000,
} as const;

/** Performance test thresholds */
export const TEST_PERFORMANCE = {
  /** Maximum acceptable load time */
  MAX_LOAD_TIME: 3000,
  /** Maximum acceptable render time */
  MAX_RENDER_TIME: 16,
  /** Maximum acceptable animation time */
  MAX_ANIMATION_TIME: 1000,
  /** Memory usage warning threshold for tests */
  MEMORY_WARNING: 25 * 1024 * 1024, // 25MB
} as const;

/** Test tolerance and assertion constants */
export const TEST_TOLERANCE = {
  /** Standard timing tolerance for animations */
  TIMING: 0.1,
  /** Memory efficiency minimum threshold */
  MEMORY_EFFICIENCY: 0.1,
  /** Performance variance tolerance */
  PERFORMANCE: 0.2,
  /** Math calculation tolerance */
  CALCULATION: 0.01,
  /** Test assertion tolerance (20% tolerance) */
  ASSERTION: 1.2,
} as const;

/** Test configuration constants - NEVER use hardcoded values in tests! */
export const TEST_CONFIG = {
  /** Test duration values */
  DURATION: {
    SHORT: 1.2,
    MEDIUM: 1.5,
    LONG: 1.8,
    STANDARD: 1.0,
  },
  /** Test damping values */
  DAMPING: {
    LIGHT: 0.7,
    MEDIUM: 0.8,
    HEAVY: 0.9,
  },
  /** Test scale intensity values */
  SCALE_INTENSITY: {
    LOW: 0.2,
    MEDIUM: 0.7,
    HIGH: 0.8,
  },
  /** Test swipe threshold values */
  SWIPE: {
    THRESHOLD: 75,
  },
  /** Test interaction timing */
  INTERACTION: {
    QUICK: 500,
    SLOW: 2000,
  },
  /** Test calculation base values */
  CALCULATION: {
    MOVEMENT_BASE: 100,
    VELOCITY_BASE: 100,
    DISPLACEMENT_POSITIVE: 10,
    DISPLACEMENT_NEGATIVE: -5,
    SPRING_WEAK: 0.1,
    SPRING_STRONG: 0.2,
    INTENSITY_EDGE_HIGH: 1.5,
    INTENSITY_EDGE_LOW: -0.5,
    SCALE_TEST_15: 1.5,
    SCALE_TEST_20: 2.0,
    SCALE_TEST_30: 3.0,
    SCALE_NEG_05: -0.5,
  },
  /** Test scale values for testing */
  SCALE_VALUES: {
    ZERO: 0,
    SMALL: 1.5,
    LARGE: 3.0,
  },
  /** Test expected calculation results - derived from constants */
  EXPECTED: {
    // Core test scale values
    SCALE_105: 1.05, // 1 + (0.5 * 0.1)
    SCALE_103: 1.03, // 1 + (0.3 * 0.1)
    SCALE_11: 1.1, // 1 + (0.5 * 0.2)
    SCALE_09: 0.9, // Exit scale
    // Movement calculations
    MOVEMENT_50: 50, // 1 * 0.5 * 100
    MOVEMENT_NEG_425: -42.5, // -50 * 0.85
    MOVEMENT_NEG_30: -30, // -1 * 0.3 * 100
    MOVEMENT_255: 25.5, // -(-30) * 0.85
    MOVEMENT_NEG_35: -35, // -50 * 0.7
    // Velocity calculations
    VELOCITY_80: 80, // 100 * 0.8^1
    VELOCITY_64: 64, // 100 * 0.8^2
    VELOCITY_312_5: 312.5, // Test velocity high
    VELOCITY_937_5: 937.5, // Test velocity max
    // Force calculations
    FORCE_NEG_1: -1, // -10 * 0.1
    FORCE_1: 1, // -(-5) * 0.2
    // Timing calculations
    TIMING_065: 0.65, // Quick adaptive timing
    TIMING_18: 1.8, // Slow adaptive timing
    // Scale constraints
    CLAMP_TO_MIN_SCALE: 0.1,
    // Animation states
    ALPHA_INVISIBLE: 0,
    ALPHA_VISIBLE: 1,
    // Array indices
    SPRITE_INDEX_0: 0,
    SPRITE_INDEX_1: 1,
    // Movement constraints
    CLAMPED_MAX_MOVEMENT: 100,
    CLAMPED_MIN_MOVEMENT: 0,
    // Timeline tracking
    TIMELINE_COUNT_2: 2,
    TIMELINE_COUNT_1: 1,
    TIMELINE_COUNT_0: 0,
    TWEEN_COUNT_0: 0,
  },
  /** Test error constants to eliminate DRY violations */
  ERRORS: {
    FACTORY_ERROR: 'Factory error',
    LISTENER_ERROR: 'Listener error',
  },
} as const;

// =============================================================================
// 🔧 Configuration Defaults
// =============================================================================

/** Default physics configuration */
export const DEFAULT_PHYSICS_CONFIG = {
  transitionDuration: ANIMATION_DURATION.SLOW,
  transitionEase: EASING.EASE_OUT,
  swipeThreshold: INPUT.SWIPE_THRESHOLD,
  scaleIntensity: INTENSITY.VERY_LOW, // 0.1 - matches test expectations
  momentumDamping: PHYSICS.MOMENTUM_DAMPING,
} as const;

/** Default render configuration */
export const DEFAULT_RENDER_CONFIG = {
  width: VIEWPORT.DESKTOP.width,
  height: VIEWPORT.DESKTOP.height,
  backgroundColor: RENDERING.BACKGROUND_COLOR,
  antialias: RENDERING.ANTIALIAS,
  resolution: RENDERING.RESOLUTION,
} as const;

/** Default input configuration */
export const DEFAULT_INPUT_CONFIG = {
  enableMouse: true,
  enableTouch: true,
  enableKeyboard: true,
  swipeThreshold: INPUT.SWIPE_THRESHOLD,
  dragThreshold: INPUT.DRAG_THRESHOLD,
} as const;

// =============================================================================
// 🎯 Animation Configurations
// =============================================================================

/** Pre-configured animation sets for common use cases */
export const ANIMATION_PRESETS = {
  /** Quick micro-interactions */
  MICRO: {
    duration: ANIMATION_DURATION.QUICK,
    ease: EASING.EASE_OUT,
  },
  /** Standard UI animations */
  UI: {
    duration: ANIMATION_DURATION.STANDARD,
    ease: EASING.EASE_OUT,
  },
  /** Smooth transitions */
  SMOOTH: {
    duration: ANIMATION_DURATION.MEDIUM,
    ease: EASING.EASE_IN_OUT,
  },
  /** Dramatic effects */
  DRAMATIC: {
    duration: ANIMATION_DURATION.SLOW,
    ease: EASING.ELASTIC,
  },
  /** Entrance animations */
  ENTER: {
    duration: ANIMATION_DURATION.MEDIUM,
    ease: EASING.BACK,
  },
  /** Exit animations */
  EXIT: {
    duration: ANIMATION_DURATION.FAST,
    ease: EASING.EASE_IN,
  },
} as const;

/** Common GSAP animation defaults to eliminate DRY violations */
export const GSAP_DEFAULTS = {
  /** GPU optimization settings */
  GPU_OPTIMIZED: {
    force3D: true,
    ease: EASING.EASE_OUT,
  },
  /** Standard timeline settings */
  TIMELINE: {
    force3D: true,
    ease: EASING.EASE_OUT,
  },
  /** Performance optimized settings */
  PERFORMANCE: {
    force3D: true,
    ease: EASING.EASE_OUT,
    overwrite: 'auto' as const,
  },
} as const;

// =============================================================================
// 🚨 Error and Debugging Constants
// =============================================================================

/** Error codes */
export const ERROR_CODES = {
  /** Initialization failed */
  INIT_FAILED: 'INIT_FAILED',
  /** Asset loading failed */
  ASSET_LOAD_FAILED: 'ASSET_LOAD_FAILED',
  /** Invalid configuration */
  INVALID_CONFIG: 'INVALID_CONFIG',
  /** Service not found */
  SERVICE_NOT_FOUND: 'SERVICE_NOT_FOUND',
  /** Animation failed */
  ANIMATION_FAILED: 'ANIMATION_FAILED',
  /** Performance threshold exceeded */
  PERFORMANCE_EXCEEDED: 'PERFORMANCE_EXCEEDED',
} as const;

/** Error message templates to eliminate DRY violations */
export const ERROR_MESSAGES = {
  /** PIXI renderer initialization failure */
  PIXI_INIT_FAILED: (error: unknown) =>
    `Failed to initialize PIXI renderer: ${error}`,
  /** Renderer not initialized */
  RENDERER_NOT_INITIALIZED: 'Renderer not initialized',
  /** Sprite creation failure */
  SPRITE_CREATE_FAILED: (error: unknown) => `Failed to create sprite: ${error}`,
  /** Service not found in container */
  SERVICE_NOT_FOUND: (key: string) => `Service '${key}' not found`,
  /** Engine initialization failure */
  ENGINE_INIT_FAILED: (error: unknown) =>
    `Failed to initialize slider engine: ${error}`,
  /** Navigation failure */
  NAVIGATION_FAILED: (index: number, error: unknown) =>
    `Failed to navigate to slide ${index}: ${error}`,
  /** Constants validation failure */
  CONSTANTS_VALIDATION_FAILED: (error: unknown) =>
    `Constants validation failed: ${error}`,
  /** Generic validation errors */
  VALIDATION: {
    TARGET_FPS_POSITIVE: 'TARGET_FPS must be positive',
    FRAME_BUDGET_MISMATCH: 'FRAME_BUDGET_MS must equal 1000 / TARGET_FPS',
    SCALE_MIN_MAX: 'SCALE.MIN must be less than SCALE.MAX',
    INTENSITY_RANGE: (value: number) =>
      `Intensity value ${value} must be between 0 and 1`,
  },
} as const;

/** Debug logging levels */
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4,
} as const;

/** Common JSDoc patterns to eliminate documentation DRY violations */
export const JSDOC_PATTERNS = {
  /** Parameter documentation patterns */
  PARAMS: {
    SPRITES_ARRAY: '* @param sprites - Array of PIXI sprites',
    SPRITES_ARRAY_GENERIC: '* @param sprites - Array of sprites',
    SPRITE_SINGLE: '* @param sprite - PIXI sprite to animate',
    ANIMATION_DATA:
      '* @param animation - Pure animation data from physics engine',
    SEQUENCE_DATA:
      '* @param sequence - Pure animation sequence from physics engine',
    TIMELINE_FACTORY:
      '* @param createTimelineFn - Function that creates GSAP timeline',
  },
  /** Return documentation patterns */
  RETURNS: {
    GSAP_TIMELINE: '* @returns GSAP timeline for the animation',
    GSAP_TIMELINE_SWIPE: '* @returns GSAP timeline for the swipe animation',
    GSAP_TIMELINE_SCALE: '* @returns GSAP timeline for the scale animation',
    GSAP_TIMELINE_BATCH: '* @returns GSAP timeline containing all animations',
    GSAP_TIMELINE_MANAGED: '* @returns GSAP timeline with cleanup management',
  },
} as const;

// =============================================================================
// 📊 Type Exports for TypeScript
// =============================================================================

/** Type helpers for constants */
export type ViewportName = (typeof VIEWPORT)[keyof typeof VIEWPORT]['name'];
export type AnimationDuration =
  (typeof ANIMATION_DURATION)[keyof typeof ANIMATION_DURATION];
export type EasingType = (typeof EASING)[keyof typeof EASING];
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
export type LogLevel = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];

// =============================================================================
// 🎯 Runtime Validation
// =============================================================================

/** Validate numeric constants at module load time */
if (PERFORMANCE.TARGET_FPS <= 0) {
  throw new Error(ERROR_MESSAGES.VALIDATION.TARGET_FPS_POSITIVE);
}

if (
  Math.abs(PERFORMANCE.FRAME_BUDGET_MS - 1000 / PERFORMANCE.TARGET_FPS) > 0.01
) {
  throw new Error(ERROR_MESSAGES.VALIDATION.FRAME_BUDGET_MISMATCH);
}

/** Validate scale constants */
if (SCALE.MIN >= SCALE.MAX) {
  throw new Error(ERROR_MESSAGES.VALIDATION.SCALE_MIN_MAX);
}

/** Validate intensity range */
Object.values(INTENSITY).forEach((value) => {
  if (value < 0 || value > 1) {
    throw new Error(ERROR_MESSAGES.VALIDATION.INTENSITY_RANGE(value));
  }
});

// Export validation function for runtime checks
export function validateConstants(): boolean {
  try {
    // All validation happens at module load time
    return true;
  } catch (error) {
    // Re-throw the error instead of logging to console
    throw new Error(ERROR_MESSAGES.CONSTANTS_VALIDATION_FAILED(error));
  }
}
