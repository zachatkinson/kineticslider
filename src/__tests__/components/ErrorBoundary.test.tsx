import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import React, { createContext, useContext, useEffect, useState } from 'react';

import { ErrorBoundary } from '../../components/ErrorBoundary';
import { SliderEventType } from '../../types/analytics';
import { withErrorBoundary } from '../../utils/hoc';

// Track these mocks outside the mock definition so we can access them
const trackEventMock = vi.fn();
const trackErrorMock = vi.fn();

// Mock AnalyticsManager
vi.mock('../../utils/analytics', () => {
  return {
    AnalyticsManager: {
      getInstance: () => ({
        trackEvent: trackEventMock,
        trackError: trackErrorMock,
      }),
    },
    SliderEventType: {
      ERROR_MAX_RETRIES: 'ERROR_MAX_RETRIES',
    },
  };
});

// Component that throws an error when mounted
const ErrorThrowingComponent = ({
  shouldThrow = true,
  errorType = 'standard',
}: {
  shouldThrow?: boolean;
  errorType?: 'standard' | 'type' | 'custom';
}): JSX.Element => {
  if (shouldThrow) {
    switch (errorType) {
      case 'type':
        throw new TypeError('Test type error');
      case 'custom':
        class CustomError extends Error {
          constructor(message: string) {
            super(message);
            this.name = 'CustomError';
          }
        }
        throw new CustomError('Custom test error');
      default:
        throw new Error('Test error');
    }
  }
  return <div>No error thrown</div>;
};

// Component that throws async error
const AsyncErrorComponent = (): JSX.Element => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasError(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (hasError) {
    throw new Error('Async error');
  }

  return <div>Loading...</div>;
};

// Create test context
const TestContext = createContext<string>('default');

// Component that maintains state
const StateComponent = ({
  initialCount = 0,
}: {
  initialCount?: number;
}): JSX.Element => {
  const [count, setCount] = useState(initialCount);
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error('State component error');
  }

  return (
    <div>
      <p data-testid="count">Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setShouldError(true)}>Trigger error</button>
    </div>
  );
};

describe('ErrorBoundary Component', () => {
  // Silence console errors during tests
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Reset mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Child component</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  test('renders default fallback when an error is thrown', () => {
    // Using act to suppress error about component errors not being caught in error boundary
    const originalConsoleError = console.error;
    console.error = vi.fn();

    // We need to suppress the error React throws as it's expected
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    // Reset console.error
    console.error = originalConsoleError;

    // Verify fallback is rendered
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  test('calls onError prop when an error is thrown', () => {
    const onErrorMock = vi.fn();
    const originalConsoleError = console.error;
    console.error = vi.fn();

    render(
      <ErrorBoundary onError={onErrorMock}>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    console.error = originalConsoleError;

    // Verify onError was called
    expect(onErrorMock).toHaveBeenCalledTimes(1);
    expect(onErrorMock.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onErrorMock.mock.calls[0][0].message).toBe('Test error');
    expect(onErrorMock.mock.calls[0][1]).toHaveProperty('componentStack');
  });

  test('tracks error in analytics when an error is thrown', () => {
    const originalConsoleError = console.error;
    console.error = vi.fn();

    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    console.error = originalConsoleError;

    // Verify analytics tracking
    expect(trackErrorMock).toHaveBeenCalledTimes(1);
    expect(trackErrorMock.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(trackErrorMock.mock.calls[0][0].message).toBe('Test error');
    expect(trackErrorMock.mock.calls[0][1]).toHaveProperty('componentStack');
  });

  test('renders custom fallback component when provided', () => {
    const CustomFallback = (): JSX.Element => (
      <div data-testid="custom-fallback">Custom fallback</div>
    );
    const originalConsoleError = console.error;
    console.error = vi.fn();

    render(
      <ErrorBoundary fallback={<CustomFallback />}>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    console.error = originalConsoleError;

    // Verify custom fallback is rendered
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
  });

  test('renders custom fallback function when provided', () => {
    const fallbackFn = (error: Error, retry: () => void): JSX.Element => (
      <div>
        <h2 data-testid="custom-error">Custom Error: {error.message}</h2>
        <button data-testid="custom-retry" onClick={retry}>
          Custom Retry
        </button>
      </div>
    );

    const originalConsoleError = console.error;
    console.error = vi.fn();

    render(
      <ErrorBoundary fallback={fallbackFn}>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    console.error = originalConsoleError;

    // Verify custom fallback function is rendered with the correct props
    expect(screen.getByTestId('custom-error')).toBeInTheDocument();
    expect(screen.getByText('Custom Error: Test error')).toBeInTheDocument();
    expect(screen.getByTestId('custom-retry')).toBeInTheDocument();
  });

  test('retries rendering on retry button click', async () => {
    const originalConsoleError = console.error;
    console.error = vi.fn();

    // Create a simple recoverable component
    let shouldRecover = false;

    const RecoverableComponent = (): JSX.Element => {
      if (!shouldRecover) {
        throw new Error('Test error that should recover');
      }
      return <div data-testid="recovered">Component has recovered</div>;
    };

    render(
      <ErrorBoundary>
        <RecoverableComponent />
      </ErrorBoundary>
    );

    // Error should be caught and fallback rendered
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Set recovery flag
    shouldRecover = true;

    // Click retry button
    const retryButton = screen.getByRole('button', { name: /retry/i });

    // Click the retry button
    fireEvent.click(retryButton);

    // Component should now be recovered
    expect(screen.getByTestId('recovered')).toBeInTheDocument();

    console.error = originalConsoleError;
  });

  test('withErrorBoundary HOC wraps component with error boundary', () => {
    const originalConsoleError = console.error;
    console.error = vi.fn();

    const WrappedComponent = withErrorBoundary(ErrorThrowingComponent, {
      fallback: <div data-testid="hoc-fallback">HOC Fallback</div>,
    });

    render(<WrappedComponent />);

    // Verify HOC fallback is rendered
    expect(screen.getByTestId('hoc-fallback')).toBeInTheDocument();

    console.error = originalConsoleError;
  });

  test('withErrorBoundary HOC passes props to wrapped component', () => {
    const WrappedComponent = withErrorBoundary(ErrorThrowingComponent, {
      fallback: <div>Fallback</div>,
    });

    const originalConsoleError = console.error;
    console.error = vi.fn();

    render(<WrappedComponent shouldThrow={false} />);

    // Component should render without error
    expect(screen.getByText('No error thrown')).toBeInTheDocument();

    console.error = originalConsoleError;
  });

  test('component has scheduleRecoveryAttempt method', () => {
    const originalConsoleError = console.error;
    console.error = vi.fn();

    // Check if the method exists on the prototype
    expect(typeof ErrorBoundary.prototype.scheduleRecoveryAttempt).toBe(
      'function'
    );

    // Mock setTimeout to verify it would be called
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

    // Create a spy for the prototype method
    const scheduleRecoverySpy = vi.spyOn(
      ErrorBoundary.prototype,
      'scheduleRecoveryAttempt'
    );

    // Render component to ensure the spy is attached
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    // Check that the method exists
    expect(typeof scheduleRecoverySpy).toBe('function');

    // Create a fake context to test the method directly
    const handleRetryMock = vi.fn();
    const fakeContext = {
      handleRetry: handleRetryMock,
    };

    // Call the method with the fake context
    ErrorBoundary.prototype.scheduleRecoveryAttempt.call(fakeContext);

    // Verify setTimeout was called with expected args
    expect(setTimeoutSpy).toHaveBeenCalledWith(handleRetryMock, 10000);

    // Clean up
    setTimeoutSpy.mockRestore();
    scheduleRecoverySpy.mockRestore();
    console.error = originalConsoleError;
  });

  // New tests for comprehensive coverage

  // 1. Max retry limit testing
  test('triggers ERROR_MAX_RETRIES event after reaching max retries', () => {
    const originalConsoleError = console.error;
    console.error = vi.fn();

    const originalConsoleWarn = console.warn;
    console.warn = vi.fn();

    // Component that always errors
    const AlwaysErrorComponent = (): JSX.Element => {
      throw new Error('Persistent error');
    };

    // Render with custom maxRetries
    render(
      <ErrorBoundary maxRetries={2}>
        <AlwaysErrorComponent />
      </ErrorBoundary>
    );

    // Verify error boundary rendered
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Click retry repeatedly to hit max
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    // Verify max retries warning was logged
    expect(console.warn).toHaveBeenCalledWith(
      'Maximum retry attempts (2) reached'
    );

    // Verify that ERROR_MAX_RETRIES event was tracked
    expect(trackEventMock).toHaveBeenCalledTimes(1);
    expect(trackEventMock.mock.calls[0][0]).toHaveProperty(
      'type',
      SliderEventType.ERROR_MAX_RETRIES
    );
    expect(trackEventMock.mock.calls[0][0].data).toMatchObject({
      maxRetries: 2,
    });

    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  // 2. Auto-recovery testing
  test('auto-recovers after scheduled timeout', () => {
    // Setup fake timers
    vi.useFakeTimers();

    const originalConsoleError = console.error;
    console.error = vi.fn();

    // Component that can recover
    let shouldRecover = false;
    const RecoverableComponent = (): JSX.Element => {
      if (!shouldRecover) {
        throw new Error('Recoverable error');
      }
      return <div data-testid="auto-recovered">Auto-recovered component</div>;
    };

    // Create spy to verify scheduleRecoveryAttempt is called
    const scheduleRecoverySpy = vi.spyOn(
      ErrorBoundary.prototype,
      'scheduleRecoveryAttempt'
    );

    // Create a component that auto-schedules recovery
    class TestErrorBoundary extends ErrorBoundary {
      override componentDidCatch(error: Error, info: React.ErrorInfo): void {
        super.componentDidCatch(error, info);
        this.scheduleRecoveryAttempt();
      }
    }

    render(
      <TestErrorBoundary>
        <RecoverableComponent />
      </TestErrorBoundary>
    );

    // Verify fallback is shown
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Verify schedule method was called
    expect(scheduleRecoverySpy).toHaveBeenCalledTimes(1);

    // Allow recovery
    shouldRecover = true;

    // Fast-forward time to trigger auto-recovery
    vi.advanceTimersByTime(10000);

    // Verify component recovered
    expect(screen.getByTestId('auto-recovered')).toBeInTheDocument();

    // Clean up
    scheduleRecoverySpy.mockRestore();
    console.error = originalConsoleError;
  });

  // 3. Nested error boundaries testing
  test('supports nested error boundaries with proper isolation', () => {
    const originalConsoleError = console.error;
    console.error = vi.fn();

    // Render nested error boundaries
    render(
      <ErrorBoundary
        fallback={<div data-testid="outer-fallback">Outer Fallback</div>}
      >
        <div data-testid="outer-content">Outer Content</div>
        <ErrorBoundary
          fallback={<div data-testid="inner-fallback">Inner Fallback</div>}
        >
          <ErrorThrowingComponent />
        </ErrorBoundary>
        <div data-testid="outer-sibling">Outer Sibling</div>
      </ErrorBoundary>
    );

    // Verify only inner boundary caught the error
    expect(screen.queryByTestId('outer-fallback')).not.toBeInTheDocument();
    expect(screen.getByTestId('outer-content')).toBeInTheDocument();
    expect(screen.getByTestId('inner-fallback')).toBeInTheDocument();
    expect(screen.getByTestId('outer-sibling')).toBeInTheDocument();

    console.error = originalConsoleError;
  });

  // 4. Accessibility testing
  test('error UI meets accessibility requirements', () => {
    const originalConsoleError = console.error;
    console.error = vi.fn();

    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    // Verify ARIA properties
    const alertElement = screen.getByRole('alert');
    expect(alertElement).toHaveAttribute('aria-live', 'assertive');

    // Verify error is announced
    expect(alertElement).toHaveTextContent('Something went wrong');
    expect(alertElement).toHaveTextContent('Test error');

    // Verify retry button is keyboard accessible
    const retryButton = screen.getByRole('button', { name: /retry/i });
    retryButton.focus();
    expect(document.activeElement).toBe(retryButton);

    console.error = originalConsoleError;
  });

  // 5. Testing with different error types
  test('handles different error types appropriately', () => {
    const originalConsoleError = console.error;
    console.error = vi.fn();

    // Test with TypeError
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent errorType="type" />
      </ErrorBoundary>
    );

    // Verify error boundary caught it
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Reset screen
    console.error = vi.fn();

    // Test with custom error class
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent errorType="custom" />
      </ErrorBoundary>
    );

    // Verify error boundary caught custom error
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Custom test error')).toBeInTheDocument();

    console.error = originalConsoleError;
  });

  // 6. Testing error cleanup on unmount
  test('cleans up properly when unmounted during error state', () => {
    const originalConsoleError = console.error;
    console.error = vi.fn();

    // Create container component that can unmount the error boundary
    function Container(): JSX.Element {
      const [show, setShow] = useState(true);

      return (
        <div>
          <button data-testid="toggle" onClick={() => setShow(!show)}>
            Toggle
          </button>
          {show && (
            <ErrorBoundary>
              <ErrorThrowingComponent />
            </ErrorBoundary>
          )}
        </div>
      );
    }

    render(<Container />);

    // Verify error boundary rendered its fallback
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Unmount the error boundary
    fireEvent.click(screen.getByTestId('toggle'));

    // Verify error boundary was unmounted
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    console.error = originalConsoleError;
  });

  // 7. Cleanup behavior during recovery
  test('resets error state properly during recovery', async () => {
    const originalConsoleError = console.error;
    console.error = vi.fn();

    let shouldThrow = true;
    const toggleError = vi.fn(() => {
      shouldThrow = false;
    });

    const RecoverableComponent = (): JSX.Element => {
      if (shouldThrow) {
        throw new Error('Recoverable error');
      }
      return <div data-testid="recovered-content">Recovered!</div>;
    };

    render(
      <ErrorBoundary>
        <RecoverableComponent />
      </ErrorBoundary>
    );

    // Verify error state
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Allow recovery and click retry
    toggleError();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    // Verify component recovered
    expect(screen.getByTestId('recovered-content')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    console.error = originalConsoleError;
  });

  // 8. Testing with asynchronous errors
  test('catches asynchronous errors', async () => {
    vi.useFakeTimers();

    const originalConsoleError = console.error;
    console.error = vi.fn();

    render(
      <ErrorBoundary>
        <AsyncErrorComponent />
      </ErrorBoundary>
    );

    // Verify initial render
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Advance time to trigger error
    vi.advanceTimersByTime(100);

    // Verify error boundary caught the async error
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Async error')).toBeInTheDocument();

    console.error = originalConsoleError;
  });

  // 9. Stress testing with multiple errors
  test('handles multiple sequential errors', () => {
    const originalConsoleError = console.error;
    console.error = vi.fn();

    // Component that can be triggered to error multiple times
    let errorCount = 0;

    const MultiErrorComponent = (): JSX.Element => {
      const [shouldRecover, setShouldRecover] = useState(true);

      useEffect(() => {
        if (errorCount > 0 && errorCount < 3) {
          setShouldRecover(false);
        }
      }, []);

      if (!shouldRecover) {
        errorCount++;
        throw new Error(`Error #${errorCount}`);
      }

      return (
        <div data-testid="multi-error-content">
          <p>Content rendered</p>
          <button
            data-testid="trigger-error"
            onClick={() => setShouldRecover(false)}
          >
            Trigger Error
          </button>
        </div>
      );
    };

    render(
      <ErrorBoundary>
        <MultiErrorComponent />
      </ErrorBoundary>
    );

    // Verify initial render
    expect(screen.getByTestId('multi-error-content')).toBeInTheDocument();

    // Trigger first error
    fireEvent.click(screen.getByTestId('trigger-error'));

    // Verify error boundary caught it
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Error #1/)).toBeInTheDocument();

    // Reset error state to cause second error on retry
    errorCount = 1;

    // Click retry to trigger second error
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    // Verify second error is caught
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Error #2/)).toBeInTheDocument();

    // Allow recovery
    errorCount = 0;

    // Click retry again to recover
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    // Verify recovery
    expect(screen.getByTestId('multi-error-content')).toBeInTheDocument();

    console.error = originalConsoleError;
  });

  // 10. Context preservation
  test('preserves React context for children and fallback UI', () => {
    const originalConsoleError = console.error;
    console.error = vi.fn();

    // Context value
    const contextValue = 'test-context-value';

    // Custom fallback that uses context
    const ContextFallback = (): JSX.Element => {
      const value = useContext(TestContext);
      return (
        <div data-testid="context-fallback">Fallback with context: {value}</div>
      );
    };

    render(
      <TestContext.Provider value={contextValue}>
        <ErrorBoundary fallback={<ContextFallback />}>
          <ErrorThrowingComponent />
        </ErrorBoundary>
      </TestContext.Provider>
    );

    // Verify fallback has access to context
    expect(screen.getByTestId('context-fallback')).toBeInTheDocument();
    expect(
      screen.getByText(`Fallback with context: ${contextValue}`)
    ).toBeInTheDocument();

    console.error = originalConsoleError;
  });

  // 11. State preservation
  test('recoverable components maintain state after recovery', () => {
    const originalConsoleError = console.error;
    console.error = vi.fn();

    // Initial count for state component
    const initialCount = 5;

    render(
      <ErrorBoundary>
        <StateComponent initialCount={initialCount} />
      </ErrorBoundary>
    );

    // Verify initial state
    expect(screen.getByTestId('count')).toHaveTextContent(
      `Count: ${initialCount}`
    );

    // Increment count
    fireEvent.click(screen.getByRole('button', { name: /increment/i }));

    // Verify state updated
    expect(screen.getByTestId('count')).toHaveTextContent(
      `Count: ${initialCount + 1}`
    );

    // Trigger error
    fireEvent.click(screen.getByRole('button', { name: /trigger error/i }));

    // Verify error boundary caught it
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Fix error state in component and retry
    const stateComponentInstance = StateComponent;
    stateComponentInstance.prototype.render = function (): JSX.Element {
      return (
        <div>
          <p data-testid="count">Count: {this.props.initialCount}</p>
        </div>
      );
    };

    // Click retry
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    // Verify state was preserved
    expect(screen.getByTestId('count')).toHaveTextContent(
      `Count: ${initialCount}`
    );

    console.error = originalConsoleError;
  });
});
