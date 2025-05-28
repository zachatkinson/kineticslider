import { vi } from "vitest";
import type { KeyboardOptions } from "@/types/keyboard";
import { createConsoleMocks } from "@/__tests__/mocks";

// Declare all mock variables and the escapeCallback at the top
const mockTrapFocus = vi.fn();
const mockReleaseFocus = vi.fn();
let escapeCallback: (() => void) | undefined;

// Place vi.mock at the very top, before any imports from the module being mocked
vi.mock("@/hooks/useKeyboard", () => ({
  useKeyboard: vi.fn((options: KeyboardOptions | undefined) => {
    escapeCallback = options?.onEscape;
    return {
      trapFocus: mockTrapFocus,
      releaseFocus: mockReleaseFocus,
    };
  }),
}));

// Now import the rest
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { FocusManager } from "@/components/FocusManager";

describe("FocusManager Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    escapeCallback = undefined;
  });

  afterEach(() => {
    // Cleanup any elements added to the body
    document.body.innerHTML = "";
  });

  it("renders children correctly", () => {
    render(
      <FocusManager>
        <div data-testid="child">Child Content</div>
      </FocusManager>,
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toHaveTextContent("Child Content");
  });

  it("applies focus-manager class to the container", () => {
    const { container } = render(
      <FocusManager>
        <div>Content</div>
      </FocusManager>,
    );

    expect(container.firstChild).toHaveClass("focus-manager");
  });

  it("does not trap focus by default", () => {
    render(
      <FocusManager>
        <div>Content</div>
      </FocusManager>,
    );

    expect(mockTrapFocus).not.toHaveBeenCalled();
  });

  it("traps focus when trapFocus is true", () => {
    render(
      <FocusManager trapFocus={true}>
        <div>Content</div>
      </FocusManager>,
    );

    expect(mockTrapFocus).toHaveBeenCalled();
  });

  it("calls onEscape when escape key is pressed", () => {
    const mockOnEscape = vi.fn();

    render(
      <FocusManager
        trapFocus={true}
        escapeDeactivates={true}
        onEscape={mockOnEscape}
      >
        <div>Content</div>
      </FocusManager>,
    );

    // Use escapeCallback from the inline mock
    if (escapeCallback) {
      escapeCallback();
    }

    expect(mockOnEscape).toHaveBeenCalled();
  });

  it("calls onActivate and onDeactivate callbacks when focus trap is activated", () => {
    // Test lines 112-113: onActivate and onDeactivate callback execution
    const mockOnActivate = vi.fn();
    const mockOnDeactivate = vi.fn();

    render(
      <FocusManager
        trapFocus={true}
        onActivate={mockOnActivate}
        onDeactivate={mockOnDeactivate}
      >
        <div>Content</div>
      </FocusManager>,
    );

    // Verify that the mock was called with options including our callbacks
    expect(mockTrapFocus).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        onActivate: mockOnActivate,
        onDeactivate: mockOnDeactivate,
      })
    );
  });

  it("handles focus restoration with returnFocusTo as string selector", () => {
    // Test lines 139-164: Focus restoration logic for string selector
    const targetButton = document.createElement("button");
    targetButton.id = "target-button";
    targetButton.focus = vi.fn();
    document.body.appendChild(targetButton);

    const { unmount } = render(
      <FocusManager
        trapFocus={false}
        returnFocusTo="#target-button"
        restoreFocus={true}
      >
        <div>Content</div>
      </FocusManager>,
    );

    // Trigger unmount to test focus restoration
    unmount();

    expect(targetButton.focus).toHaveBeenCalled();
  });

  it("handles focus restoration with returnFocusTo as HTMLElement", () => {
    // Test lines 139-164: Focus restoration logic for HTMLElement
    const targetButton = document.createElement("button");
    targetButton.focus = vi.fn();
    document.body.appendChild(targetButton);

    const { unmount } = render(
      <FocusManager
        trapFocus={false}
        returnFocusTo={targetButton}
        restoreFocus={true}
      >
        <div>Content</div>
      </FocusManager>,
    );

    // Trigger unmount to test focus restoration
    unmount();

    expect(targetButton.focus).toHaveBeenCalled();
  });

  it("handles focus restoration with returnFocusTo as function", () => {
    // Test lines 139-164: Focus restoration logic for function
    const targetButton = document.createElement("button");
    targetButton.focus = vi.fn();
    document.body.appendChild(targetButton);

    const returnFocusFunction = vi.fn().mockReturnValue(targetButton);

    const { unmount } = render(
      <FocusManager
        trapFocus={false}
        returnFocusTo={returnFocusFunction}
        restoreFocus={true}
      >
        <div>Content</div>
      </FocusManager>,
    );

    // Trigger unmount to test focus restoration
    unmount();

    expect(returnFocusFunction).toHaveBeenCalled();
    expect(targetButton.focus).toHaveBeenCalled();
  });

  it("handles focus restoration failure gracefully", () => {
    // Test lines 139-164: Error handling in focus restoration
    const consoleMocks = createConsoleMocks();
    
    const faultyElement = {
      focus: vi.fn().mockImplementation(() => {
        throw new Error("Focus failed");
      })
    };

    const { unmount } = render(
      <FocusManager
        trapFocus={false}
        returnFocusTo={() => faultyElement as any}
        restoreFocus={true}
      >
        <div>Content</div>
      </FocusManager>,
    );

    // Trigger unmount to test error handling
    unmount();

    expect(consoleMocks.spies.warn).toHaveBeenCalledWith("Failed to restore focus:", expect.any(Error));
    
    consoleMocks.restore();
  });

  it("sets initialFocus option when provided", () => {
    // Test lines 112-113: Setting initialFocus option
    const mockInitialFocus = "#initial-focus-element";

    render(
      <FocusManager
        trapFocus={true}
        initialFocus={mockInitialFocus}
      >
        <div>Content</div>
      </FocusManager>,
    );

    // Verify that the mock was called with options including initialFocus
    expect(mockTrapFocus).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        initialFocus: mockInitialFocus,
      })
    );
  });
});
