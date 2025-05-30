/**
 * Validation helper functions
 *
 * Utilities for validating data structures and constraints
 */

import type {
  ValidationResult,
  ValidationError,
  ValidationErrorType,
  ValidationErrorCode,
  ValidationErrorSeverity,
  ValidationContext,
} from "../types/validation";
import { isEmpty, safeGet } from "./object-helpers";

/**
 * Validates string constraints
 *
 * @param value - The string value to validate
 *
 * @param constraints - The constraints to apply
 *
 * @param constraints.minLength - Minimum length constraint
 *
 * @param constraints.maxLength - Maximum length constraint
 *
 * @param constraints.pattern - Pattern regex constraint
 *
 * @param constraints.required - Whether the field is required
 *
 * @param context - The validation context
 *
 * @returns Validation result
 *
 */
export function validateStringConstraints(
  value: string,
  constraints: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    required?: boolean;
  },
  context: ValidationContext & { field: string },
): ValidationResult {
  const errors: ValidationError[] = [];

  if (constraints.required && isEmpty(value)) {
    errors.push({
      type: "REQUIRED_FIELD_MISSING" as ValidationErrorType,
      code: "FIELD_REQUIRED" as ValidationErrorCode,
      message: `${context.field} is required`,
      severity: "error" as ValidationErrorSeverity,
      field: context.field,
      context,
    });
  }

  if (value && constraints.minLength && value.length < constraints.minLength) {
    errors.push({
      type: "VALIDATION_ERROR" as ValidationErrorType,
      code: "MIN_LENGTH" as ValidationErrorCode,
      message: `${context.field} must be at least ${constraints.minLength} characters`,
      severity: "error" as ValidationErrorSeverity,
      field: context.field,
      context,
    });
  }

  if (value && constraints.maxLength && value.length > constraints.maxLength) {
    errors.push({
      type: "VALIDATION_ERROR" as ValidationErrorType,
      code: "MAX_LENGTH" as ValidationErrorCode,
      message: `${context.field} must be no more than ${constraints.maxLength} characters`,
      severity: "error" as ValidationErrorSeverity,
      field: context.field,
      context,
    });
  }

  if (value && constraints.pattern && !constraints.pattern.test(value)) {
    errors.push({
      type: "VALIDATION_ERROR" as ValidationErrorType,
      code: "PATTERN_MISMATCH" as ValidationErrorCode,
      message: `${context.field} format is invalid`,
      severity: "error" as ValidationErrorSeverity,
      field: context.field,
      context,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates number constraints
 *
 * @param value - The number value to validate
 *
 * @param constraints - The constraints to apply
 *
 * @param constraints.min - Minimum value constraint
 *
 * @param constraints.max - Maximum value constraint
 *
 * @param constraints.integer - Whether value must be an integer
 *
 * @param constraints.required - Whether the field is required
 *
 * @param context - The validation context
 *
 * @returns Validation result
 *
 */
export function validateNumberConstraints(
  value: number,
  constraints: {
    min?: number;
    max?: number;
    integer?: boolean;
    required?: boolean;
  },
  context: ValidationContext & { field: string },
): ValidationResult {
  const errors: ValidationError[] = [];

  if (constraints.required && (value === null || value === undefined)) {
    errors.push({
      type: "REQUIRED_FIELD_MISSING" as ValidationErrorType,
      code: "FIELD_REQUIRED" as ValidationErrorCode,
      message: `${context.field} is required`,
      severity: "error" as ValidationErrorSeverity,
      field: context.field,
      context,
    });
  }

  if (value !== null && value !== undefined) {
    if (constraints.min !== undefined && value < constraints.min) {
      errors.push({
        type: "VALIDATION_ERROR" as ValidationErrorType,
        code: "MIN_VALUE" as ValidationErrorCode,
        message: `${context.field} must be at least ${constraints.min}`,
        severity: "error" as ValidationErrorSeverity,
        field: context.field,
        context,
      });
    }

    if (constraints.max !== undefined && value > constraints.max) {
      errors.push({
        type: "VALIDATION_ERROR" as ValidationErrorType,
        code: "MAX_VALUE" as ValidationErrorCode,
        message: `${context.field} must be no more than ${constraints.max}`,
        severity: "error" as ValidationErrorSeverity,
        field: context.field,
        context,
      });
    }

    if (constraints.integer && !Number.isInteger(value)) {
      errors.push({
        type: "VALIDATION_ERROR" as ValidationErrorType,
        code: "INVALID_TYPE" as ValidationErrorCode,
        message: `${context.field} must be an integer`,
        severity: "error" as ValidationErrorSeverity,
        field: context.field,
        context,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates required fields in an object
 *
 * @param obj - The object to validate
 *
 * @param requiredFields - Array of required field names
 *
 * @param context - The validation context
 *
 * @returns Validation result
 *
 */
export function _validateRequiredFields(
  obj: Record<string, unknown>,
  requiredFields: string[],
  context: ValidationContext,
): ValidationResult {
  const errors: ValidationError[] = [];

  for (const field of requiredFields) {
    const value = safeGet(obj, field, undefined);
    if (isEmpty(value)) {
      errors.push({
        type: "REQUIRED_FIELD_MISSING" as ValidationErrorType,
        code: "FIELD_REQUIRED" as ValidationErrorCode,
        message: `${field} is required`,
        severity: "error" as ValidationErrorSeverity,
        field,
        context,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a value against a schema field definition
 *
 * @param value - The value to validate
 *
 * @param schema - The schema field definition
 *
 * @param schema.type - The expected type of the value
 *
 * @param schema.required - Whether the field is required
 *
 * @param schema.constraints - Additional constraints for the field
 *
 * @param context - The validation context
 *
 * @returns Validation result
 *
 */
export function validateAgainstSchemaField(
  value: unknown,
  schema: {
    type: string;
    required?: boolean;
    constraints?: Record<string, unknown>;
  },
  context: ValidationContext & { field: string },
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check required
  if (schema.required && isEmpty(value)) {
    errors.push({
      type: "REQUIRED_FIELD_MISSING" as ValidationErrorType,
      code: "FIELD_REQUIRED" as ValidationErrorCode,
      message: `${context.field} is required`,
      severity: "error" as ValidationErrorSeverity,
      field: context.field,
      context,
    });
    return { valid: false, errors };
  }

  // Skip type validation if value is empty and not required
  if (isEmpty(value)) {
    return { valid: true, errors: [] };
  }

  // Type validation
  switch (schema.type) {
    case "string":
      if (typeof value !== "string") {
        errors.push({
          type: "VALIDATION_ERROR" as ValidationErrorType,
          code: "INVALID_TYPE" as ValidationErrorCode,
          message: `${context.field} must be a string`,
          severity: "error" as ValidationErrorSeverity,
          field: context.field,
          context,
        });
      }
      break;
    case "number":
      if (typeof value !== "number" || isNaN(value)) {
        errors.push({
          type: "VALIDATION_ERROR" as ValidationErrorType,
          code: "INVALID_TYPE" as ValidationErrorCode,
          message: `${context.field} must be a number`,
          severity: "error" as ValidationErrorSeverity,
          field: context.field,
          context,
        });
      }
      break;
    case "boolean":
      if (typeof value !== "boolean") {
        errors.push({
          type: "VALIDATION_ERROR" as ValidationErrorType,
          code: "INVALID_TYPE" as ValidationErrorCode,
          message: `${context.field} must be a boolean`,
          severity: "error" as ValidationErrorSeverity,
          field: context.field,
          context,
        });
      }
      break;
    case "array":
      if (!Array.isArray(value)) {
        errors.push({
          type: "VALIDATION_ERROR" as ValidationErrorType,
          code: "INVALID_TYPE" as ValidationErrorCode,
          message: `${context.field} must be an array`,
          severity: "error" as ValidationErrorSeverity,
          field: context.field,
          context,
        });
      }
      break;
    default:
      // Unknown type
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
