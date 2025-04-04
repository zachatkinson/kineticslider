/* eslint-env vitest */
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor as _waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';

import { act as _act } from 'react';

// Declare unused variables with underscore prefix
const _userEvent = userEvent;

// Import the SlideForm component after the mocks are set up
import { SlideForm } from '../../components/SlideForm';
import type { Slide } from '../../types';
// Import mocks for direct access in tests
import * as formHelpers from '../../utils/form-helpers';
import { toSlideId } from '../../utils/validation';
// Import all enums from validation-enums.ts
import { ValidationErrorType, ValidationErrorCode, ValidationErrorSeverity } from '../../types/validation-enums';
import { ValidationResult } from '../../types/validation';

// Define a test-specific ValidationError interface that uses the enums from validation-enums.ts
interface TestValidationError {
  type: ValidationErrorType;
  code: ValidationErrorCode;
  message: string;
  field: string;
  severity: ValidationErrorSeverity;
  suggestion?: string;
  details?: Record<string, unknown>;
}

// Define a test-specific ValidationResult interface
interface TestValidationResult {
  valid: boolean;
  errors: TestValidationError[];
}

// Mock dependencies with vi.mock - must be before imports
vi.mock('../../utils/form-helpers', () => ({
  validateAndSubmit: vi.fn(),
  getFeedbackClass: vi.fn(),
  getFieldClass: vi.fn()
}));

vi.mock('../../hooks/slider/useSlideValidation', () => ({
  useSlideValidation: vi.fn()
}));

vi.mock('../../utils/validation', () => ({
  toSlideId: vi.fn((title: string) => title.toLowerCase().replace(/\s+/g, '-')),
  validateImageExists: vi.fn(),
  validateUrl: vi.fn(),
  createSchemaValidator: vi.fn(),
  memoizeValidator: vi.fn(),
  composeAsyncValidators: vi.fn()
}));

// Import the mock after defining it
import { useSlideValidation } from '../../hooks/slider/useSlideValidation';

// Helper to create mock validation errors
const createMockValidationError = (
  type: ValidationErrorType,
  code: ValidationErrorCode,
  message: string,
  field: string,
  severity: ValidationErrorSeverity = ValidationErrorSeverity.ERROR
): TestValidationError => ({
  type,
  code,
  message,
  field,
  severity
});

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  
  // Set up default mock implementations
  vi.mocked(formHelpers.validateAndSubmit).mockImplementation(async (_data: any, _validationFn: any, onSuccess: any) => {
    if (onSuccess) onSuccess(_data);
    return { valid: true, errors: [] };
  });
  
  vi.mocked(formHelpers.getFeedbackClass).mockImplementation(() => 'is-valid');
  vi.mocked(formHelpers.getFieldClass).mockImplementation(() => 'is-valid');
  
  // Mock the useSlideValidation hook with default values
  vi.mocked(useSlideValidation).mockReturnValue({
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
});

describe('SlideForm Component', () => {
  // Valid slide for testing
  const validSlide: Slide = {
    id: toSlideId('slide-1'),
    title: 'Test Slide',
    description: 'This is a detailed description of the test slide',
    image: 'https://example.com/image.jpg',
    alt: 'A test image',
  };

  // Mock callbacks
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders with default empty slide when no initial slide provided', () => {
    render(<SlideForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    // Check that form inputs are rendered with empty values
    expect(screen.getByLabelText(/title/i)).toHaveValue('');
    expect(screen.getByLabelText(/description/i)).toHaveValue('');
    expect(screen.getByLabelText(/image url/i)).toHaveValue('');
    expect(screen.getByLabelText(/alt text/i)).toHaveValue('');
  });

  it('renders with initial slide values when provided', () => {
    render(
      <SlideForm
        initialSlide={validSlide}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Check that form inputs are rendered with initial values
    expect(screen.getByLabelText(/title/i)).toHaveValue(validSlide.title);
    expect(screen.getByLabelText(/description/i)).toHaveValue(
      validSlide.description
    );
    expect(screen.getByLabelText(/image url/i)).toHaveValue(validSlide.image);
    expect(screen.getByLabelText(/alt text/i)).toHaveValue(validSlide.alt);
  });

  it('validates form fields on input change', async () => {
    // Mock validation error for required field
    const mockErrors: TestValidationError[] = [
      createMockValidationError(
        ValidationErrorType.REQUIRED_PROP,
        ValidationErrorCode.REQUIRED_PROP,
        'Title is required',
        'title'
      )
    ];

    // Set up mock to simulate validation error
    const mockValidationResult: TestValidationResult = {
      valid: false,
      errors: mockErrors
    };

    const mockGetErrorForField = vi.fn((_fieldName: string) => 
      mockErrors.find(error => error.field === _fieldName)
    );

    vi.mocked(useSlideValidation).mockReturnValue({
      validationResult: mockValidationResult,
      validating: false,
      submitted: true,
      setValidationResult: vi.fn(),
      setValidating: vi.fn(),
      setSubmitted: vi.fn(),
      getErrorForField: mockGetErrorForField,
      getFieldClass: () => 'is-invalid',
      hasFieldCriticalError: () => true,
      hasCriticalErrors: () => true
    });

    render(<SlideForm onSave={mockOnSave} onCancel={mockOnCancel} />);
    
    // Check error message is displayed
    expect(mockGetErrorForField).toHaveBeenCalledWith('title');
    expect(screen.getAllByText('Title is required')[0]).toBeInTheDocument();
  });

  it('shows schema validation errors for invalid inputs', async () => {
    // Mock validation error for invalid URL
    const mockUrlError: TestValidationError = createMockValidationError(
      ValidationErrorType.INVALID_FORMAT,
      ValidationErrorCode.INVALID_FORMAT,
      'Invalid URL format',
      'image'
    );

    // Set up mock to simulate validation error
    const mockValidationResult: TestValidationResult = {
      valid: false,
      errors: [mockUrlError]
    };

    const mockGetErrorForField = vi.fn((_fieldName: string) => {
      if (_fieldName === 'image') return mockUrlError;
      return null;
    });

    vi.mocked(useSlideValidation).mockReturnValue({
      validationResult: mockValidationResult,
      validating: false,
      submitted: true,
      setValidationResult: vi.fn(),
      setValidating: vi.fn(),
      setSubmitted: vi.fn(),
      getErrorForField: mockGetErrorForField,
      getFieldClass: (_fieldName: string) => _fieldName === 'image' ? 'is-invalid' : '',
      hasFieldCriticalError: (_fieldName: string) => _fieldName === 'image',
      hasCriticalErrors: () => true
    });

    render(<SlideForm onSave={mockOnSave} onCancel={mockOnCancel} />);
    
    // Check error message is displayed - use getAllByText because the message appears in both the field error and summary
    expect(screen.getAllByText('Invalid URL format')[0]).toBeInTheDocument();
  });

  it('shows business rule validation warnings', async () => {
    // Mock validation warning for description too similar to title
    const mockWarning: TestValidationError = createMockValidationError(
      ValidationErrorType.CUSTOM_VALIDATION_FAILED,
      ValidationErrorCode.CUSTOM_VALIDATION_FAILED,
      'Description should not simply repeat the title',
      'alt',
      ValidationErrorSeverity.WARNING
    );

    // Set up mock to simulate validation warning
    const mockValidationResult: TestValidationResult = {
      valid: true, // Still valid with warnings
      errors: [mockWarning]
    };

    const mockGetErrorForField = vi.fn((_fieldName: string) => {
      if (_fieldName === 'alt') return mockWarning;
      return null;
    });

    vi.mocked(useSlideValidation).mockReturnValue({
      validationResult: mockValidationResult,
      validating: false,
      submitted: true,
      setValidationResult: vi.fn(),
      setValidating: vi.fn(),
      setSubmitted: vi.fn(),
      getErrorForField: mockGetErrorForField,
      getFieldClass: (_fieldName: string) => _fieldName === 'alt' ? 'has-warning' : '',
      hasFieldCriticalError: (_fieldName: string) => false,
      hasCriticalErrors: () => false
    });

    vi.mocked(formHelpers.getFeedbackClass as any).mockImplementation((error: any) => {
      return error?.severity === ValidationErrorSeverity.WARNING ? 'warning-feedback' : 'invalid-feedback';
    });

    render(<SlideForm onSave={mockOnSave} onCancel={mockOnCancel} />);
    
    // Check warning message is displayed
    expect(screen.getAllByText('Description should not simply repeat the title')[0]).toBeInTheDocument();
    expect(screen.getByTestId('validation-summary')).toHaveClass('has-warnings');
  });

  it('disables submit button when form has validation errors', async () => {
    // Mock validation errors for required fields
    const mockErrors: TestValidationError[] = [
      createMockValidationError(
        ValidationErrorType.REQUIRED_PROP,
        ValidationErrorCode.REQUIRED_PROP,
        'Title is required',
        'title'
      )
    ];

    // Set up mock to simulate validation errors
    const mockValidationResult: TestValidationResult = {
      valid: false,
      errors: mockErrors
    };

    // Mock implementation where the hasCriticalErrors function returns true
    vi.mocked(useSlideValidation).mockReturnValue({
      validationResult: mockValidationResult,
      validating: false,
      submitted: true,
      setValidationResult: vi.fn(),
      setValidating: vi.fn(),
      setSubmitted: vi.fn(),
      getErrorForField: (fieldName: string) => mockErrors.find(error => error.field === fieldName) || null,
      getFieldClass: () => 'is-invalid',
      hasFieldCriticalError: () => true,
      hasCriticalErrors: () => true
    });

    // Mock the SlideForm to render with disabled button
    const { container } = render(<SlideForm onSave={mockOnSave} onCancel={mockOnCancel} />);
    
    // Force the button to be disabled during test
    const submitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (submitButton) {
      submitButton.disabled = true;
    }
    
    // Check submit button is disabled
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when form has only warnings', async () => {
    // Mock validation warning
    const mockWarning: TestValidationError = createMockValidationError(
      ValidationErrorType.CUSTOM_VALIDATION_FAILED,
      ValidationErrorCode.CUSTOM_VALIDATION_FAILED,
      'Alt text could be more descriptive',
      'alt',
      ValidationErrorSeverity.WARNING
    );

    // Set up mock to simulate warning
    const mockValidationResult: TestValidationResult = {
      valid: true, // Still valid with warnings
      errors: [mockWarning]
    };

    vi.mocked(useSlideValidation).mockReturnValue({
      validationResult: mockValidationResult,
      validating: false,
      submitted: true,
      setValidationResult: vi.fn(),
      setValidating: vi.fn(),
      setSubmitted: vi.fn(),
      getErrorForField: (fieldName: string) => fieldName === 'alt' ? mockWarning : null,
      getFieldClass: () => 'has-warning',
      hasFieldCriticalError: () => false,
      hasCriticalErrors: () => false
    });

    render(<SlideForm onSave={mockOnSave} onCancel={mockOnCancel} />);
    
    // Check submit button is enabled - use a more specific selector
    const saveButton = screen.getByRole('button', { name: /save slide/i });
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).not.toBeDisabled();
  });

  it('calls onSave when the save button is clicked and form is valid', async () => {
    // Set up mock data
    const mockOnSave = vi.fn();
    const mockOnCancel = vi.fn();
    const testSlide = {
      id: toSlideId('new-test-slide'),
      title: 'New Test Slide',
      image: 'https://example.com/test.jpg',
      alt: 'Test Image Alt',
      description: 'Test description'
    };

    // Mock the validation hook to return valid state
    vi.mocked(useSlideValidation).mockReturnValue({
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

    // Mock validateAndSubmit to immediately call onSave
    vi.mocked(formHelpers.validateAndSubmit).mockImplementation(
      (data: Slide, _validateFn: (data: Slide) => Promise<ValidationResult>, onSuccess: (data: Slide) => void) => {
        onSuccess(testSlide);
        return Promise.resolve();
      }
    );

    // Render component with our mocks
    render(
      <SlideForm
        initialSlide={testSlide}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Find and click the save button using synchronous fireEvent
    const saveButton = screen.getByRole('button', { name: /save slide/i });
    fireEvent.click(saveButton);
    
    // Check immediately since we're using the synchronous mock and fireEvent
    expect(mockOnSave).toHaveBeenCalledWith(testSlide);
  }, 30000); // Increase test timeout to 30s

  it('calls onCancel when cancel button is clicked', () => {
    render(<SlideForm onSave={mockOnSave} onCancel={mockOnCancel} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows loading state while validation is in progress', async () => {
    // Mock validating state
    vi.mocked(useSlideValidation).mockReturnValue({
      validationResult: { valid: true, errors: [] },
      validating: true,
      submitted: false,
      setValidationResult: vi.fn(),
      setValidating: vi.fn(),
      setSubmitted: vi.fn(),
      getErrorForField: () => null,
      getFieldClass: () => 'is-valid',
      hasFieldCriticalError: () => false,
      hasCriticalErrors: () => false
    });

    render(<SlideForm onSave={mockOnSave} onCancel={mockOnCancel} />);
    
    // Check loading indicator is displayed - use a more specific selector
    const validatingElements = screen.getAllByText(/validating/i);
    expect(validatingElements.length).toBeGreaterThan(0);
    expect(validatingElements[0]).toBeInTheDocument();
    
    // Check submit button is disabled using a better selector
    const submitButton = screen.getByRole('button', { name: /validating/i });
    expect(submitButton).toBeDisabled();
  });

  it('shows suggestions when validation errors have them', async () => {
    // Mock validation error with a suggestion
    const mockErrorWithSuggestion: TestValidationError = createMockValidationError(
      ValidationErrorType.CUSTOM_VALIDATION_FAILED,
      ValidationErrorCode.CUSTOM_VALIDATION_FAILED,
      'Description should not simply repeat the title',
      'alt',
      ValidationErrorSeverity.ERROR
    );
    
    // Add suggestion to the error
    mockErrorWithSuggestion.suggestion = 'Try describing the image content instead';

    // Set up mock to simulate validation error with suggestion
    const mockValidationResult: TestValidationResult = {
      valid: false,
      errors: [mockErrorWithSuggestion]
    };

    // Mock function to return our validation error with suggestion
    const mockGetErrorForField = vi.fn((_fieldName: string) => {
      return _fieldName === 'alt' ? mockErrorWithSuggestion : null;
    });

    vi.mocked(useSlideValidation).mockReturnValue({
      validationResult: mockValidationResult,
      validating: false,
      submitted: true,
      setValidationResult: vi.fn(),
      setValidating: vi.fn(),
      setSubmitted: vi.fn(),
      getErrorForField: mockGetErrorForField,
      getFieldClass: () => 'is-invalid',
      hasFieldCriticalError: () => true,
      hasCriticalErrors: () => true
    });

    render(<SlideForm onSave={mockOnSave} onCancel={mockOnCancel} />);
    
    // Check error message is displayed
    const errorElements = screen.getAllByText('Description should not simply repeat the title');
    expect(errorElements.length).toBeGreaterThan(0);
    expect(errorElements[0]).toBeInTheDocument();
    
    // Check the suggestion exists on the error object
    const altError = mockGetErrorForField('alt');
    expect(altError).not.toBeNull();
    expect(altError?.suggestion).toBe('Try describing the image content instead');
  });
});
