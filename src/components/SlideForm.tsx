import React, { useState } from 'react';

import { DEFAULT_SLIDE } from '../constants/slides';
import { DEFAULT_VALIDATION_DEBOUNCE } from '../constants/validation';
import '../styles/SlideForm.css';
import type { Slide, SlideId } from '../types';
import { SlideFormProps } from '../types/components';
import {
  getFeedbackClass,
  useSlideValidation,
  validateAndSubmit,
} from '../utils/form-validation';
import { validateSlideWithBusinessRules } from '../utils/slide-validator';
import { ValidationErrorSeverity, ValidationResult } from '../utils/validation';

export const SlideForm: React.FC<SlideFormProps> = ({
  initialSlide = {},
  onSave,
  onCancel,
}) => {
  // Merge initial values with defaults and ensure id is present
  const [slide, setSlide] = useState<Slide>({
    id: initialSlide.id || (('temp-' + Date.now()) as SlideId),
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

    const validateSlide = async (data: Slide): Promise<ValidationResult> => {
      return validateSlideWithBusinessRules(data);
    };

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
            {validationResult.errors.map((error, index) => (
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
