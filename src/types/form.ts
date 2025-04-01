import type { Slide } from './slider';

/**
 * Form-related type definitions and interfaces
 */

/**
 * Props for the SlideForm component
 */
export interface SlideFormProps {
  /** Initial slide data */
  initialSlide?: Partial<Slide>;
  /** Callback when form is saved */
  onSave: (slide: Slide) => void;
  /** Callback when form is cancelled */
  onCancel: () => void;
}

/**
 * Form field configuration
 */
export interface FormFieldConfig {
  /** Field label */
  label: string;
  /** Field type */
  type: 'text' | 'number' | 'textarea' | 'select' | 'checkbox';
  /** Whether field is required */
  required?: boolean;
  /** Field validation rules */
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
  };
  /** Field options for select type */
  options?: Array<{
    label: string;
    value: string | number;
  }>;
} 