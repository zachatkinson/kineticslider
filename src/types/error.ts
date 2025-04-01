/**
 * Error type definitions and error handling interfaces
 * @module
 * @version 1.0.0
 */

import { SliderId, SlideIndex } from './branded';
import type { ValidationResult } from './validation';

// Re-export ValidationResult for backward compatibility
export type { ValidationResult };

/**
 * Core error types that can be tracked
 */
export enum ErrorType {
  /** Errors that occur during component rendering */
  RENDER = 'render',
  /** Errors that occur during asynchronous operations */
  ASYNC = 'async',
  /** Errors that occur during animations */
  ANIMATION = 'animation',
  /** Errors that occur during data validation */
  VALIDATION = 'validation',
  /** Errors that occur during resource loading */
  RESOURCE = 'resource',
  /** Errors that occur during user interactions */
  INTERACTION = 'interaction',
  /** Errors that occur during state updates */
  STATE = 'state',
  /** Generic operation errors */
  OPERATION = 'operation',
  /** Gesture handling errors */
  GESTURE = 'gesture',
  /** Navigation errors */
  NAVIGATION = 'navigation'
}

/**
 * Error severity levels for error classification
 */
export enum ErrorSeverity {
  /** Informational issues that don't affect functionality */
  INFO = 'info',
  /** Minor issues that don't significantly impact functionality */
  WARNING = 'warning',
  /** Serious issues that affect core functionality */
  ERROR = 'error',
  /** Critical issues that prevent the application from functioning */
  CRITICAL = 'critical'
}

/**
 * Base error interface for all application errors
 */
export interface BaseError {
  message: string;
  stack?: string;
  timestamp: number;
  type: ErrorType;
  severity?: ErrorSeverity;
}

/**
 * Base slider error information interface
 */
export interface SliderErrorInfo {
  name: string;
  message: string;
  componentStack: string;
  stack: string | null;
  code: string;
  timestamp: string;
  details: unknown | null;
}

/**
 * Base slider error interface
 */
export interface SliderError extends Error {
  code: string;
  timestamp: string;
  details?: unknown;
  toErrorInfo(): SliderErrorInfo;
}

/**
 * Structure of a tracked error event
 */
export interface ErrorEvent extends BaseError {
  componentInfo: Record<string, unknown>;
}

export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  errorType: ErrorType;
}

/**
 * Extended Error interface with additional context
 */
export interface ComponentError extends Error {
  /** Error classification code */
  code?: string;
  /** Type of error that occurred */
  type?: ErrorType;
  /** Severity level of the error */
  severity?: ErrorSeverity;
  /** Component information where the error occurred */
  componentInfo?: {
    /** Name of the component */
    name?: string;
    /** Component props at time of error */
    props?: Record<string, unknown>;
    /** Component state at time of error */
    state?: Record<string, unknown>;
  };
  /** Additional context about the error */
  context?: Record<string, unknown>;
  /** Stack trace of the error */
  stack?: string;
  /** Time when the error occurred */
  timestamp?: string;
  /** Whether the error has been handled */
  handled?: boolean;
  /** Number of times this error has occurred */
  occurrences?: number;
}

/**
 * Error boundary state interface
 */
export interface ErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** The error that occurred, if any */
  error: Error | null;
}

/**
 * Error tracking configuration options
 */
export interface ErrorTrackingOptions {
  /** Whether to enable error tracking */
  enabled?: boolean;
  /** Sampling rate for error tracking (0-1) */
  sampleRate?: number;
  /** Maximum number of errors to track */
  maxErrors?: number;
  /** Whether to include stack traces */
  includeStack?: boolean;
  /** Custom error handlers */
  handlers?: {
    /** Handler for error events */
    onError?: (error: ComponentError) => void;
    /** Handler for error recovery */
    onRecovery?: () => void;
  };
}

/**
 * Represents a sanitized error object safe for client display
 */
export interface SanitizedError {
  name: string;
  message: string;
  stack?: string;
  code: string;
  timestamp: string;
}

/**
 * Represents the severity level of a validation error
 */
export enum ValidationErrorSeverity {
  WARNING = 'warning',
  ERROR = 'error'
}

/**
 * Animation error for slider transitions
 */
export interface AnimationError extends BaseError {
  type: ErrorType.ANIMATION;
  details: {
    currentSlide: SlideIndex;
    targetSlide: SlideIndex;
    duration: number;
    property: string;
  };
}

/**
 * Gesture error for touch/mouse interactions
 */
export interface GestureError extends BaseError {
  type: ErrorType.GESTURE;
  details: {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    eventType: string;
  };
}

/**
 * Navigation error for slide transitions
 */
export interface NavigationError extends BaseError {
  type: ErrorType.NAVIGATION;
  details: {
    fromSlide: SlideIndex;
    toSlide: SlideIndex;
    direction: 'next' | 'prev';
  };
}

/**
 * Render error for component failures
 */
export interface RenderError extends BaseError {
  type: ErrorType.RENDER;
  details: {
    slideId: SliderId;
    componentStack: string;
  };
}

/**
 * Validation error interface with improved structure
 */
export interface ValidationError extends BaseError {
  type: ErrorType.VALIDATION;
  details: {
    field: string;
    value: unknown;
    constraint: string;
    expected: unknown;
  };
}

/**
 * Resource error for asset loading failures
 */
export interface ResourceError extends BaseError {
  type: ErrorType.RESOURCE;
  details: {
    url: string;
    resourceType: string;
    status?: number;
    statusText?: string;
  };
}

/**
 * Operation error for general failures
 */
export interface OperationError extends BaseError {
  type: ErrorType.OPERATION;
  details: {
    operation: string;
    input?: unknown;
    context?: Record<string, unknown>;
  };
}

/**
 * Union type of all specific slider errors
 */
export type SliderErrorUnion = 
  | AnimationError 
  | GestureError 
  | NavigationError 
  | RenderError
  | ValidationError
  | ResourceError
  | OperationError;

/**
 * Error tracker context for error reporting
 */
export interface ErrorTrackerContext {
  /** Component where the error occurred */
  component?: string;
  /** Action being performed when error occurred */
  action?: string;
  /** Error severity level */
  severity: 'error' | 'warning' | 'info';
  /** Timestamp when error occurred */
  timestamp: number;
  /** Additional error data */
  data?: Record<string, unknown>;
}

/**
 * Error report structure for error tracking
 */
export interface ErrorTrackerReport {
  /** The error that occurred */
  error: Error;
  /** Context about the error */
  context: ErrorTrackerContext;
  /** Stack trace if available */
  stackTrace?: string;
  /** User agent string */
  userAgent: string;
  /** URL where error occurred */
  url: string;
}