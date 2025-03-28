import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  SliderErrorInfo,
  SliderErrorType,
  WindowWithAnalytics,
} from '../types';

interface ErrorBoundaryProps {
  children: ReactNode;
  className?: string;
  onError?: (error: Error, errorInfo: SliderErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: SliderErrorInfo | null;
  retryCount: number;
}

/**
 * Error boundary component for handling slider-specific errors
 * Implements circuit breaker pattern with retry mechanism
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private readonly MAX_RETRIES = 3;
  private errorLog: Array<{ error: Error; info: SliderErrorInfo }> = [];

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const sliderErrorInfo: SliderErrorInfo = {
      ...errorInfo,
      errorType: this.determineErrorType(error),
      additionalData: this.gatherAdditionalData(),
      componentStack: errorInfo.componentStack || undefined,
    };

    // Log error with additional context
    console.error('KineticSlider Error:', {
      error,
      errorInfo: sliderErrorInfo,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // Store error for analysis
    this.errorLog.push({ error, info: sliderErrorInfo });

    // Update state with error info
    this.setState({ errorInfo: sliderErrorInfo });

    // Report error to error tracking service if available
    this.reportError(error, sliderErrorInfo);

    // Call onError prop if provided
    this.props.onError?.(error, sliderErrorInfo);
  }

  /**
   * Determines the type of error that occurred
   */
  private determineErrorType(error: Error): SliderErrorType {
    if (error.message.includes('validation')) {
      return SliderErrorType.VALIDATION;
    } else if (error.message.includes('animation')) {
      return SliderErrorType.ANIMATION;
    } else if (error.message.includes('gesture')) {
      return SliderErrorType.GESTURE;
    } else if (error.message.includes('memory')) {
      return SliderErrorType.MEMORY;
    }
    return SliderErrorType.RENDER;
  }

  /**
   * Gathers additional context data for error reporting
   */
  private gatherAdditionalData(): Record<string, unknown> {
    return {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      memoryUsage: performance?.memory?.usedJSHeapSize ?? 0,
      errorCount: this.errorLog.length,
      retryCount: this.state.retryCount,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      url: window.location.href,
    };
  }

  /**
   * Reports error to error tracking service
   */
  private reportError(error: Error, errorInfo: SliderErrorInfo): void {
    if (typeof window !== 'undefined' && 'errorTracker' in window) {
      (window as unknown as WindowWithAnalytics).errorTracker?.captureError(error, {
        ...errorInfo,
        component: 'KineticSlider',
        errorLog: this.errorLog,
      });
    }
  }

  /**
   * Attempts to recover from error with exponential backoff
   */
  private handleRetry = async (): Promise<void> => {
    const newRetryCount = this.state.retryCount + 1;
    const backoffTime = Math.min(1000 * Math.pow(2, newRetryCount - 1), 5000);

    if (newRetryCount <= this.MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: newRetryCount,
      });
    } else {
      this.setState({
        errorInfo: {
          ...this.state.errorInfo!,
          additionalData: {
            ...this.state.errorInfo?.additionalData,
            maxRetriesExceeded: true,
          },
        },
      });
    }
  };

  /**
   * Resets the error boundary state
   */
  private handleReset = (): void => {
    this.errorLog = [];
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  override render(): ReactNode {
    const { hasError, error, errorInfo, retryCount } = this.state;
    const { className } = this.props;

    if (hasError) {
      const errorType = errorInfo?.errorType || SliderErrorType.RENDER;
      const maxRetriesExceeded = retryCount >= this.MAX_RETRIES;

      return (
        <div
          role="alert"
          className={`kinetic-slider-error ${className || ''}`}
          style={{
            padding: '1rem',
            color: 'red',
            border: '1px solid red',
            borderRadius: '4px',
            margin: '1rem',
          }}
        >
          <h2>Something went wrong with the slider</h2>
          <p>{error?.message}</p>
          {errorType !== SliderErrorType.VALIDATION && (
            <p>Error type: {errorType}</p>
          )}
          {maxRetriesExceeded ? (
            <>
              <p>Maximum retry attempts exceeded. Please refresh the page.</p>
              <button
                onClick={() => window.location.reload()}
                className="kinetic-slider-error-button"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#fff',
                  border: '1px solid red',
                  borderRadius: '4px',
                  color: 'red',
                  cursor: 'pointer',
                  marginRight: '0.5rem',
                }}
              >
                Refresh Page
              </button>
            </>
          ) : (
            <>
              <p>
                Retry attempt {retryCount + 1} of {this.MAX_RETRIES}
              </p>
              <button
                onClick={this.handleRetry}
                className="kinetic-slider-error-button"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#fff',
                  border: '1px solid red',
                  borderRadius: '4px',
                  color: 'red',
                  cursor: 'pointer',
                  marginRight: '0.5rem',
                }}
              >
                Try Again
              </button>
              <button
                onClick={this.handleReset}
                className="kinetic-slider-error-button"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#fff',
                  border: '1px solid red',
                  borderRadius: '4px',
                  color: 'red',
                  cursor: 'pointer',
                }}
              >
                Reset
              </button>
            </>
          )}
          {process.env['NODE_ENV'] === 'development' && (
            <pre style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
              {errorInfo?.componentStack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
} 