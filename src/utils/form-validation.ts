import { useState } from 'react';
import { ValidationError, ValidationResult } from '../types/validation';
import { validateAndSubmit, getFeedbackClass, getFieldClass } from './form-helpers';

/**
 * Custom hook for slide form validation
 * @returns The form validation object
 */
export function useSlideValidation(): {
  validationResult: ValidationResult;
  validating: boolean;
  submitted: boolean;
  setValidationResult: React.Dispatch<React.SetStateAction<ValidationResult>>;
  setValidating: React.Dispatch<React.SetStateAction<boolean>>;
  setSubmitted: React.Dispatch<React.SetStateAction<boolean>>;
  getErrorForField: (fieldName: string) => ValidationError | undefined;
  getFieldClass: (fieldName: string) => string;
  hasFieldCriticalError: (fieldName: string) => boolean;
  hasCriticalErrors: () => boolean;
} {
  const [validationResult, setValidationResult] = useState<ValidationResult>({ errors: [], valid: true });
  const [validating, setValidating] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const getErrorForField = (errors: ValidationError[], fieldName: string): ValidationError | undefined => {
    return errors.find(error => error.field === fieldName);
  };

  const hasCriticalErrors = (errors: ValidationError[]): boolean => {
    return errors.some(error => error.severity === 'error');
  };

  return {
    validationResult,
    validating,
    submitted,
    setValidationResult,
    setValidating,
    setSubmitted,
    getErrorForField: (fieldName: string) => getErrorForField(validationResult.errors, fieldName),
    getFieldClass: (fieldName: string) => getFieldClass(validationResult.errors, fieldName),
    hasFieldCriticalError: (fieldName: string) => {
      const error = getErrorForField(validationResult.errors, fieldName);
      return error?.severity === 'error';
    },
    hasCriticalErrors: () => hasCriticalErrors(validationResult.errors)
  };
}

// Re-export these functions for use in components
export { validateAndSubmit, getFeedbackClass, getFieldClass }; 