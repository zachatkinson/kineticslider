import { Schema, ValidationResult } from '../types/validation';
import { isValidSlideSchema } from '../utils/type-guards';
import { ValidationErrorCode, ValidationErrorType } from '../utils/validation';

export { isValidSlideSchema };

/**
 * Schema for a Slide
 */
export const slideSchema: Schema = {
  id: {
    type: 'string',
    options: {
      required: true,
      minLength: 3,
      maxLength: 50,
    },
    description: 'Unique identifier for the slide',
  },
  title: {
    type: 'string',
    options: {
      required: true,
      minLength: 1,
      maxLength: 200,
    },
    description: 'Title of the slide',
  },
  description: {
    type: 'string',
    options: {
      required: false,
      maxLength: 1000,
    },
    description: 'Optional detailed description of the slide',
  },
  image: {
    type: 'string',
    options: {
      required: true,
      pattern: /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i,
      custom: async (value): Promise<ValidationResult> => {
        // Optional: Perform additional URL validation or check if image exists
        if (typeof value !== 'string') {
          return {
            valid: false,
            errors: [
              {
                type: ValidationErrorType.INVALID_TYPE,
                code: ValidationErrorCode.INVALID_TYPE,
                message: 'Image URL must be a string',
                property: 'image',
                value,
                expected: 'string',
              },
            ],
          };
        }

        // Basic URL validation
        try {
          new URL(value);
          return { valid: true, errors: [] };
        } catch {
          return {
            valid: false,
            errors: [
              {
                type: ValidationErrorType.INVALID_FORMAT,
                code: ValidationErrorCode.INVALID_FORMAT,
                message: 'Invalid URL format',
                property: 'image',
                value,
                expected: 'valid URL',
              },
            ],
          };
        }
      },
    },
    description: 'URL of the slide image',
  },
  alt: {
    type: 'string',
    options: {
      required: true,
      minLength: 1,
      maxLength: 500,
    },
    description: 'Alternative text for the image for accessibility',
  },
  // Additional optional fields can be defined here
  order: {
    type: 'number',
    options: {
      required: false,
      min: 0,
    },
    description: 'Optional order position of the slide',
  },
  metadata: {
    type: 'object',
    options: {
      required: false,
    },
    properties: {
      tags: {
        type: 'array',
        options: {
          required: false,
        },
        items: {
          type: 'string',
        },
        description: 'Tags associated with this slide',
      },
      createdAt: {
        type: 'string',
        options: {
          required: false,
          pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/,
        },
        description: 'Creation timestamp in ISO format',
      },
    },
    description: 'Additional metadata for the slide',
  },
};
