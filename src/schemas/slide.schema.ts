import {
  Schema,
  ValidationResult as _ValidationResult,
  SchemaType,
  ValidationErrorCode,
  ValidationErrorType,
  ValidationError,
} from "../types/validation";
import { _isValidSlideSchema as isValidSlideSchema } from "../utils/type-guards";

export { isValidSlideSchema };

/**
 * Schema for a Slide
 */
export const _slideSchema: Schema = {
  id: {
    type: SchemaType.STRING,
    options: {
      required: true,
      minLength: 3,
      maxLength: 50,
    },
    description: "Unique identifier for the slide",
  },
  title: {
    type: SchemaType.STRING,
    options: {
      required: true,
      minLength: 1,
      maxLength: 200,
    },
    description: "Title of the slide",
  },
  description: {
    type: SchemaType.STRING,
    options: {
      required: false,
      maxLength: 1000,
    },
    description: "Optional detailed description of the slide",
  },
  image: {
    type: SchemaType.STRING,
    options: {
      required: true,
      pattern: /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i,
      custom: (value): ValidationError | null => {
        if (typeof value !== "string") {
          return {
            type: ValidationErrorType.INVALID_TYPE,
            code: ValidationErrorCode.INVALID_TYPE,
            message: "Image URL must be a string",
            property: "image",
            value,
            expected: "string",
          };
        }

        // Basic URL validation
        try {
          new URL(value);
          return null;
        } catch {
          return {
            type: ValidationErrorType.INVALID_FORMAT,
            code: ValidationErrorCode.INVALID_FORMAT,
            message: "Invalid URL format",
            property: "image",
            value,
            expected: "valid URL",
          };
        }
      },
    },
    description: "URL of the slide image",
  },
  alt: {
    type: SchemaType.STRING,
    options: {
      required: true,
      minLength: 1,
      maxLength: 500,
    },
    description: "Alternative text for the image for accessibility",
  },
  // Additional optional fields can be defined here
  order: {
    type: SchemaType.NUMBER,
    options: {
      required: false,
      min: 0,
    },
    description: "Optional order position of the slide",
  },
  metadata: {
    type: SchemaType.OBJECT,
    options: {
      required: false,
    },
    description: "Additional metadata for the slide",
  },
};
