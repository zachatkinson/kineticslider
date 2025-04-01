import React, { useState } from 'react';

import { DEFAULT_SLIDE } from '../constants/slides';
import { DEFAULT_VALIDATION_DEBOUNCE } from '../constants/validation';
import '../styles/SlideForm.css';
import type { Slide, SliderId } from '../types/slider';
import type { SlideFormProps } from '../types/components';
import type { ValidationError } from '../types/validation';
import { getFeedbackClass, validateAndSubmit } from '../utils/form-helpers';
import { useSlideValidation } from '../hooks/slider/useSlideValidation';
import { validateSlide } from '../utils/validation-helpers';
import { ValidationErrorSeverity } from '../types/validation';
import type { ValidationResult } from '../types/validation';

/**
 * A form component for creating and editing slider slides with validation and accessibility support.
 *
 * @component
 * @example
 * ```tsx
 * <SlideForm
 *   initialSlide={{ title: 'Example', image: 'https://example.com/image.jpg' }}
 *   onSave={(slide) => handleSave(slide)}
 *   onCancel={() => handleCancel()}
 * />
 * ```
 *
 * @accessibility
 * - Uses semantic form elements
 * - Provides ARIA labels and descriptions
 * - Shows validation feedback
 * - Supports keyboard navigation
 * - Uses required field indicators
 *
 * @state
 * - Manages form field values
 * - Tracks validation state
 * - Handles submission state
 * - Manages error states
 *
 * @events
 * - onSave: Fired when form is valid and submitted
 * - onCancel: Fired when form is cancelled
 * - onChange: Internal field change handling
 *
 * @validation
 * - Real-time field validation
 * - Debounced validation checks
 * - Error message display
 * - Field-level feedback
 * - Form-level validation
 *
 * @error
 * - Displays validation errors
 * - Shows warning messages
 * - Provides error suggestions
 * - Prevents invalid submissions
 *
 * @see {@link useSlideValidation} For validation hook implementation
 * @see {@link validateSlide} For validation logic
 */

export const SlideForm: React.FC<SlideFormProps> = ({
  initialSlide = {},
  onSave,
  onCancel,
}) => {
  // Merge initial values with defaults and ensure id is present
  const [slide, setSlide] = useState<Slide>({
    id: initialSlide.id || (('temp-' + Date.now()) as SliderId),
    ...DEFAULT_SLIDE,
    ...initialSlide,
  } as Slide);

  // Use the validation hook for slide validation with validation on mount
  const {
    validationResult,
    validating,
    submitted,
    setSubmitted,
    getErrorForField,
    getFieldClass,
    setValidating,
    setValidationResult,
  } = useSlideValidation(slide, {
    validateOnMount: true,
    debounceMs: DEFAULT_VALIDATION_DEBOUNCE,
  });

  // Handle form field changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setSlide((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();

    void validateAndSubmit(
      slide,
      validateSlide,
      onSave,
      setValidating,
      setValidationResult,
      setSubmitted
    );
  };

  return (
    <form onSubmit={handleSubmit} className="slide-form">
      <div
        className="form-loading-overlay"
        style={{ display: validating ? 'flex' : 'none' }}
      >
        <div className="spinner">Validating...</div>
      </div>

      <div className="form-group mb-3">
        <label htmlFor="title">Title *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={slide.title}
          onChange={handleChange}
          className={getFieldClass('title')}
          aria-describedby="titleHelp"
          required
        />
        {getErrorForField('title') && (
          <div className={getFeedbackClass(getErrorForField('title'))}>
            {getErrorForField('title')?.message}
          </div>
        )}
        <small id="titleHelp" className="form-text text-muted">
          Enter a concise and descriptive title
        </small>
      </div>

      <div className="form-group mb-3">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={slide.description}
          onChange={handleChange}
          className={getFieldClass('description')}
          rows={3}
        />
        {getErrorForField('description') && (
          <div className={getFeedbackClass(getErrorForField('description'))}>
            {getErrorForField('description')?.message}
            {getErrorForField('description')?.suggestion && (
              <span className="suggestion">
                <strong>Suggestion:</strong>{' '}
                {getErrorForField('description')?.suggestion}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="form-group mb-3">
        <label htmlFor="image">Image URL *</label>
        <input
          type="url"
          id="image"
          name="image"
          value={slide.image}
          onChange={handleChange}
          className={getFieldClass('image')}
          placeholder="https://example.com/image.jpg"
          required
        />
        {getErrorForField('image') && (
          <div className={getFeedbackClass(getErrorForField('image'))}>
            {getErrorForField('image')?.message}
          </div>
        )}
      </div>

      <div className="form-group mb-3">
        <label htmlFor="alt">Alt Text *</label>
        <input
          type="text"
          id="alt"
          name="alt"
          value={slide.alt}
          onChange={handleChange}
          className={getFieldClass('alt')}
          aria-describedby="altHelp"
          required
        />
        {getErrorForField('alt') && (
          <div className={getFeedbackClass(getErrorForField('alt'))}>
            {getErrorForField('alt')?.message}
          </div>
        )}
        <small id="altHelp" className="form-text text-muted">
          Describe the image for screen readers and accessibility
        </small>
      </div>

      {submitted && validationResult.errors.length > 0 && (
        <div className="alert alert-warning">
          <strong>Please review the form for issues:</strong>
          <ul>
            {validationResult.errors.map((error: ValidationError, index: number) => (
              <li
                key={index}
                className={`text-${error.severity === ValidationErrorSeverity.WARNING ? 'warning' : 'danger'}`}
              >
                {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary me-2"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={validating}>
          {validating ? 'Validating...' : 'Save Slide'}
        </button>
      </div>
    </form>
  );
};
