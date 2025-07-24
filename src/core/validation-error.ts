/**
 * @fileoverview Enhanced Validation Error System for KineticSlider
 * 
 * Extends the existing SliderError class to provide detailed validation error reporting
 * with path-based error tracking, user-friendly messages, and actionable suggestions.
 * Integrates with the existing ConfigValidator patterns.
 * 
 * @version 1.0.0 - Phase 4.4 Error Handling & Recovery
 */

import { SliderError } from './types';
import { SLIDER_ERROR_CODES } from './constants';

/**
 * Validation context for error tracking
 */
export interface ValidationContext {
  /** The property path where validation failed */
  path: string[];
  /** The configuration object being validated */
  config: unknown;
  /** Validation rule that failed */
  rule?: string;
  /** Additional context information */
  metadata?: Record<string, unknown>;
}

/**
 * Suggestion for fixing validation errors
 */
export interface ValidationSuggestion {
  /** Human-readable suggestion */
  message: string;
  /** Suggested value to use */
  suggestedValue?: unknown;
  /** Code example showing the fix */
  codeExample?: string;
  /** Link to documentation */
  documentationLink?: string;
}

/**
 * Enhanced validation error class with detailed error reporting and suggestions
 * 
 * @example
 * ```typescript
 * // Basic validation error
 * const error = new ValidationError(
 *   'Invalid slide duration',
 *   ['slides', '0', 'duration'],
 *   -1,
 *   'positive number',
 *   'range_validation'
 * );
 * 
 * console.log(error.toDetailedString());
 * console.log(error.toUserFriendlyMessage());
 * 
 * const suggestions = error.getSuggestions();
 * suggestions.forEach(s => console.log(s.message));
 * ```
 */
export class ValidationError extends SliderError {
  /** JSON path to the invalid property */
  public readonly path: string[];
  /** The invalid value */
  public readonly value: unknown;
  /** Expected type or constraint */
  public readonly expectedType: string;
  /** Validation rule that failed */
  public readonly validationRule?: string;
  /** Additional context */
  public readonly context?: ValidationContext;

  constructor(
    message: string,
    path: string[],
    value: unknown,
    expectedType: string,
    validationRule?: string,
    context?: ValidationContext
  ) {
    // Create a detailed error code
    const errorCode = validationRule ? 
      `${SLIDER_ERROR_CODES.INVALID_CONFIG}_${validationRule.toUpperCase()}` :
      SLIDER_ERROR_CODES.INVALID_CONFIG;

    super(message, errorCode, {
      path,
      value,
      expectedType,
      validationRule,
      context
    });

    this.name = 'ValidationError';
    this.path = path;
    this.value = value;
    this.expectedType = expectedType;
    this.validationRule = validationRule;
    this.context = context;
  }

  /**
   * Create ValidationError from existing validation result
   */
  static fromValidationResult(
    validationError: { 
      code: string; 
      message: string; 
      path: string; 
      expected?: unknown; 
      actual?: unknown; 
    },
    context?: ValidationContext
  ): ValidationError {
    const pathArray = validationError.path ? validationError.path.split('.') : [];
    
    return new ValidationError(
      validationError.message,
      pathArray,
      validationError.actual,
      String(validationError.expected || 'valid value'),
      validationError.code,
      context
    );
  }

  /**
   * Get detailed error string with full context
   */
  toDetailedString(): string {
    const pathStr = this.path.length > 0 ? this.path.join('.') : 'root';
    const valueStr = this.formatValue(this.value);
    
    let details = `ValidationError: ${this.message}\n`;
    details += `  Path: ${pathStr}\n`;
    details += `  Expected: ${this.expectedType}\n`;
    details += `  Actual: ${valueStr}\n`;
    
    if (this.validationRule) {
      details += `  Rule: ${this.validationRule}\n`;
    }
    
    if (this.stack) {
      details += `  Stack: ${this.stack.split('\n')[1]?.trim() || 'N/A'}\n`;
    }

    // Add suggestions
    const suggestions = this.getSuggestions();
    if (suggestions.length > 0) {
      details += `  Suggestions:\n`;
      suggestions.forEach((suggestion, index) => {
        details += `    ${index + 1}. ${suggestion.message}\n`;
        if (suggestion.codeExample) {
          details += `       Example: ${suggestion.codeExample}\n`;
        }
      });
    }

    return details;
  }

  /**
   * Get user-friendly error message without technical details
   */
  toUserFriendlyMessage(): string {
    const pathStr = this.formatPathForUser(this.path);
    
    // Handle common validation scenarios with friendly messages
    switch (this.validationRule) {
      case 'required':
        return `${pathStr} is required but was not provided.`;
      
      case 'type':
        return `${pathStr} should be ${this.expectedType}, but received ${this.getValueType(this.value)}.`;
      
      case 'range':
        return `${pathStr} is out of the allowed range. Expected ${this.expectedType}.`;
      
      case 'format':
        return `${pathStr} has an invalid format. Expected ${this.expectedType}.`;
      
      case 'dependency':
        return `${pathStr} conflicts with other settings. ${this.expectedType}`;
      
      default:
        // Generic friendly message
        if (this.path.length > 0) {
          return `There's an issue with the ${this.formatPathForUser(this.path)} setting. ${this.message}`;
        }
        return `Configuration error: ${this.message}`;
    }
  }

  /**
   * Get actionable suggestions for fixing the error
   */
  getSuggestions(): ValidationSuggestion[] {
    const suggestions: ValidationSuggestion[] = [];
    const pathStr = this.path.join('.');

    // Generate suggestions based on validation rule and path
    switch (this.validationRule) {
      case 'required':
        suggestions.push({
          message: `Add the required ${this.formatPathForUser(this.path)} property`,
          suggestedValue: this.getDefaultValueForType(this.expectedType),
          codeExample: `${pathStr}: ${this.formatCodeExample(this.getDefaultValueForType(this.expectedType))}`
        });
        break;

      case 'type':
        suggestions.push({
          message: `Change ${this.formatPathForUser(this.path)} to ${this.expectedType}`,
          suggestedValue: this.convertToExpectedType(this.value, this.expectedType),
          codeExample: `${pathStr}: ${this.formatCodeExample(this.convertToExpectedType(this.value, this.expectedType))}`
        });
        break;

      case 'range':
        suggestions.push(...this.getRangeSuggestions());
        break;

      case 'format':
        suggestions.push(...this.getFormatSuggestions());
        break;

      case 'dependency':
        suggestions.push(...this.getDependencySuggestions());
        break;

      default:
        // Generic suggestions
        suggestions.push({
          message: `Check the ${this.formatPathForUser(this.path)} configuration`,
          documentationLink: this.getDocumentationLink(this.path)
        });
    }

    // Add path-specific suggestions
    suggestions.push(...this.getPathSpecificSuggestions());

    return suggestions;
  }

  /**
   * Check if this error is recoverable
   */
  isRecoverable(): boolean {
    // Some validation errors can be auto-corrected
    const recoverableRules = ['range', 'type', 'format'];
    return recoverableRules.includes(this.validationRule || '');
  }

  /**
   * Attempt to auto-correct the error
   */
  autoCorrect(): { success: boolean; correctedValue?: unknown } {
    if (!this.isRecoverable()) {
      return { success: false };
    }

    try {
      switch (this.validationRule) {
        case 'type': {
          const converted = this.convertToExpectedType(this.value, this.expectedType);
          return { success: true, correctedValue: converted };
        }

        case 'range': {
          const clamped = this.clampToValidRange(this.value);
          return { success: clamped !== null, correctedValue: clamped };
        }

        case 'format': {
          const formatted = this.formatToValidFormat(this.value);
          return { success: formatted !== null, correctedValue: formatted };
        }

        default:
          return { success: false };
      }
    } catch {
      return { success: false };
    }
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  /**
   * Format value for display
   */
  private formatValue(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }

  /**
   * Format path for user-friendly display
   */
  private formatPathForUser(path: string[]): string {
    if (path.length === 0) return 'configuration';
    
    // Convert camelCase to readable format
    return path
      .map(segment => {
        // Convert array indices to readable format
        if (/^\d+$/.test(segment)) {
          return `item ${segment}`;
        }
        
        // Convert camelCase to space-separated
        return segment.replace(/([A-Z])/g, ' $1').toLowerCase();
      })
      .join(' → ');
  }

  /**
   * Get type of value as string
   */
  private getValueType(value: unknown): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  /**
   * Get default value for a type
   */
  private getDefaultValueForType(type: string): unknown {
    switch (type.toLowerCase()) {
      case 'string': return '';
      case 'number': return 0;
      case 'boolean': return false;
      case 'array': return [];
      case 'object': return {};
      default: return null;
    }
  }

  /**
   * Convert value to expected type
   */
  private convertToExpectedType(value: unknown, expectedType: string): unknown {
    switch (expectedType.toLowerCase()) {
      case 'string':
        return String(value);
      
      case 'number': {
        const num = Number(value);
        return isNaN(num) ? 0 : num;
      }
      
      case 'boolean':
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true';
        }
        return Boolean(value);
      
      case 'array':
        return Array.isArray(value) ? value : [value];
      
      default:
        return value;
    }
  }

  /**
   * Get range-specific suggestions
   */
  private getRangeSuggestions(): ValidationSuggestion[] {
    const suggestions: ValidationSuggestion[] = [];
    
    if (typeof this.value === 'number') {
      // Extract range from expected type (e.g., "number between 0 and 100")
      // eslint-disable-next-line security/detect-unsafe-regex
      const rangeMatch = this.expectedType.match(/between (\d+(?:\.\d+)?) and (\d+(?:\.\d+)?)/);  
      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[2]);
        const clamped = Math.max(min, Math.min(max, this.value));
        
        suggestions.push({
          message: `Use a value between ${min} and ${max}`,
          suggestedValue: clamped,
          codeExample: `${this.path.join('.')}: ${clamped}`
        });
      }
    }

    return suggestions;
  }

  /**
   * Get format-specific suggestions
   */
  private getFormatSuggestions(): ValidationSuggestion[] {
    const suggestions: ValidationSuggestion[] = [];
    const pathStr = this.path.join('.');

    // Handle common format issues
    if (pathStr.includes('url') || pathStr.includes('src')) {
      suggestions.push({
        message: 'Ensure the URL is properly formatted and accessible',
        codeExample: `${pathStr}: "https://example.com/image.jpg"`
      });
    }

    if (pathStr.includes('easing') || pathStr.includes('ease')) {
      suggestions.push({
        message: 'Use a valid GSAP easing function',
        codeExample: `${pathStr}: "power2.out"`,
        documentationLink: 'https://greensock.com/ease-visualizer/'
      });
    }

    if (pathStr.includes('duration') || pathStr.includes('delay')) {
      suggestions.push({
        message: 'Use a positive number in seconds',
        codeExample: `${pathStr}: 1.5`
      });
    }

    return suggestions;
  }

  /**
   * Get dependency-specific suggestions
   */
  private getDependencySuggestions(): ValidationSuggestion[] {
    const suggestions: ValidationSuggestion[] = [];

    // Handle common dependency conflicts
    if (this.message.includes('autoPlay') && this.message.includes('loop')) {
      suggestions.push({
        message: 'When using autoPlay, consider enabling loop mode',
        codeExample: 'loop: { enabled: true, mode: "infinite" }'
      });
    }

    if (this.message.includes('responsive') && this.message.includes('breakpoints')) {
      suggestions.push({
        message: 'Ensure breakpoints are in ascending order',
        codeExample: 'breakpoints: { mobile: 768, tablet: 1024, desktop: 1440 }'
      });
    }

    return suggestions;
  }

  /**
   * Get path-specific suggestions
   */
  private getPathSpecificSuggestions(): ValidationSuggestion[] {
    const suggestions: ValidationSuggestion[] = [];
    const pathStr = this.path.join('.');

    // Slides configuration
    if (pathStr.startsWith('slides')) {
      suggestions.push({
        message: 'Check the slides array configuration',
        documentationLink: this.getDocumentationLink(['slides'])
      });
    }

    // Physics configuration
    if (pathStr.includes('physics')) {
      suggestions.push({
        message: 'Verify physics settings are within recommended ranges',
        documentationLink: this.getDocumentationLink(['physics'])
      });
    }

    // Rendering configuration
    if (pathStr.includes('rendering') || pathStr.includes('pixi')) {
      suggestions.push({
        message: 'Check rendering configuration for your target devices',
        documentationLink: this.getDocumentationLink(['rendering'])
      });
    }

    return suggestions;
  }

  /**
   * Clamp value to valid range
   */
  private clampToValidRange(value: unknown): unknown {
    if (typeof value !== 'number') return null;

    // Extract range from expected type
    // eslint-disable-next-line security/detect-unsafe-regex
    const rangeMatch = this.expectedType.match(/between (\d+(?:\.\d+)?) and (\d+(?:\.\d+)?)/);
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1]);
      const max = parseFloat(rangeMatch[2]);
      return Math.max(min, Math.min(max, value));
    }

    return null;
  }

  /**
   * Format value to valid format
   */
  private formatToValidFormat(value: unknown): unknown {
    const pathStr = this.path.join('.');

    // URL formatting
    if (pathStr.includes('url') || pathStr.includes('src')) {
      if (typeof value === 'string' && !value.startsWith('http') && !value.startsWith('/')) {
        return `/${value}`; // Assume relative path
      }
    }

    // Duration formatting
    if (pathStr.includes('duration') && typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? null : Math.max(0, num);
    }

    return null;
  }

  /**
   * Format code example
   */
  private formatCodeExample(value: unknown): string {
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }

  /**
   * Get documentation link for path
   */
  private getDocumentationLink(path: string[]): string {
    const section = path[0] || 'configuration';
    return `https://docs.kineticslider.com/configuration/${section}`;
  }
}

/**
 * Utility functions for creating common validation errors
 */
export class ValidationErrorFactory {
  /**
   * Create required property error
   */
  static required(path: string[], propertyName: string): ValidationError {
    return new ValidationError(
      `Property '${propertyName}' is required`,
      path,
      undefined,
      'any',
      'required'
    );
  }

  /**
   * Create type mismatch error
   */
  static typeMismatch(path: string[], value: unknown, expectedType: string): ValidationError {
    const actualType = value === null ? 'null' : typeof value;
    return new ValidationError(
      `Expected ${expectedType}, got ${actualType}`,
      path,
      value,
      expectedType,
      'type'
    );
  }

  /**
   * Create range error
   */
  static outOfRange(path: string[], value: unknown, min: number, max: number): ValidationError {
    return new ValidationError(
      `Value must be between ${min} and ${max}`,
      path,
      value,
      `number between ${min} and ${max}`,
      'range'
    );
  }

  /**
   * Create format error
   */
  static invalidFormat(path: string[], value: unknown, expectedFormat: string): ValidationError {
    return new ValidationError(
      `Invalid format, expected ${expectedFormat}`,
      path,
      value,
      expectedFormat,
      'format'
    );
  }

  /**
   * Create dependency conflict error
   */
  static dependencyConflict(path: string[], value: unknown, conflictDescription: string): ValidationError {
    return new ValidationError(
      `Dependency conflict: ${conflictDescription}`,
      path,
      value,
      conflictDescription,
      'dependency'
    );
  }
}