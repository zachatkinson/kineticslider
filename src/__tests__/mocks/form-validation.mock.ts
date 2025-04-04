/**
 * Mock implementations for form validation utilities
 * @returns {ReturnType} The return value
 */
import { ValidationError, ValidationResult, ValidationErrorType, ValidationErrorCode, ValidationErrorSeverity } from '../../types/validation';
import { vi } from 'vitest';

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
  getFieldClass: vi.fn().mockReturnValue('form-control'),
  hasFieldCriticalError: vi.fn().mockReturnValue(false),
  hasCriticalErrors: vi.fn().mockReturnValue(false)
});

// Helper function to create validation errors for testing
/**
 *
 * @param type
 * @param code
 * @param message
 * @param field
 * @param severity
  * @returns {unknown} - The return value
 */
export function _createMockValidationError(
  type: ValidationErrorType,
  code: ValidationErrorCode,
  message: string,
  field: string,
  severity: ValidationErrorSeverity = ValidationErrorSeverity.ERROR
): ValidationError {
  return {
    type,
    code,
    message,
    field,
    severity
  };
}

// Reset all mocks
/**
 *
  * @returns {unknown} The function return value
 */
export function resetMocks(): unknown  {
  validateAndSubmit.mockReset();
  getFeedbackClass.mockReset();
  getFieldClass.mockReset();
  useSlideValidation.mockReset();
  
  // Setup default implementations
  validateAndSubmit.mockImplementation(async (_data: unknown, _validationFn: (data: unknown) => ValidationResult | Promise<ValidationResult>, onSuccess?: (data: unknown) => void) => {
    if (onSuccess) onSuccess(_data);
    return { valid: true, errors: [] };
  });
  
  getFeedbackClass.mockImplementation(() => 'is-valid');
  getFieldClass.mockImplementation(() => 'is-valid');
  
  useSlideValidation.mockReturnValue({
    validationResult: { valid: true, errors: [] },
    validating: false,
    submitted: false,
    setValidationResult: vi.fn(),
    setValidating: vi.fn(),
    setSubmitted: vi.fn(),
    getErrorForField: () => null,
    getFieldClass: () => 'form-control',
    hasFieldCriticalError: () => false,
    hasCriticalErrors: () => false
  });

  return { success: true };
}

// Execute reset on import
resetMocks(); 