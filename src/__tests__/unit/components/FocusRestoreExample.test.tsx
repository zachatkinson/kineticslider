import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { FocusRestoreExample } from "@/components/FocusRestoreExample";
import { FocusManager } from "@/components/FocusManager";

// Create a mockCloseHandler that we can trigger in tests
let mockEscapeHandler: (() => void) | undefined;

// Mock FocusManager component since we've already tested it separately
vi.mock("@/components/FocusManager", () => ({
  FocusManager: vi.fn(
    ({
      children,
      onEscape,
      trapFocus,
    }: {
      children: React.ReactNode;
      onEscape?: () => void;
      trapFocus?: boolean;
      [key: string]: any;
    }) => {
      // Store onEscape callback for later use in tests
      if (trapFocus && onEscape && typeof onEscape === "function") {
        mockEscapeHandler = onEscape;
      }
      return <div data-testid="focus-manager">{children}</div>;
    },
  ),
}));

// Mock useKeyboard hook which is used by FocusManager
vi.mock("@/hooks/useKeyboard", () => ({
  useKeyboard: vi.fn(() => ({
    trapFocus: vi.fn(),
    releaseFocus: vi.fn(),
  })),
}));

describe("FocusRestoreExample Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEscapeHandler = undefined;
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders with initial closed state", () => {
    render(<FocusRestoreExample />);

    // Header should be visible
    expect(screen.getByText("Focus Management Example")).toBeInTheDocument();

    // Open button should be visible
    expect(screen.getByText("Open Modal")).toBeInTheDocument();

    // Modal content should not be visible initially
    expect(screen.queryByText("Focus Trapped Modal")).not.toBeInTheDocument();
  });

  it("opens modal when button is clicked", () => {
    render(<FocusRestoreExample />);

    // Click the Open Modal button
    fireEvent.click(screen.getByText("Open Modal"));

    // Modal content should now be visible
    expect(screen.getByText("Focus Trapped Modal")).toBeInTheDocument();
    expect(screen.getByTestId("focus-manager")).toBeInTheDocument();
  });

  it("closes modal when Close button is clicked", () => {
    render(<FocusRestoreExample />);

    // Open the modal
    fireEvent.click(screen.getByText("Open Modal"));

    // Verify modal is open
    expect(screen.getByText("Focus Trapped Modal")).toBeInTheDocument();

    // Click the Close Modal button
    fireEvent.click(screen.getByText("Close Modal"));

    // Modal should now be closed
    expect(screen.queryByText("Focus Trapped Modal")).not.toBeInTheDocument();
  });

  it("closes modal when escape key is pressed", async () => {
    render(<FocusRestoreExample />);

    // Open the modal
    fireEvent.click(screen.getByText("Open Modal"));

    // Verify modal is open
    expect(screen.getByText("Focus Trapped Modal")).toBeInTheDocument();

    // Trigger the escape handler that was passed to FocusManager
    if (mockEscapeHandler) {
      act(() => {
        mockEscapeHandler!();
      });
    }

    // Modal should now be closed
    expect(screen.queryByText("Focus Trapped Modal")).not.toBeInTheDocument();
  });

  it("passes correct props to FocusManager", () => {
    render(<FocusRestoreExample />);

    // Open the modal
    fireEvent.click(screen.getByText("Open Modal"));

    // Check that FocusManager was called with expected props
    const focusManagerCalls = vi.mocked(FocusManager).mock.calls;
    expect(focusManagerCalls.length).toBeGreaterThan(0);

    const lastCallProps = focusManagerCalls[focusManagerCalls.length - 1][0];
    expect(lastCallProps.trapFocus).toBe(true);
    expect(lastCallProps.autoFocus).toBe(true);
    expect(lastCallProps.escapeDeactivates).toBe(true);
    expect(lastCallProps.returnFocusTo).toBe("#open-modal-button");
    expect(lastCallProps.trapOptions).toEqual(
      expect.objectContaining({
        fallbackFocus: "#first-button",
      }),
    );
  });
});
