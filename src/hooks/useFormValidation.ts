import { useEffect, useState } from 'react';
import { DEFAULT_VALIDATION_DEBOUNCE } from '../constants/validation';
import {
  FormValidationOptions,
  FormValidationState,
} from '../types/form-validation';
import {
  getFieldClass as getFieldClassName,
  getFieldError,
  hasFormCriticalErrors,
} from '../utils/form-helpers';
import type { ValidationError, ValidationResult } from '../types/validation';
import {
  validateFormData,
  createDebouncedValidator
} from '../utils/validation-helpers';

/**
 * Hook for handling form validation with debounce
 *
 * @param formData - The form data to validate
 * @param validationFn - Optional custom validation function
 * @param options - Validation options
 * @returns Object containing validation state, result and helper functions
 */
export function useFormValidation<T>(
  formData: T,
  validationFn?: (data: T) => Promise<ValidationResult>,
  options?: FormValidationOptions
): FormValidationState<T> {
  const debounceMs = options?.debounceMs ?? DEFAULT_VALIDATION_DEBOUNCE;
  const validateOnChange = options?.validateOnChange ?? true;

  const [validationResult, setValidationResult] = useState<ValidationResult>({
    valid: true,
    errors: [],
  });
  const [validating, setValidating] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Initial validation if validateOnMount is true
  useEffect(() => {
    if (options?.validateOnMount && validationFn) {
      void validateFormData(
        formData,
        validationFn,
        setValidating,
        setValidationResult
      );
    }
  }, [options?.validateOnMount, validationFn, formData]);

  // Real-time validation as user types
  useEffect(() => {
    if (!validateOnChange || !validationFn) return;

    const debouncedValidate = createDebouncedValidator(
      (data: T) => validateFormData(data, validationFn, setValidating, setValidationResult),
      debounceMs
    );

    debouncedValidate(formData);
  }, [formData, validationFn, debounceMs, validateOnChange]);

  // Helper to get error message for a field
  const getErrorForField = (fieldName: string): ValidationError | undefined => {
    return getFieldError(validationResult.errors, fieldName);
  };

  // Helper to get CSS class based on validation state
  const getFieldClass = (fieldName: string): string => {
    const error = getErrorForField(fieldName);
    return getFieldClassName(error, fieldName);
  };

  // Helper to check if form has critical errors
  const hasCriticalErrors = (): boolean => {
    return hasFormCriticalErrors(validationResult.errors);
  };

  return {
    validationResult,
    validating,
    submitted,
    setSubmitted,
    getErrorForField,
    getFieldClass,
    hasCriticalErrors,
    setValidating,
    setValidationResult,
  };
} 