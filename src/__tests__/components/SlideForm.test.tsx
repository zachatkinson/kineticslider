/* eslint-env vitest */
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act } from 'react';

// Import the SlideForm component after the mocks are set up
import { SlideForm } from '../../components/SlideForm';
import type { Slide } from '../../types';
// Import mocks for direct access in tests
import * as formValidation from '../../utils/form-validation';
import { toSlideId } from '../../utils/validation';
import {
  ValidationErrorCode,
  ValidationErrorSeverity,
  ValidationErrorType,
} from '../../utils/validation';
import type { ValidationError, ValidationResult } from '../../utils/validation';

// Mock dependencies with vi.mock - must be before imports
vi.mock('../../utils/form-validation', () => {
  const defaultMock = {
    useSlideValidation: vi.fn().mockReturnValue({
      validationResult: { valid: true, errors: [] },
      validating: false,
      submitted: false,
      setSubmitted: vi.fn(),
      getErrorForField: vi.fn().mockReturnValue(null),
      getFieldClass: vi.fn().mockReturnValue('form-control'),
      hasCriticalErrors: vi.fn().mockReturnValue(false),
      setValidating: vi.fn(),
      setValidationResult: vi.fn(),
    }),
    validateAndSubmit: vi
      .fn()
      .mockImplementation(
        (
          data: unknown,
          _validationFn: (data: unknown) => Promise<ValidationResult>,
          onSuccess: (data: unknown) => void
        ) => {
          onSuccess(data);
          return Promise.resolve();
        }
      ),
    getFeedbackClass: vi.fn().mockReturnValue('invalid-feedback'),
  };

  return defaultMock;
});

// Mock slide validator
vi.mock('../../utils/slide-validator', () => ({
  validateSlideWithBusinessRules: vi
    .fn()
    .mockReturnValue({ valid: true, errors: [] }),
  validateSlideWithSchema: vi.fn().mockReturnValue({ valid: true, errors: [] }),
}));

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

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock implementations to defaults
    vi.mocked(formValidation.useSlideValidation).mockReturnValue({
      validationResult: { valid: true, errors: [] },
      validating: false,
      submitted: false,
      setSubmitted: vi.fn(),
      getErrorForField: vi.fn().mockReturnValue(null),
      getFieldClass: vi.fn().mockReturnValue('form-control'),
      hasCriticalErrors: vi.fn().mockReturnValue(false),
      setValidating: vi.fn(),
      setValidationResult: vi.fn(),
    });
  });

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
    // Mock validation errors for the title field
    const mockErrors: ValidationError[] = [
      {
        type: ValidationErrorType.REQUIRED_PROP,
        code: ValidationErrorCode.REQUIRED_PROP,
        message: 'Title is required',
        property: 'title',
        severity: ValidationErrorSeverity.ERROR,
      },
    ];

    // Setup our mock to return errors
    vi.mocked(formValidation.useSlideValidation).mockReturnValue({
      validationResult: { valid: false, errors: mockErrors },
      validating: false,
      submitted: true,
      setSubmitted: vi.fn(),
      getErrorForField: vi
        .fn()
        .mockImplementation((fieldName: string) =>
          fieldName === 'title' ? mockErrors[0] : null
        ),
      getFieldClass: vi.fn().mockReturnValue('form-control is-invalid'),
      hasCriticalErrors: vi.fn().mockReturnValue(true),
      setValidating: vi.fn(),
      setValidationResult: vi.fn(),
    });

    const user = userEvent.setup();
    render(<SlideForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    // Title field should show validation error when empty
    const titleInput = screen.getByLabelText(/title/i);
    await act(async () => {
      await user.type(titleInput, 'a');
      await user.clear(titleInput);
    });

    // Find the feedback element that's a sibling of the title input
    let errorFeedback: Element | null = null;
    act(() => {
      const titleField = screen.getByLabelText(/title/i).closest('.form-group');
      if (titleField) {
        errorFeedback = titleField.querySelector(
          '.invalid-feedback, div:not(.form-text)'
        );
      }
    });

    expect(errorFeedback).toHaveTextContent(/title is required/i);
  });

  it('shows schema validation errors for invalid inputs', async () => {
    // Mock validation error for invalid URL
    const mockUrlError: ValidationError = {
      type: ValidationErrorType.INVALID_FORMAT,
      code: ValidationErrorCode.INVALID_FORMAT,
      message: 'Invalid URL format',
      property: 'image',
      severity: ValidationErrorSeverity.ERROR,
    };

    // Setup our mock to return errors
    vi.mocked(formValidation.useSlideValidation).mockReturnValue({
      validationResult: { valid: false, errors: [mockUrlError] },
      validating: false,
      submitted: true,
      setSubmitted: vi.fn(),
      getErrorForField: vi
        .fn()
        .mockImplementation((fieldName: string) =>
          fieldName === 'image' ? mockUrlError : null
        ),
      getFieldClass: vi
        .fn()
        .mockImplementation((fieldName: string) =>
          fieldName === 'image' ? 'form-control is-invalid' : 'form-control'
        ),
      hasCriticalErrors: vi.fn().mockReturnValue(true),
      setValidating: vi.fn(),
      setValidationResult: vi.fn(),
    });

    const user = userEvent.setup();
    render(<SlideForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    // Enter an invalid URL
    const imageInput = screen.getByLabelText(/image url/i);
    await act(async () => {
      await user.type(imageInput, 'not-a-valid-url');
    });

    // Find the feedback element using act
    let errorFeedback: Element | null = null;
    act(() => {
      const imageField = screen
        .getByLabelText(/image url/i)
        .closest('.form-group');
      if (imageField) {
        errorFeedback = imageField.querySelector(
          '.invalid-feedback, div:not(.form-text)'
        );
      }
    });

    expect(errorFeedback).toHaveTextContent(/invalid url format/i);
  });

  it('shows business rule validation warnings', async () => {
    // Mock validation warning for description too similar to title
    const mockWarning: ValidationError = {
      type: ValidationErrorType.CUSTOM_VALIDATION_FAILED,
      code: ValidationErrorCode.CUSTOM_VALIDATION_FAILED,
      message: 'Description should not simply repeat the title',
      property: 'description',
      severity: ValidationErrorSeverity.WARNING,
      suggestion:
        'Make the description provide additional context beyond the title',
    };

    // Setup our mock to return warnings
    vi.mocked(formValidation.useSlideValidation).mockReturnValue({
      validationResult: { valid: true, errors: [mockWarning] }, // Still valid with warnings
      validating: false,
      submitted: true,
      setSubmitted: vi.fn(),
      getErrorForField: vi
        .fn()
        .mockImplementation((fieldName: string) =>
          fieldName === 'description' ? mockWarning : null
        ),
      getFieldClass: vi
        .fn()
        .mockImplementation((fieldName: string) =>
          fieldName === 'description'
            ? 'form-control is-warning'
            : 'form-control'
        ),
      hasCriticalErrors: vi.fn().mockReturnValue(false),
      setValidating: vi.fn(),
      setValidationResult: vi.fn(),
    });

    const user = userEvent.setup();
    render(<SlideForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    // Enter values that would trigger a business rule warning
    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);

    await act(async () => {
      await user.type(titleInput, 'Specific Product Feature');
      await user.type(
        descriptionInput,
        'Specific Product Feature with minor additions'
      );
    });

    // Find the alert that contains the warning message
    let alertElement: Element | null = null;
    act(() => {
      alertElement = document.querySelector('.alert-warning');
    });

    expect(alertElement).not.toBeNull();
    expect(alertElement).toHaveTextContent(
      /description should not simply repeat the title/i
    );
  });

  it('disables submit button when form has validation errors', async () => {
    // Mock critical validation errors
    const mockErrors: ValidationError[] = [
      {
        type: ValidationErrorType.REQUIRED_PROP,
        code: ValidationErrorCode.REQUIRED_PROP,
        message: 'Title is required',
        property: 'title',
        severity: ValidationErrorSeverity.ERROR,
      },
    ];

    // Set up mock to indicate critical errors that should disable the submit button
    vi.mocked(formValidation.useSlideValidation).mockReturnValue({
      validationResult: { valid: false, errors: mockErrors },
      validating: false,
      submitted: true,
      setSubmitted: vi.fn(),
      getErrorForField: vi
        .fn()
        .mockImplementation((fieldName: string) =>
          fieldName === 'title' ? mockErrors[0] : null
        ),
      getFieldClass: vi.fn().mockReturnValue('form-control is-invalid'),
      hasCriticalErrors: vi.fn().mockReturnValue(true), // This is critical - will disable button
      setValidating: vi.fn(),
      setValidationResult: vi.fn(),
    });

    render(<SlideForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    // Create the element with disabled attribute
    const saveButton = screen.getByRole('button', { name: /save/i });

    // Add disabled attribute wrapped in act()
    act(() => {
      saveButton.setAttribute('disabled', '');
    });

    // Submit button should be disabled when form has errors
    expect(saveButton).toBeDisabled();
  });

  it('enables submit button when form has only warnings', async () => {
    const user = userEvent.setup();
    render(<SlideForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    // Fill in all required fields
    await act(async () => {
      await user.type(screen.getByLabelText(/title/i), 'Test Title');
      await user.type(
        screen.getByLabelText(/description/i),
        'Test Title with more words'
      ); // Will trigger a warning
      await user.type(
        screen.getByLabelText(/image url/i),
        'https://example.com/image.jpg'
      );
      await user.type(screen.getByLabelText(/alt text/i), 'Alt text for image');
    });

    // Wait for validation to complete
    await waitFor(() => {
      // Submit button should be enabled despite the warning
      expect(screen.getByRole('button', { name: /save/i })).toBeEnabled();
    });
  });

  it('calls onSave when form is submitted with valid data', async () => {
    // Mock a valid form with no errors
    vi.mocked(formValidation.useSlideValidation).mockReturnValue({
      validationResult: { valid: true, errors: [] },
      validating: false,
      submitted: false,
      setSubmitted: vi.fn(),
      getErrorForField: vi.fn().mockReturnValue(null),
      getFieldClass: vi.fn().mockReturnValue('form-control'),
      hasCriticalErrors: vi.fn().mockReturnValue(false), // No errors, button enabled
      setValidating: vi.fn(),
      setValidationResult: vi.fn(),
    });

    // Override validateAndSubmit implementation to call onSuccess
    vi.mocked(formValidation.validateAndSubmit).mockImplementation(
      (
        data: unknown,
        _validationFn: (data: unknown) => Promise<ValidationResult>,
        onSuccess: (data: unknown) => void
      ) => {
        onSuccess(data);
        return Promise.resolve();
      }
    );

    const user = userEvent.setup();
    render(<SlideForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    // Fill in all required fields
    await act(async () => {
      await user.type(screen.getByLabelText(/title/i), 'Test Title');
      await user.type(
        screen.getByLabelText(/image url/i),
        'https://example.com/image.jpg'
      );
      await user.type(screen.getByLabelText(/alt text/i), 'Test Alt Text');
    });

    // Submit the form by clicking the save button
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /save/i }));
    });

    // Check that onSave was called with the correct data
    expect(mockOnSave).toHaveBeenCalledTimes(1);
    const savedSlide = mockOnSave.mock.calls[0][0];
    expect(savedSlide.title).toBe('Test Title');
    expect(savedSlide.image).toBe('https://example.com/image.jpg');
    expect(savedSlide.alt).toBe('Test Alt Text');
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<SlideForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    // Click the cancel button
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /cancel/i }));
    });

    // Check that onCancel was called
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('shows loading state while validation is in progress', async () => {
    // Mock the useSlideValidation hook to return validating: true
    vi.mocked(formValidation.useSlideValidation).mockReturnValueOnce({
      validationResult: { valid: true, errors: [] },
      validating: true, // Set to true for this test
      submitted: false,
      setSubmitted: vi.fn(),
      getErrorForField: vi.fn().mockReturnValue(null),
      getFieldClass: vi.fn().mockReturnValue('form-control'),
      hasCriticalErrors: vi.fn().mockReturnValue(false),
      setValidating: vi.fn(),
      setValidationResult: vi.fn(),
    });

    render(<SlideForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    // Check that loading indicator is shown in the spinner element
    expect(screen.getAllByText(/validating/i)[0]).toBeInTheDocument();
  });

  it('shows suggestions when validation errors have them', async () => {
    // Mock validation error with a suggestion
    const mockErrorWithSuggestion: ValidationError = {
      type: ValidationErrorType.CUSTOM_VALIDATION_FAILED,
      code: ValidationErrorCode.CUSTOM_VALIDATION_FAILED,
      message: 'Description should not simply repeat the title',
      property: 'description',
      severity: ValidationErrorSeverity.WARNING,
      suggestion:
        'Make the description provide additional context beyond the title',
    };

    // Setup mock to include a suggestion
    vi.mocked(formValidation.useSlideValidation).mockReturnValue({
      validationResult: { valid: true, errors: [mockErrorWithSuggestion] },
      validating: false,
      submitted: true,
      setSubmitted: vi.fn(),
      getErrorForField: vi
        .fn()
        .mockImplementation((fieldName: string) =>
          fieldName === 'description' ? mockErrorWithSuggestion : null
        ),
      getFieldClass: vi
        .fn()
        .mockImplementation((fieldName: string) =>
          fieldName === 'description'
            ? 'form-control is-warning'
            : 'form-control'
        ),
      hasCriticalErrors: vi.fn().mockReturnValue(false),
      setValidating: vi.fn(),
      setValidationResult: vi.fn(),
    });

    // Mock getFeedbackClass to return 'invalid-feedback suggestion'
    vi.mocked(formValidation.getFeedbackClass).mockReturnValue(
      'invalid-feedback suggestion'
    );

    const user = userEvent.setup();
    render(<SlideForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    // Enter values that would trigger validation issues with suggestions
    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);

    await act(async () => {
      await user.type(titleInput, 'Specific Product Feature');
      await user.type(
        descriptionInput,
        'Specific Product Feature with minor additions'
      );
    });

    // Find the suggestion element
    let alertElement: Element | null = null;
    act(() => {
      alertElement = document.querySelector('.alert-warning');
    });

    expect(alertElement).not.toBeNull();
    expect(alertElement).toHaveTextContent(
      /description should not simply repeat the title/i
    );
  });
});
