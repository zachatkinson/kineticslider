/**
 * Main types export file
 */

// Export all types from separate files
export * from './slider';
export * from './gsap';
export * from './branded';
export * from './browser';
export * from './performance';
export * from './accessibility';
export * from './hooks';
export * from './components';
export * from './keyboard';
export * from './gestures';
export * from './form-validation';

// Re-export with more specific control to avoid naming conflicts
export type {
  AnalyticsEvent,
  AnalyticsConfig,
  SliderAnalyticsEvent,
  SliderAnalyticsConfig,
  AnalyticsEventType,
  AnalyticsConfigType,
} from './analytics';
export { SliderEventType } from './analytics';

export type {
  AnimationConfig,
  AnimationOptions,
  BasicAnimationReturn,
} from './animation';

// Re-export global augmentations
export * from './global.d';
