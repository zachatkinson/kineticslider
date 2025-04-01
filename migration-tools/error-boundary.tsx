import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FeatureFlag, getFeatureFlag } from './feature-flags';
import { MigrationErrorBoundaryProps, MigrationErrorBoundaryState } from '../src/types/migration';

export class FeatureErrorBoundary extends Component<MigrationErrorBoundaryProps, MigrationErrorBoundaryState> {
  public state: MigrationErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): MigrationErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Feature Error Boundary caught an error:', error, errorInfo);
    
    // Call the optional error handler
    this.props.onError?.(error, errorInfo);

    // If this error is associated with a feature flag, log it specially
    if (this.props.feature) {
      const isFeatureEnabled = getFeatureFlag(this.props.feature);
      console.error(
        `Error occurred in feature "${this.props.feature}" (enabled: ${isFeatureEnabled}):`,
        error
      );
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private renderDefaultFallback() {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Something went wrong
        </h3>
        <p className="text-sm text-red-600 mb-4">
          {this.state.error?.message || 'An unexpected error occurred'}
        </p>
        <button
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          onClick={this.handleRetry}
        >
          Try Again
        </button>
      </div>
    );
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || this.renderDefaultFallback();
    }

    return this.props.children;
  }
}

// Higher-order component for feature-specific error boundaries
export const withFeatureErrorBoundary = (
  WrappedComponent: React.ComponentType<any>,
  feature: FeatureFlag,
  fallback?: ReactNode
) => {
  return function WithErrorBoundary(props: any) {
    return (
      <FeatureErrorBoundary feature={feature} fallback={fallback}>
        <WrappedComponent {...props} />
      </FeatureErrorBoundary>
    );
  };
};

// Example usage:
/*
// As a component wrapper
<FeatureErrorBoundary feature={FeatureFlag.NEW_ANIMATION_SYSTEM}>
  <AnimationComponent />
</FeatureErrorBoundary>

// As a HOC
const SafeAnimationComponent = withFeatureErrorBoundary(
  AnimationComponent,
  FeatureFlag.NEW_ANIMATION_SYSTEM
);
*/

export class MigrationErrorBoundary extends Component<MigrationErrorBoundaryProps, MigrationErrorBoundaryState> {
  public state: MigrationErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): MigrationErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Migration Error Boundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong.</div>;
    }

    return this.props.children;
  }
} 