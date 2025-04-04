import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FeatureFlag } from '../src/types/feature-flags';
import { MigrationErrorBoundaryProps, MigrationErrorBoundaryState } from '../src/types/migration';

/**
 * Error boundary component specifically designed for feature flag protected components.
 * Provides error handling with retry functionality and feature-specific error logging.
 * 
 * @example
 * ```tsx
 * <FeatureErrorBoundary feature="NEW_UI" onError={handleError}>
 *   <FeatureComponent />
 * </FeatureErrorBoundary>
 * ```
 */
export class FeatureErrorBoundary extends Component<MigrationErrorBoundaryProps, MigrationErrorBoundaryState> {
    /**
     * Initial state for the error boundary
     */
    public state: MigrationErrorBoundaryState = {
        hasError: false,
        error: null,
    };

    /**
     * Static lifecycle method to update state when an error occurs
     * 
     * @param error - The error that was thrown
     * @returns Updated state object with error information
     */
    public static getDerivedStateFromError(error: Error): MigrationErrorBoundaryState {
        return { hasError: true, error };
    }

    /**
     * Lifecycle method called when an error is caught
     * Handles error logging and calls the onError callback if provided
     * 
     * @param error - The error that was caught
     * @param errorInfo - Additional information about the error
     */
    public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('Feature Error Boundary caught an error:', error, errorInfo);
        this.props.onError?.(error, errorInfo);
        if (this.props.feature) {
            console.error(`Error occurred in feature "${this.props.feature}":`, error);
        }
    }

    /**
     * Handler for the retry button
     * Resets the error state to allow re-rendering of the children
     */
    private handleRetry = (): void => {
        this.setState({ hasError: false, error: null });
    };

    /**
     * Renders the default fallback UI when an error occurs
     * 
     * @returns React node with error information and retry button
     */
    private renderDefaultFallback(): React.ReactNode {
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

    /**
     * Renders either the error UI or the children components
     * 
     * @returns React node with either fallback UI or children
     */
    public render(): React.ReactNode {
        if (this.state.hasError) {
            return this.props.fallback || this.renderDefaultFallback();
        }
        return this.props.children;
    }
}

/**
 * Higher-order component that wraps a component with FeatureErrorBoundary
 * 
 * @param WrappedComponent - Component to wrap with error boundary
 * @param feature - Feature flag identifier
 * @param fallback - Optional custom fallback UI
 * @returns Wrapped component with error boundary
 * 
 * @example
 * ```tsx
 * const SafeFeatureComponent = withFeatureErrorBoundary(FeatureComponent, 'NEW_UI');
 * ```
 */
export const withFeatureErrorBoundary = (
    WrappedComponent: React.ComponentType<unknown>,
    feature: FeatureFlag,
    fallback?: ReactNode
): React.FC => {
    return function WithErrorBoundary(props: Record<string, unknown>): React.ReactElement {
        return (
            <FeatureErrorBoundary feature={feature} fallback={fallback}>
                <WrappedComponent {...props} />
            </FeatureErrorBoundary>
        );
    };
};

/**
 * Error boundary component specifically designed for migration components.
 * Provides basic error handling for components being migrated.
 * 
 * @example
 * ```tsx
 * <MigrationErrorBoundary onError={handleError}>
 *   <MigratedComponent />
 * </MigrationErrorBoundary>
 * ```
 */
export class MigrationErrorBoundary extends Component<MigrationErrorBoundaryProps, MigrationErrorBoundaryState> {
    /**
     * Initial state for the error boundary
     */
    public state: MigrationErrorBoundaryState = {
        hasError: false,
        error: null,
    };

    /**
     * Static lifecycle method to update state when an error occurs
     * 
     * @param error - The error that was thrown
     * @returns Updated state object with error information
     */
    public static getDerivedStateFromError(error: Error): MigrationErrorBoundaryState {
        return { hasError: true, error };
    }

    /**
     * Lifecycle method called when an error is caught
     * Handles error logging and calls the onError callback if provided
     * 
     * @param error - The error that was caught
     * @param errorInfo - Additional information about the error
     */
    public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('Migration Error Boundary caught an error:', error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }

    /**
     * Renders either the error UI or the children components
     * 
     * @returns React node with either fallback UI or children
     */
    public render(): React.ReactNode {
        if (this.state.hasError) {
            return this.props.fallback || <div>Something went wrong.</div>;
        }
        return this.props.children;
    }
}
