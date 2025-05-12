/**
 * Mock implementations for form validation utilities
 */

import {
  ValidationError,
  ValidationResult,
  ValidationErrorType,
  ValidationErrorCode,
  ValidationErrorSeverity,
} from "./validation.mock";
import { vi } from "vitest";

// Define mocked form validation functions
export const validateAndSubmit = vi.fn();
export const getFeedbackClass = vi.fn();
export const getFieldClass = vi.fn();

// Mock for the useSlideValidation hook
export const useSlideValidation = vi.fn().mockReturnValue({
  validationResult: { valid: true, errors: [] },
  validating: false,
  submitted: false,
  setValidationResult: vi.fn(),
  setValidating: vi.fn(),
  setSubmitted: vi.fn(),
  getErrorForField: vi.fn().mockReturnValue(null),
  getFieldClass: vi.fn().mockReturnValue("form-control"),
  hasFieldCriticalError: vi.fn().mockReturnValue(false),
  hasCriticalErrors: vi.fn().mockReturnValue(false),
});

// Helper function to create validation errors for testing
/**
 * Creates a mock validation error for testing purposes.
 *
 * @param type - The type of validation error
 *
 * @param code - The error code
 *
 * @param message - The error message
 *
 * @param field - The field that caused the error
 *
 * @param severity - The severity of the error
 *
 * @returns {ValidationError} A mock validation error object
 *
 */
export function _createMockValidationError(
  type: ValidationErrorType,
  code: ValidationErrorCode,
  message: string,
  field: string,
  severity: ValidationErrorSeverity = ValidationErrorSeverity.ERROR,
): ValidationError {
  return {
    type,
    code,
    message,
    property: field,
    severity,
  };
}

// Reset all mocks
/**
 * Resets all form validation mocks to their initial state.
 *
 * @returns {Object} An object indicating the success of the reset operation
 *
 */
export function resetMocks(): unknown {
  validateAndSubmit.mockReset();
  getFeedbackClass.mockReset();
  getFieldClass.mockReset();
  useSlideValidation.mockReset();

  // Setup default implementations
  validateAndSubmit.mockImplementation(
    async (
      _data: unknown,
      _validationFn: (
        data: unknown,
      ) => ValidationResult | Promise<ValidationResult>,
      onSuccess?: (data: unknown) => void,
    ) => {
      if (onSuccess) onSuccess(_data);
      return { valid: true, errors: [] };
    },
  );

  getFeedbackClass.mockImplementation(() => "is-valid");
  getFieldClass.mockImplementation(() => "is-valid");

  useSlideValidation.mockReturnValue({
    validationResult: { valid: true, errors: [] },
    validating: false,
    submitted: false,
    setValidationResult: vi.fn(),
    setValidating: vi.fn(),
    setSubmitted: vi.fn(),
    getErrorForField: () => null,
    getFieldClass: () => "form-control",
    hasFieldCriticalError: () => false,
    hasCriticalErrors: () => false,
  });

  return { success: true };
}

// Execute reset on import
resetMocks();

/**
 * Mock function for form validation.
 *
 * @returns {boolean} Whether the form is valid.
 *
 */
export const validateForm = (): boolean => {
  // Implementation of validateForm function
  return true;
};

/**
 * Mock function for form submission.
 *
 * @returns {Promise<void>}
 *
 */
export const submitForm = async (): Promise<void> => {
  // Implementation of submitForm function
};
