/**
 * Central type exports for the application
 */

// Animation types
export * from './animation';

// Analytics types
export * from './analytics';

// Accessibility types
export {
  type FocusManagerProps,
  type AccessibilityAction,
  type AccessibilityEvent,
  type AccessibilityConfig,
  type UseSliderAccessibilityProps
} from './accessibility';

// Branded types
export * from './branded';

// Browser types
export * from './browser';

// Common types
export * from './common';

// Component types
export * from './components';

// Error types
export {
  type BaseError,
  type AnimationError,
  type GestureError,
  type NavigationError,
  type RenderError
} from './error';

// Gesture types
export * from './gesture';

// GSAP types
export * from './gsap';

// Hook types
export {
  type UseAnimationReturn,
  type BasicAnimationReturn,
  type UseAnimationResult,
  type UseKeyboardReturn,
  type UsePerformanceReturn,
  type UseKineticSliderReturn,
  type UseErrorTrackingReturn,
  type UsePerformanceOptions,
  type UseAnimationConfig,
  type UseKineticSliderProps,
  type FormValidationOptions
} from './hooks';

// Interactable elements types
export * from './interactable';

// Keyboard types
export * from './keyboard';

// Performance types
export * from './performance';
export * from './performance-testing';
export * from './performance-shared';
export * from './performance-resources';

// PIXI types
export * from './pixi';

// Slider types
export * from './slider';

// Store types
export * from './store';

// Storybook types
export * from './storybook';

// Test types
export * from './test/mocks';

// Validation types
export * from './validation';

// Do not export test types or global augmentations
