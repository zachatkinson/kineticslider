/**
 * @fileoverview Core Module Barrel Exports
 *
 * Centralized exports to eliminate DRY violations in import statements.
 * Groups commonly used constants by usage patterns to reduce maintenance overhead.
 *
 * @version 1.0.0
 * @since 1.0.0
 */

// =============================================================================
// 🎯 Core System Exports
// =============================================================================

export type {
  // Core interfaces
  ISliderEngine,
  ISliderPhysics,
  ISliderRenderer,
  ISliderController,

  // Configuration types
  SliderConfig,
  PhysicsConfig,
  RenderConfig,
  InputConfig,

  // State and data types
  SliderState,
  EventEmitter,
  InputCallbacks,
  SlideData,
  FilterConfig,
  DisplacementConfig,
  SliderText,

  // Service types
  ServiceKey,
} from './types';

export type { IServiceContainer } from './container';
export { serviceContainer, SERVICE_KEYS } from './container';
export { SimpleEventEmitter } from './event-emitter';
export { SliderEngine } from './engine';

// =============================================================================
// 🎨 Animation Constants Group
// =============================================================================

export {
  ANIMATION_DURATION,
  EASING,
  PHYSICS,
  SCALE,
  INTENSITY,
  ANIMATION_PRESETS,
  GSAP_DEFAULTS,
} from './constants';

// =============================================================================
// 🛠️ Configuration Constants Group
// =============================================================================

export {
  DEFAULT_PHYSICS_CONFIG,
  DEFAULT_RENDER_CONFIG,
  DEFAULT_INPUT_CONFIG,
} from './constants';

// =============================================================================
// 🚨 Error and Messaging Constants Group
// =============================================================================

export {
  ERROR_CODES,
  ERROR_MESSAGES,
  SLIDER_EVENTS,
  INTERACTION_EFFECTS,
} from './constants';

// =============================================================================
// 🖼️ Rendering Constants Group
// =============================================================================

export { RENDERING, SPRITES, VIEWPORT, LAYOUT } from './constants';

// =============================================================================
// 🎮 Input and DOM Constants Group
// =============================================================================

export {
  INPUT,
  INTERACTION,
  EVENT_NAMES,
  KEYBOARD_KEYS,
  DOM_PROPERTIES,
  HTML_TAGS,
  HTML_ATTRIBUTES,
  CSS_SELECTORS,
  DATA_ATTRIBUTES,
} from './constants';

// =============================================================================
// 🧪 Testing Constants Group
// =============================================================================

export {
  TEST_CONFIG,
  TEST_TIMING,
  TEST_PERFORMANCE,
  TEST_TOLERANCE,
  WAIT_STRATEGIES,
  ANIMATION_PROPERTIES,
} from './constants';

// =============================================================================
// 📊 Performance and System Constants
// =============================================================================

export {
  PERFORMANCE,
  PERFORMANCE_API,
  VERSION,
  PROJECT_NAME,
  PROJECT_PHASES,
  LOG_LEVELS,
} from './constants';

// =============================================================================
// 🎯 Validation and Utilities
// =============================================================================

export { validateConstants } from './constants';
