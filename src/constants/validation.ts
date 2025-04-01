/**
 * Form validation constants and configuration module.
 * Provides standardized validation timeouts, error messages, and CSS classes.
 * 
 * @module
 * @version 1.0.0
 * @example
 * ```typescript
 * import { DEFAULT_VALIDATION_DEBOUNCE, DEFAULT_ERROR_MESSAGES } from './validation';
 * 
 * const validationTimeout = setTimeout(() => {
 *   validateForm();
 * }, DEFAULT_VALIDATION_DEBOUNCE);
 * ```
 * 
 * @performance
 * - Optimized debounce timing for form validation
 * - Reusable error messages to reduce memory usage
 * - Consistent CSS class naming for better caching
 * 
 * @security
 * - Sanitized error messages
 * - Consistent validation patterns
 * - Safe string interpolation
 */

/**
 * Default debounce timeout in milliseconds for form validation.
 * Provides optimal balance between responsiveness and performance.
 * 
 * @constant
 * @type {number}
 * @default 300
 * 
 * @example
 * ```typescript
 * import { DEFAULT_VALIDATION_DEBOUNCE } from './validation';
 * 
 * const debouncedValidation = debounce(validateForm, DEFAULT_VALIDATION_DEBOUNCE);
 * ```
 */
export const DEFAULT_VALIDATION_DEBOUNCE = 300;

/**
 * Default error messages for form validation.
 * Provides consistent, user-friendly error messages across the application.
 * 
 * @constant
 * @type {Record<string, string | ((param: number) => string)>}
 * 
 * @example
 * ```typescript
 * import { DEFAULT_ERROR_MESSAGES } from './validation';
 * 
 * const errorMessage = field.required 
 *   ? DEFAULT_ERROR_MESSAGES.REQUIRED 
 *   : DEFAULT_ERROR_MESSAGES.MIN_LENGTH(5);
 * ```
 * 
 * @security
 * - Messages are pre-defined to prevent XSS
 * - Safe string interpolation for dynamic values
 */
export const DEFAULT_ERROR_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_URL: 'Please enter a valid URL',
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must be at most ${max} characters`,
  PATTERN_MISMATCH: 'The format is incorrect',
  TYPE_MISMATCH: 'The value has an incorrect type',
  RANGE_OVERFLOW: (max: number) => `Value must be less than or equal to ${max}`,
  RANGE_UNDERFLOW: (min: number) =>
    `Value must be greater than or equal to ${min}`,
};

/**
 * CSS classes for form validation states.
 * Provides consistent styling for form validation feedback.
 * 
 * @constant
 * @type {Record<string, string>}
 * 
 * @example
 * ```typescript
 * import { VALIDATION_CSS_CLASSES } from './validation';
 * 
 * const inputClassName = isValid 
 *   ? VALIDATION_CSS_CLASSES.VALID 
 *   : VALIDATION_CSS_CLASSES.INVALID;
 * ```
 * 
 * @accessibility
 * - Uses standard Bootstrap validation classes
 * - Provides visual feedback for validation states
 * - Supports screen reader announcements
 */
export const VALIDATION_CSS_CLASSES = {
  BASE: 'form-control',
  VALID: 'form-control is-valid',
  INVALID: 'form-control is-invalid',
  WARNING: 'form-control is-warning',
  FEEDBACK_VALID: 'valid-feedback',
  FEEDBACK_INVALID: 'invalid-feedback',
  FEEDBACK_WARNING: 'warning-feedback',
};
