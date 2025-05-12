/**
 * Mock validation utilities for testing
 * This file provides stub implementations for validation functions used in tests
 */

import { vi as _vi } from "vitest";

// Types
export enum ValidationErrorType {
  TYPE = "type",
  REQUIRED = "required",
  FORMAT = "format",
  BUSINESS = "business",
  CUSTOM = "custom",
}

export enum ValidationErrorCode {
  REQUIRED_FIELD = "required_field",
  INVALID_TYPE = "invalid_type",
  INVALID_FORMAT = "invalid_format",
  BUSINESS_RULE = "business_rule",
  CUSTOM_ERROR = "custom_error",
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  metadata?: Record<string, unknown>;
}

export enum ValidationErrorSeverity {
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
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
 * Validates an array of slides.
 *
 * @param slides - The slides to validate
 *
 * @param _context - Optional context with path
 *
 * @param _context.path - Optional path for validation context
 *
 * @returns ValidationResult indicating if slides are valid
 *
 */
export function _validateSlides(
  slides: unknown,
  _context?: { path?: string[] },
): ValidationResult {
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
 * Validates a single slide.
 *
 * @param _slide - The slide to validate
 *
 * @param _context - Optional validation context
 *
 * @returns ValidationResult indicating if the slide is valid
 *
 */
export function _validateSlide(
  _slide: unknown,
  _context?: ValidationContext,
): ValidationResult {
  return {
    valid: true,
    errors: [],
  };
}

/**
 * Validates slide attributes.
 *
 * @param _attributes - The attributes to validate
 *
 * @param _requiredOnly - Whether to validate only required attributes
 *
 * @returns ValidationResult indicating if attributes are valid
 *
 */
export function _validateSlideAttributes(
  _attributes: unknown,
  _requiredOnly?: boolean,
): ValidationResult {
  return {
    valid: true,
    errors: [],
  };
}

/**
 * Validates a slide with business rules.
 *
 * @param _slide - The slide to validate
 *
 * @param _context - Optional validation context
 *
 * @returns ValidationResult indicating if the slide passes business rules
 *
 */
export function _validateSlideWithBusinessRules(
  _slide: unknown,
  _context?: ValidationContext,
): ValidationResult {
  return {
    valid: true,
    errors: [],
  };
}

/**
 * Validates slides with business rules.
 *
 * @param slides - The slides to validate
 *
 * @param _context - Optional validation context
 *
 * @returns ValidationResult indicating if slides pass business rules
 *
 */
export function _validateSlidesWithBusinessRules(
  slides: unknown,
  _context?: ValidationContext,
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
 * Validates a slide with a schema.
 *
 * @param _slide - The slide to validate
 *
 * @param _context - Optional validation context
 *
 * @returns ValidationResult indicating if the slide matches the schema
 *
 */
export function _validateSlideWithSchema(
  _slide: unknown,
  _context?: ValidationContext,
): ValidationResult {
  return {
    valid: true,
    errors: [],
  };
}

/**
 * Validates slides with a schema.
 *
 * @param slides - The slides to validate
 *
 * @param _context - Optional validation context
 *
 * @returns ValidationResult indicating if slides match the schema
 *
 */
export function _validateSlidesWithSchema(
  slides: unknown,
  _context?: ValidationContext,
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
 * Validates animation config.
 *
 * @param _config - The animation config to validate
 *
 * @returns ValidationResult indicating if the config is valid
 *
 */
export function _validateAnimationConfig(_config: unknown): ValidationResult {
  return {
    valid: true,
    errors: [],
  };
}

// Helper functions
/**
 * Creates a validation error object.
 *
 * @param type - The error type
 *
 * @param message - The error message
 *
 * @param property - The property associated with the error
 *
 * @param _value - The value that caused the error
 *
 * @param expected - The expected value
 *
 * @param severity - The severity of the error
 *
 * @param suggestion - Suggestion for fixing the error
 *
 * @param locale - The locale for the error message
 *
 * @returns ValidationError object
 *
 */
export function _createValidationError(
  type: ValidationErrorType,
  message: string,
  property?: string,
  _value?: unknown,
  expected?: unknown,
  severity: ValidationErrorSeverity = ValidationErrorSeverity.ERROR,
  suggestion?: string,
  locale?: string,
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
 * Checks if a slide is valid.
 *
 * @param _slide - The slide to check
 *
 * @returns True if the slide is valid
 *
 */
export function _isValidSlide(_slide: unknown): boolean {
  return true;
}

/**
 * Composes multiple validators into a single async validator.
 *
 * @param {...Function} _validators - The validators to compose
 *
 * @returns A function that returns a Promise resolving to a ValidationResult
 *
 */
export function _composeValidators(
  ..._validators: Function[]
): (_value: unknown) => Promise<ValidationResult> {
  return async (_value: unknown) => ({
    valid: true,
    errors: [],
  });
}
