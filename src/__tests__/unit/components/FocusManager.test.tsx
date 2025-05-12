import { vi } from "vitest";
import type { KeyboardOptions } from "@/types/keyboard";

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
});
