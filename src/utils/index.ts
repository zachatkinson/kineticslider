/**
 * Main utilities export file
 */

// Form utilities
export * from './form-validation';
export * from './form-helpers';

// Analytics and errors
export * from './analytics';
export * from './errors';

// Accessibility utilities
export * from './a11y';

// Validation utilities
export {
  registerValidator,
  getValidator,
  composeValidators,
  composeAsyncValidators,
  memoizeValidator,
  clearValidationCache,
  createValidationError,
  isObject,
  safeGet,
  createSchemaValidator,
  validateImageExists,
  validateSlideImageUrl,
  validateSlideWithUrl,
  validateSlides,
  validateAnimationConfig,
  validateProps,
  validateErrorInfo,
  validateAccessibility,
  validatePerformanceConfig,
  isEmpty,
  createValidator,
  isValidSlide,
  isValidProps,
  isValidErrorInfo,
} from './validation';

// Slide validation
export * from './slide-validator';

// Browser support
export * from './browserSupport';

// Type utilities
export * from './type-guards';
export * from './id-helpers';
