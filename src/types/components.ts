import { ErrorInfo, ReactNode } from 'react';

import type { Slide } from './slider';

/**
 * Props for the fallback render function
 */
export interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

/**
 * Types related to React components
 */

/**
 * Props for error boundary components
 */
export interface ErrorBoundaryProps {
  /** Child components to render */
  children: React.ReactNode;
  /** Optional fallback UI to render when an error occurs */
  fallback?: React.ReactNode;
  /** Callback fired when an error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Maximum number of retry attempts */
  maxRetries?: number;
}

/**
 * State for error boundary components
 */
export interface ErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** The error that occurred, if any */
  error: Error | null;
  /** Additional error information */
  errorInfo: React.ErrorInfo | null;
  /** Number of retry attempts made */
  retryCount: number;
}

/**
 * Props for Pixi-specific error boundary
 */
export interface PixiErrorBoundaryProps {
  /** Child components to render */
  children: React.ReactNode;
  /** Optional fallback UI to render when an error occurs */
  fallback?: React.ReactNode;
  /** Callback fired when an error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * State for Pixi-specific error boundary
 */
export interface PixiErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** The error that occurred, if any */
  error: Error | null;
}

/**
 * Props for the SlideForm component
 */
export interface SlideFormProps {
  initialSlide?: Partial<Slide>;
  onSave: (slide: Slide) => void;
  onCancel: () => void;
}
