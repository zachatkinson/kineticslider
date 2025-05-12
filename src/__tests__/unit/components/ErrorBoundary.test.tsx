import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { ErrorBoundary, withErrorBoundary } from "@/components/ErrorBoundary";

// Track these mocks outside the mock definition so we can access them
const trackEventMock = vi.fn();
const trackErrorMock = vi.fn();

// Mock AnalyticsManager
vi.mock("@/utils/analytics", () => {
  return {
    AnalyticsManager: {
      getInstance: () => ({
        trackEvent: trackEventMock,
        trackError: trackErrorMock,
      }),
    },
  };
});

// Component that throws an error when mounted
const ErrorThrowingComponent = ({
  shouldThrow = true,
  errorType = "standard",
}: {
  shouldThrow?: boolean;
  errorType?: "standard" | "type" | "custom";
}): React.ReactElement => {
  if (shouldThrow) {
    switch (errorType) {
      case "type":
        throw new TypeError("Test type error");
      case "custom":
        class CustomError extends Error {
          constructor(message: string) {
            super(message);
            this.name = "CustomError";
          }
        }
        throw new CustomError("Custom test error");
      default:
        throw new Error("Test error");
    }
  }
  return <div>No error thrown</div>;
};

describe("ErrorBoundary Component", () => {
  // Silence console errors during tests
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {
      return;
    });
    vi.spyOn(console, "warn").mockImplementation(() => {
      return;
    });

    // Reset mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children when no error is thrown", () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Child component</div>
      </ErrorBoundary>,
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders default fallback when an error is thrown", () => {
    // Using act to suppress error about component errors not being caught in error boundary
    const originalConsoleError = console.error;
    console.error = vi.fn();

    // We need to suppress the error React throws as it's expected
    render(
      <ErrorBoundary skipRecoveryUi>
        <ErrorThrowingComponent />
      </ErrorBoundary>,
    );

    // Reset console.error
    console.error = originalConsoleError;

    // Verify fallback is rendered
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("calls onError prop when an error is thrown", () => {
    const onErrorMock = vi.fn();
    const originalConsoleError = console.error;
    console.error = vi.fn();

    render(
      <ErrorBoundary onError={onErrorMock}>
        <ErrorThrowingComponent />
      </ErrorBoundary>,
    );

    console.error = originalConsoleError;

    // Verify onError was called
    expect(onErrorMock).toHaveBeenCalledTimes(1);
    expect(onErrorMock.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onErrorMock.mock.calls[0][0].message).toBe("Test error");
    expect(onErrorMock.mock.calls[0][1]).toHaveProperty("componentStack");
  });

  it("tracks error in analytics when an error is thrown", () => {
    const originalConsoleError = console.error;
    console.error = vi.fn();

    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>,
    );

    console.error = originalConsoleError;

    // Verify analytics tracking
    expect(trackErrorMock).toHaveBeenCalledTimes(1);
    expect(trackErrorMock.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(trackErrorMock.mock.calls[0][0].message).toBe("Test error");
    expect(trackErrorMock.mock.calls[0][1]).toHaveProperty("componentStack");
  });

  it("renders custom fallback component when provided", () => {
    const CustomFallback = (): React.ReactElement => (
      <div data-testid="custom-fallback">Custom fallback</div>
    );
    const originalConsoleError = console.error;
    console.error = vi.fn();

    render(
      <ErrorBoundary fallback={<CustomFallback />} skipRecoveryUi>
        <ErrorThrowingComponent />
      </ErrorBoundary>,
    );

    console.error = originalConsoleError;

    // Verify custom fallback is rendered
    expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
  });

  it("renders custom fallback function when provided", () => {
    const fallbackFn = (
      error: Error,
      retry: () => void,
    ): React.ReactElement => (
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
      <ErrorBoundary fallback={fallbackFn} skipRecoveryUi>
        <ErrorThrowingComponent />
      </ErrorBoundary>,
    );

    console.error = originalConsoleError;

    // Verify custom fallback function is rendered with the correct props
    expect(screen.getByTestId("custom-error")).toBeInTheDocument();
    expect(screen.getByText("Custom Error: Test error")).toBeInTheDocument();
    expect(screen.getByTestId("custom-retry")).toBeInTheDocument();
  });

  it("retries rendering on retry button click", () => {
    const originalConsoleError = console.error;
    console.error = vi.fn();

    // Create a simple recoverable component
    let shouldRecover = false;

    const RecoverableComponent = (): React.ReactElement => {
      if (!shouldRecover) {
        throw new Error("Test error that should recover");
      }
      return <div data-testid="recovered">Component has recovered</div>;
    };

    render(
      <ErrorBoundary skipRecoveryUi>
        <RecoverableComponent />
      </ErrorBoundary>,
    );

    // Error should be caught and fallback rendered
    expect(screen.getByRole("alert")).toBeInTheDocument();

    // Set recovery flag
    shouldRecover = true;

    // Click retry button
    const retryButton = screen.getByRole("button", { name: "Retry" });
    fireEvent.click(retryButton);

    // Component should now be recovered
    expect(screen.getByTestId("recovered")).toBeInTheDocument();

    console.error = originalConsoleError;
  });

  it("withErrorBoundary HOC wraps component with error boundary", () => {
    const originalConsoleError = console.error;
    console.error = vi.fn();

    const WrappedComponent = withErrorBoundary(ErrorThrowingComponent, {
      fallback: <div data-testid="hoc-fallback">HOC Fallback</div>,
      skipRecoveryUi: true,
    });

    render(<WrappedComponent />);

    // Verify HOC fallback is rendered
    expect(screen.getByTestId("hoc-fallback")).toBeInTheDocument();

    console.error = originalConsoleError;
  });

  it("supports nested error boundaries with proper isolation", () => {
    const originalConsoleError = console.error;
    console.error = vi.fn();

    // Component that always throws an error
    const AlwaysErrorComponent = (): React.ReactElement => {
      throw new Error("Nested boundary test error");
    };

    render(
      <ErrorBoundary
        fallback={<div data-testid="outer-fallback">Outer Fallback</div>}
        nestLevel="outer"
      >
        <div data-testid="outer-content">Outer Content</div>
        <ErrorBoundary
          fallback={<div data-testid="inner-fallback">Inner Fallback</div>}
          skipRecoveryUi
          nestLevel="inner"
        >
          <AlwaysErrorComponent />
        </ErrorBoundary>
      </ErrorBoundary>,
    );

    // Inner boundary should catch the error
    expect(screen.getByTestId("inner-fallback")).toBeInTheDocument();

    // Outer content should still be visible
    expect(screen.getByTestId("outer-content")).toBeInTheDocument();

    // Outer fallback should not be shown
    expect(screen.queryByTestId("outer-fallback")).not.toBeInTheDocument();

    console.error = originalConsoleError;
  });
});
