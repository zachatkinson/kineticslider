/**
 * Mock validation utilities for testing
 * This file provides stub implementations for validation functions used in tests
 * @returns {ReturnType} The return _value
 */

import { vi } from 'vitest';

// Types
export enum ValidationErrorType {
  TYPE = 'type',
  REQUIRED = 'required',
  FORMAT = 'format',
  BUSINESS = 'business',
  CUSTOM = 'custom',
}

export enum ValidationErrorCode {
  REQUIRED_FIELD = 'required_field',
  INVALID_TYPE = 'invalid_type',
  INVALID_FORMAT = 'invalid_format',
  BUSINESS_RULE = 'business_rule',
  CUSTOM_ERROR = 'custom_error',
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  metadata?: Record<string, unknown>;
}

export enum ValidationErrorSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

export interface ValidationError {
  type: ValidationErrorType;
  code: ValidationErrorCode;
  message: string;
  property?: string;
  _value?: unknown;
  expected?: unknown;
  path?: string[];
  severity?: ValidationErrorSeverity;
  suggestion?: string;
  locale?: string;
}

export interface ValidationContext {
  path?: string[];
  locale?: string;
}

// Mock implementation of validation functions
/**
 *
 * @param slides
 * @param _context
 * @param _context.path
 * @returns {ValidationResult} The validation result for the slides
 */
export function _validateSlides(slides: unknown, _context?: { path?: string[] }): ValidationResult {
  return {
    valid: true,
    errors: [],
    metadata: {
      totalSlides: Array.isArray(slides) ? slides.length : 0,
      validated: true,
    },
  };
}

/**
 *
 * @param _slide
 * @param _context
 * @returns {ValidationResult} The validation result for the slide
 */
export function _validateSlide(_slide: unknown, _context?: ValidationContext): ValidationResult {
  return {
    valid: true,
    errors: [],
  };
}

/**
 *
 * @param _attributes
 * @param _requiredOnly
 * @returns {ValidationResult} The validation result for the slide attributes
 */
export function _validateSlideAttributes(
  _attributes: unknown,
  _requiredOnly?: boolean
): ValidationResult {
  return {
    valid: true,
    errors: [],
  };
}

/**
 *
 * @param _slide
 * @param _context
 * @returns {ValidationResult} The validation result for the slide with business rules applied
 */
export function _validateSlideWithBusinessRules(
  _slide: unknown,
  _context?: ValidationContext
): ValidationResult {
  return {
    valid: true,
    errors: [],
  };
}

/**
 *
 * @param slides
 * @param _context
 * @returns {ValidationResult} The validation result for slides with business rules applied
 */
export function _validateSlidesWithBusinessRules(
  slides: unknown,
  _context?: ValidationContext
): ValidationResult {
  return {
    valid: true,
    errors: [],
    metadata: {
      totalValid: Array.isArray(slides) ? slides.length : 0,
      totalSlides: Array.isArray(slides) ? slides.length : 0,
    },
  };
}

/**
 *
 * @param _slide
 * @param _context
 * @returns {ValidationResult} The validation result for the slide with schema validation
 */
export function _validateSlideWithSchema(
  _slide: unknown,
  _context?: ValidationContext
): ValidationResult {
  return {
    valid: true,
    errors: [],
  };
}

/**
 *
 * @param slides
 * @param _context
 * @returns {ValidationResult} The validation result for slides with schema validation
 */
export function _validateSlidesWithSchema(
  slides: unknown,
  _context?: ValidationContext
): ValidationResult {
  return {
    valid: true,
    errors: [],
    metadata: {
      totalValid: Array.isArray(slides) ? slides.length : 0,
      totalSlides: Array.isArray(slides) ? slides.length : 0,
    },
  };
}

/**
 *
 * @param _config
 * @returns {ValidationResult} The validation result for the animation config
 */
export function _validateAnimationConfig(_config: unknown): ValidationResult {
  return {
    valid: true,
    errors: [],
  };
}

// Helper functions
/**
 *
 * @param type
 * @param message
 * @param property
 * @param _value
 * @param expected
 * @param severity
 * @param suggestion
 * @param locale
 * @returns {ValidationError} The created validation error object
 */
export function _createValidationError(
  type: ValidationErrorType,
  message: string,
  property?: string,
  _value?: unknown,
  expected?: unknown,
  severity: ValidationErrorSeverity = ValidationErrorSeverity.ERROR,
  suggestion?: string,
  locale?: string
): ValidationError {
  return {
    type,
    code: ValidationErrorCode.CUSTOM_ERROR,
    message,
    property,
    _value,
    expected,
    severity,
    suggestion,
    locale,
  };
}

/**
 *
 * @param _slide
 * @returns {boolean} Whether the slide is valid
 */
export function _isValidSlide(_slide: unknown): boolean {
  return true;
}

/**
 *
 * @param {...any} _validators
 * @returns {Function} A composed validator function that returns a Promise<ValidationResult>
 */
export function _composeValidators(..._validators: Function[]): (_value: unknown) => Promise<ValidationResult> {
  return async (_value: unknown) => {
    return { valid: true, errors: [] };
  };
}

// Additional mock utility functions
export const _clearValidationCache = vi.fn();
export const _composeAsyncValidators = vi.fn().mockImplementation((..._validators: Function[]) => {
  return async (_value: unknown) => ({ valid: true, errors: [] });
});
export const _createSchemaValidator = vi.fn().mockImplementation(() => {
  return () => ({ valid: true, errors: [] });
});
export const _createValidator = vi.fn().mockImplementation((fn: Function) => fn);
export const _getValidator = vi.fn().mockImplementation(() => {
  return () => ({ valid: true, errors: [] });
});
export const _isEmpty = vi.fn().mockImplementation((_value: unknown) => {
  return _value === null || _value === undefined || _value === '';
});
export const _isObject = vi.fn().mockImplementation((_value: unknown) => {
  return typeof _value === 'object' && _value !== null && !Array.isArray(_value);
});
export const _isValidErrorInfo = vi.fn().mockReturnValue(true);
export const _isValidProps = vi.fn().mockReturnValue(true);
export const _memoizeValidator = vi.fn().mockImplementation((fn: Function) => fn); 