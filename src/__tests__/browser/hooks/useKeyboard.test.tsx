import { fireEvent, render, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { useKeyboard } from "@/hooks/useKeyboard";

// This test is in the browser environment because it tests keyboard events and focus handling,
// which are better tested in a real browser environment

describe("useKeyboard Hook (Browser)", () => {
  let mockElement: HTMLDivElement;

  beforeEach(() => {
    // Create a mock element for testing
    mockElement = document.createElement("div");
    document.body.appendChild(mockElement);
  });

  afterEach(() => {
    // Clean up
    if (mockElement && mockElement.parentNode) {
      mockElement.parentNode.removeChild(mockElement);
    }
    vi.restoreAllMocks();
  });

  it("should initialize without errors", () => {
    const { result } = renderHook(() => useKeyboard());

    expect(result.current.trapFocus).toBeDefined();
    expect(result.current.releaseFocus).toBeDefined();
    expect(result.current.isFocusTrapped).toBeDefined();
  });

  it("should handle key events", async () => {
    const onLeft = vi.fn();
    const onRight = vi.fn();

    // Create a test component that uses the hook
    const TestComponent = (): React.ReactElement => {
      const { trapFocus } = useKeyboard({
        onLeft,
        onRight,
      });
      const divRef = React.useRef<HTMLDivElement>(null);

      React.useEffect(() => {
        if (divRef.current) {
          trapFocus(divRef.current);
        }
      }, [trapFocus]);

      return <div data-testid="test-container" ref={divRef} tabIndex={0} />;
    };

    // Render the component
    const { getByTestId } = render(<TestComponent />);
    const container = getByTestId("test-container");

    // Focus the container to ensure it receives keyboard events
    container.focus();

    // Use fireEvent to simulate keyDown events
    fireEvent.keyDown(container, { key: "ArrowLeft" });
    expect(onLeft).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(container, { key: "ArrowRight" });
    expect(onRight).toHaveBeenCalledTimes(1);
  });

  it("should trap and release focus", async () => {
    const { result } = renderHook(() => useKeyboard());

    // Create a container with focusable elements
    const container = document.createElement("div");
    const button1 = document.createElement("button");
    const button2 = document.createElement("button");
    const button3 = document.createElement("button");

    container.appendChild(button1);
    container.appendChild(button2);
    container.appendChild(button3);
    document.body.appendChild(container);

    // Mock focus methods
    const focusSpy1 = vi.spyOn(button1, "focus");

    // Trap focus
    result.current.trapFocus(container);

    // First focusable element should be focused
    expect(focusSpy1).toHaveBeenCalledTimes(1);

    // Release focus
    result.current.releaseFocus();

    // Clean up
    document.body.removeChild(container);
  });

  it("should handle tab key in trapped focus", async () => {
    // Create a custom test component with the hook
    const TestComponent = (): React.ReactElement => {
      const { trapFocus } = useKeyboard();
      const containerRef = React.useRef<HTMLDivElement>(null);

      React.useEffect(() => {
        if (containerRef.current) {
          trapFocus(containerRef.current);
        }
      }, [trapFocus]);

      return (
        <div ref={containerRef}>
          <button data-testid="button1">Button 1</button>
          <button data-testid="button2">Button 2</button>
        </div>
      );
    };

    // Render the test component
    const { getByTestId } = render(<TestComponent />);
    const button1 = getByTestId("button1");
    const button2 = getByTestId("button2");

    // Focus the first button
    button1.focus();
    expect(document.activeElement).toBe(button1);

    // Mock focus methods for verification
    const focusSpy1 = vi.spyOn(button1, "focus");
    const focusSpy2 = vi.spyOn(button2, "focus");

    // Simulate Tab+Shift on the first button which should move focus to the last button
    fireEvent.keyDown(button1, { key: "Tab", shiftKey: true, bubbles: true });

    // Check if focus moved to the last button
    expect(focusSpy2).toHaveBeenCalled();
    // Verify that the first button's focus wasn't called again
    expect(focusSpy1).not.toHaveBeenCalled();
  });

  it("should detach event listeners when component unmounts", async () => {
    const removeEventListenerSpy = vi.spyOn(mockElement, "removeEventListener");

    const { result, unmount } = renderHook(() => useKeyboard());

    // Attach to mock element using trapFocus
    result.current.trapFocus(mockElement);

    // Unmount component
    unmount();

    // Event listener should be removed
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function),
    );
  });
});
