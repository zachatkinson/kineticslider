import { ErrorInfo as _ErrorInfo, ReactNode as _ReactNode } from "react";
import type {
  Slide as _Slide,
  KineticSliderProps as _KineticSliderProps,
  SlideItem as _SlideItem,
  SliderConfig as _SliderConfig,
} from "./slider";
import type { AnimationConfig as _AnimationConfig } from "./animation";
import type { GestureConfig as _GestureConfig } from "./gestures";
// Commented out imports with errors
// import type { FocusTrapOptions as _FocusTrapOptions } from './accessibility';
// import type { FocusManagerProps as _FocusManagerProps } from './focus-management';
import type { SlideFormProps } from "./form";

/**
 * Component-related type definitions
 *
 * This module contains type definitions for React components,
 * including props, state, and component-specific interfaces.
 *
 * @module Components
 * @version 1.0.0
 */

/**
 * Props for the fallback render function
 *
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
 * Error boundary component props
 *
 * @interface ErrorBoundaryProps
 * @example
 * ```typescript
 * const errorBoundaryProps: ErrorBoundaryProps = {
 *   children: <MyComponent />,
 *   fallback: (error, retry) => <ErrorFallback error={error} onRetry={retry} />,
 *   onError: (error, errorInfo) => console.error('Component error:', error),
 *   maxRetries: 3,
 *   skipRecoveryUi: false
 * };
 * ```
 */
export interface ErrorBoundaryProps {
  /**
   * The content to render normally (when no error occurs)
   */
  children: React.ReactNode;

  /**
   * Either a React element or a function that returns a React element
   * If a function, it will receive the error and a retry function as arguments
   */
  fallback?:
    | React.ReactNode
    | ((error: Error, retry: () => void) => React.ReactNode);

  /**
   * Callback fired when an error is caught
   */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;

  /**
   * Maximum number of automatic retry attempts
   *
   * @default 3
   */
  maxRetries?: number;

  /**
   * Skip the automatic recovery UI
   *
   * @default false
   */
  skipRecoveryUi?: boolean;

  /**
   * Used for testing to identify nested boundaries
   *
   * @internal
   */
  nestLevel?: string;
}

/**
 * Error boundary component state
 *
 * @interface ErrorBoundaryState
 * @example
 * ```typescript
 * const initialState: ErrorBoundaryState = {
 *   hasError: false,
 *   error: null,
 *   errorInfo: null,
 *   retryCount: 0
 * };
 * ```
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

/**
 * PIXI error boundary component props
 *
 * @interface PixiErrorBoundaryProps
 * @example
 * ```typescript
 * const pixiErrorBoundaryProps: PixiErrorBoundaryProps = {
 *   children: <PixiComponent />,
 *   onError: (error) => console.error('PIXI error:', error),
 *   fallback: <div>PIXI component failed to load</div>
 * };
 * ```
 */
export interface PixiErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  fallback?: React.ReactNode;
}

/**
 * PIXI error boundary component state
 *
 * @interface PixiErrorBoundaryState
 * @example
 * ```typescript
 * const initialState: PixiErrorBoundaryState = {
 *   hasError: false,
 *   error: null
 * };
 * ```
 */
export interface PixiErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Window interface extensions for testing utilities
 *
 * @interface WindowExtensions
 * @example
 * ```typescript
 * // Usage in tests
 * window.setErrorBoundaryRecovery?.(true);
 * window.shouldRecover = false;
 * ```
 */
export interface WindowExtensions {
  setErrorBoundaryRecovery?: (value: boolean) => void;
  shouldRecover?: boolean;
}

// Extend global Window interface
declare global {
  interface Window extends WindowExtensions {}
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
