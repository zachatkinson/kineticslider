import React, { Component, ErrorInfo, ReactNode } from 'react';
import type { PixiErrorBoundaryProps, PixiErrorBoundaryState } from '../../types/components';

export class PixiErrorBoundary extends Component<PixiErrorBoundaryProps, PixiErrorBoundaryState> {
  public override state: PixiErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): PixiErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PixiSlider Error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          style={{
            padding: '20px',
            margin: '10px',
            border: '1px solid #ff0000',
            borderRadius: '4px',
            backgroundColor: '#fff8f8',
          }}
        >
          <h2>Something went wrong with the image slider.</h2>
          <p>Please try refreshing the page or contact support if the issue persists.</p>
          {process.env['NODE_ENV'] === 'development' && (
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