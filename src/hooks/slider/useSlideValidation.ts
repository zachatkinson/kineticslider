import { useState } from 'react';
import type { ValidationError, ValidationResult } from '../../types/validation';
import { getFieldClass, getErrorForField } from '../../utils/validation';

/**
 * Custom hook for slide validation
 */
export function useSlideValidation(
  data: unknown,
  options: {
    validateOnMount?: boolean;
    debounceMs?: number;
  } = {}
) {
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    valid: true,
    errors: []
  });
  const [validating, setValidating] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  return {
    validationResult,
    validating,
    submitted,
    setSubmitted,
    getErrorForField: (fieldName: string) => getErrorForField(validationResult.errors, fieldName),
    getFieldClass: (fieldName: string) => getFieldClass(validationResult.errors, fieldName),
    setValidating,
    setValidationResult
  };
} 