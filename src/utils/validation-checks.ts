/**
 * Validation check utilities
 *
 * Utility functions for checking validation states and results
 */

import type { ValidationResult, ValidationError } from "../types/validation";
import { ValidationErrorSeverity } from "../types/validation";

/**
 * Check if field has a critical validation error
 *
 * @param error - Validation error for the field
 *
 * @returns True if field has a critical error
 *
 */
export function _hasFieldCriticalError(
  error?: ValidationResult["errors"][0],
): boolean {
  if (!error) return false;

  return (
    error.severity === ValidationErrorSeverity.ERROR ||
    error.severity === ValidationErrorSeverity.CRITICAL
  );
}

/**
 * Check if form has any critical errors
 *
 * @param errors - Validation errors array
 *
 * @returns True if form has any critical errors
 *
 */
export function _hasFormCriticalErrors(
  errors: ValidationResult["errors"],
): boolean {
  return errors.some(
    (error: ValidationError) =>
      error.severity === ValidationErrorSeverity.ERROR ||
      error.severity === ValidationErrorSeverity.CRITICAL,
  );
}

/**
 * Check if validation result has any errors
 *
 * @param result
 *
 * @returns {ReturnType} The return value
 *
 */
export function _hasErrors(result: ValidationResult): boolean {
  return !result.valid || result.errors.length > 0;
}

/**
 * Check if validation result has any errors of a specific severity
 *
 * @param result
 *
 * @param severity
 *
 * @returns {ReturnType} The return value
 *
 */
export function _hasErrorsOfSeverity(
  result: ValidationResult,
  severity: ValidationErrorSeverity,
): boolean {
  return result.errors.some(
    (error: ValidationError) => error.severity === severity,
  );
}

/**
 * Get all errors of a specific severity from a validation result
 *
 * @param result
 *
 * @param severity
 *
 * @returns {ReturnType} The return value
 *
 */
export function _getErrorsOfSeverity(
  result: ValidationResult,
  severity: ValidationErrorSeverity,
): ValidationResult["errors"] {
  return result.errors.filter(
    (error: ValidationError) => error.severity === severity,
  );
}

/**
 * Get the most severe error from a validation result
 *
 * @param result
 *
 * @returns {ReturnType} The return value
 *
 */
export function _getMostSevereError(
  result: ValidationResult,
): ValidationResult["errors"][0] | undefined {
  if (!result.errors.length) return undefined;

  return result.errors.reduce(
    (mostSevere: ValidationError | undefined, current: ValidationError) => {
      if (!mostSevere) return current;
      if (!current.severity) return mostSevere;
      if (!mostSevere.severity) return current;
      return current.severity > mostSevere.severity ? current : mostSevere;
    },
  );
}

/**
 * Check if validation result has any errors with specific properties
 *
 * @param result
 *
 * @param properties
 *
 * @returns {ReturnType} The return value
 *
 */
export function _hasErrorsWithProperties(
  result: ValidationResult,
  properties: string[],
): boolean {
  return result.errors.some((error: ValidationError) =>
    properties.some((prop: string) => error.property === prop),
  );
}

/**
 * Get all errors for specific properties from a validation result
 *
 * @param result
 *
 * @param properties
 *
 * @returns {ReturnType} The return value
 *
 */
export function _getErrorsForProperties(
  result: ValidationResult,
  properties: string[],
): ValidationResult["errors"] {
  return result.errors.filter((error: ValidationError) =>
    properties.some((prop: string) => error.property === prop),
  );
}
