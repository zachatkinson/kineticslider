/**
 * Validation check utilities
 * 
 * Utility functions for checking validation states and results
 */

import type { ValidationResult } from '../types/validation';
import { ValidationErrorSeverity } from '../types/validation';

/**
 * Check if field has a critical validation error
 *
 * @param error - Validation error for the field
 * @returns True if field has a critical error
 */
export function hasFieldCriticalError(
  error?: ValidationResult['errors'][0]
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
 * @returns True if form has any critical errors
 */
export function hasFormCriticalErrors(
  errors: ValidationResult['errors']
): boolean {
  return errors.some(
    (error) =>
      error.severity === ValidationErrorSeverity.ERROR ||
      error.severity === ValidationErrorSeverity.CRITICAL
  );
}

/**
 * Check if validation result has any errors
 */
export function hasErrors(result: ValidationResult): boolean {
  return !result.valid || result.errors.length > 0;
}

/**
 * Check if validation result has any errors of a specific severity
 */
export function hasErrorsOfSeverity(
  result: ValidationResult,
  severity: ValidationErrorSeverity
): boolean {
  return result.errors.some((error) => error.severity === severity);
}

/**
 * Get all errors of a specific severity from a validation result
 */
export function getErrorsOfSeverity(
  result: ValidationResult,
  severity: ValidationErrorSeverity
): ValidationResult['errors'] {
  return result.errors.filter((error) => error.severity === severity);
}

/**
 * Get the most severe error from a validation result
 */
export function getMostSevereError(
  result: ValidationResult
): ValidationResult['errors'][0] | undefined {
  if (!result.errors.length) return undefined;

  return result.errors.reduce((mostSevere, current) => {
    if (!mostSevere) return current;
    if (!current.severity) return mostSevere;
    if (!mostSevere.severity) return current;
    return current.severity > mostSevere.severity ? current : mostSevere;
  });
}

/**
 * Check if validation result has any errors with specific properties
 */
export function hasErrorsWithProperties(
  result: ValidationResult,
  properties: string[]
): boolean {
  return result.errors.some((error) =>
    properties.some((prop) => error.property === prop)
  );
}

/**
 * Get all errors for specific properties from a validation result
 */
export function getErrorsForProperties(
  result: ValidationResult,
  properties: string[]
): ValidationResult['errors'] {
  return result.errors.filter((error) =>
    properties.some((prop) => error.property === prop)
  );
} 