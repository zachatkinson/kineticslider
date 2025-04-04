import { ErrorInfo as _ErrorInfo, ReactNode as _ReactNode } from 'react';
import type { Slide as _Slide, KineticSliderProps as _KineticSliderProps, SlideItem as _SlideItem, SliderConfig as _SliderConfig } from './slider';
import type { AnimationConfig as _AnimationConfig } from './animation';
import type { GestureConfig as _GestureConfig } from './gestures';
// Commented out imports with errors
// import type { FocusTrapOptions as _FocusTrapOptions } from './accessibility';
// import type { FocusManagerProps as _FocusManagerProps } from './focus-management';
import type { SlideFormProps } from './form';

/**
 * Props for the fallback render function
 * @example
 * ```tsx
 * const fallbackComponent = ({ error, resetErrorBoundary }) => (
 *   <div>Error: {error.message} <button onClick={resetErrorBoundary}>Try again</button></div>
 * );
 * ```
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
 * @example
 * ```tsx
 * <ErrorBoundary 
 *   fallback={<FallbackComponent />}
 *   onError={(error) => logError(error)}
 * >
 *   <ComponentThatMightError />
 * </ErrorBoundary>
 * ```
 */
export interface ErrorBoundaryProps {
  /** Child components to render */
  children: React.ReactNode;
  /** Optional fallback UI to render when an error occurs */
  fallback?: React.ReactNode | ((error: Error, resetErrorBoundary: () => void) => React.ReactNode);
  /** Callback fired when an error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Skip showing the recovery UI in test environment for tests that need to see the error UI immediately */
  skipRecoveryUi?: boolean;
  /** Used in testing to avoid duplicate data-testid in nested error boundaries */
  nestLevel?: string;
}

/**
 * State for error boundary components
 * @example
 * ```tsx
 * this.state = {
 *   hasError: false,
 *   error: null,
 *   errorInfo: null,
 *   retryCount: 0
 * };
 * ```
 */
export interface ErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** The error that: occurred, if any */
  error: Error | null;
  /** Additional error information from React */
  errorInfo: React.ErrorInfo | null;
  /** Number of retry attempts made */
  retryCount: number;
}

/**
 * Props for Pixi-specific error boundary
 * @example
 * ```tsx
 * <PixiErrorBoundary
 *   fallback={<div>An error occurred in the Pixi component</div>}
 *   onError={(error) => sendErrorToAnalytics(error)}
 * >
 *   <PixiComponent />
 * </PixiErrorBoundary>
 * ```
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
 * @example
 * ```tsx
 * this.state = {
 *   hasError: true,
 *   error: new Error('Pixi.js initialization failed')
 * }
 * ```
 */
export interface PixiErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** The error that was caught, if any */
  error: Error | null;
}

/**
 * Props for the base slider component
 * 
 * @example
 * ```tsx
 * <BaseSlider 
 *   slides={[{id: '1', content: <div>Slide 1</div>}]}
 *   slideWidth={300}
 *   slideHeight={200}
 * />
 * ```
 */
export interface BaseSliderProps {
  // ... existing code ...
}

// Re-export component props
export type { SlideFormProps };
