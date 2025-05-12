import React, { Component, ErrorInfo, ReactNode } from "react";
import type { PixiErrorBoundaryState } from "../../types/components";

/**
 * Props for Pixi-specific error boundary
 *
 * @example
 * ```tsx
 * const props: PixiErrorBoundaryProps = {
 *   children: <PixiComponent />,
 *   fallback: <ErrorFallback />,
 *   onError: (error, errorInfo) => console.error(error, errorInfo)
 * };
 * ```
 */
export interface PixiErrorBoundaryProps {
  /** Child components to render */
  children: React.ReactNode;
  /** Fallback UI to render when an error occurs */
  fallback?: React.ReactNode;
  /** Callback fired when an error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Error boundary component specifically designed for Pixi.js related errors in the slider.
 * Catches and handles runtime errors in Pixi.js components and their children.
 *
 * @example
 * ```tsx
 * <PixiErrorBoundary
 *   fallback={<CustomErrorComponent />}
 *   onError={(error, errorInfo) => console.error(error, errorInfo)}
 * >
 *   <PixiSlider slides={slides} />
 * </PixiErrorBoundary>
 * ```
 *
 * @property
 * - children: ReactNode - The Pixi.js components to be rendered
 * - fallback?: ReactNode - Optional custom error UI component
 * - onError?: (error: Error, errorInfo: ErrorInfo) => void - Optional error handler
 *
 * @description * - Uses role="alert" for error messages
 * - Provides clear error messaging
 * - Includes instructions for user recovery
 * - Shows detailed error info in development mode
 *
 * @description * - Catches and handles Pixi.js specific runtime errors
 * - Prevents entire app from crashing
 * - Provides fallback UI
 * - Supports custom error handling
 *
 * @description * - Sanitizes error messages in production
 * - Only shows detailed error info in development
 * - Prevents exposure of sensitive stack traces
 *
 * @description * - Lightweight error boundary implementation
 * - Minimal impact on normal operation
 * - Efficient error state management
 *
 * @see PixiSlider - Main component this error boundary protects
 * @see SliderError - Custom error type used for Pixi.js errors
 */
export class PixiErrorBoundary extends Component<
  PixiErrorBoundaryProps,
  PixiErrorBoundaryState
> {
  /**
   * Initial state of the error boundary.
   *
   * @type {PixiErrorBoundaryState}
   */
  public override state: PixiErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  /**
   * Static method to derive error state from caught errors.
   * Called when an error occurs during rendering.
   *
   * @param {Error} error - The error that was caught
   *
   * @returns {PixiErrorBoundaryState} New state with error information
   *
   */
  public static getDerivedStateFromError(error: Error): PixiErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Lifecycle method called after an error has been caught.
   * Handles error logging and custom error callbacks.
   *
   * @param {Error} error - The error that was caught
   *
   * @param {ErrorInfo} errorInfo - Additional information about the error
   *
   */
  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development mode
    if (process.env.NODE_ENV !== "production") {
      console.error("PixiSlider Error:", error, errorInfo);
    }

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo);
  }

  /**
   * Renders either the error UI or the children components.
   * Provides a fallback UI when an error occurs.
   *
   * @returns {ReactNode} The rendered content
   *
   */
  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          style={{
            padding: "20px",
            margin: "10px",
            border: "1px solid #ff0000",
            borderRadius: "4px",
            backgroundColor: "#fff8f8",
          }}
        >
          <h2>Something went wrong with the image slider.</h2>
          <p>
            Please try refreshing the page or contact support if the issue
            persists.
          </p>
          {process.env["NODE_ENV"] === "development" && (
            <details>
              <summary>Error Details</summary>
              <pre>{this.state.error?.toString()}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
