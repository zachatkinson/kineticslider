/* eslint-env vitest */
import { fireEvent, render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import React from 'react';
import { act } from 'react';

import { useKeyboard } from '../../hooks/useKeyboard';

describe('useKeyboard Hook', () => {
  let mockElement: HTMLDivElement;

  beforeEach(() => {
    // Create a mock element for testing
    mockElement = document.createElement('div');
    document.body.appendChild(mockElement);
  });

  afterEach(() => {
    // Clean up
    if (mockElement && mockElement.parentNode) {
      mockElement.parentNode.removeChild(mockElement);
    }
    vi.restoreAllMocks();
  });

  it('should initialize without errors', () => {
    const { result } = renderHook(() => useKeyboard());

    expect(result.current.attachToElement).toBeDefined();
    expect(result.current.focusElement).toBeDefined();
    expect(result.current.trapFocus).toBeDefined();
    expect(result.current.releaseFocus).toBeDefined();
  });

  it('should handle key events', () => {
    const onLeft = vi.fn();
    const onRight = vi.fn();

    const { result } = renderHook(() =>
      useKeyboard({
        onLeft,
        onRight,
      })
    );

    // Attach to mock element
    act(() => {
      result.current.attachToElement(mockElement);
    });

    // Simulate key press
    act(() => {
      const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      mockElement.dispatchEvent(leftEvent);
    });

    expect(onLeft).toHaveBeenCalledTimes(1);

    // Simulate another key press
    act(() => {
      const rightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      mockElement.dispatchEvent(rightEvent);
    });

    expect(onRight).toHaveBeenCalledTimes(1);
  });

  it('should focus an element', () => {
    const { result } = renderHook(() => useKeyboard());

    // Create a button to focus
    const button = document.createElement('button');
    document.body.appendChild(button);

    // Mock focus method
    const focusSpy = vi.spyOn(button, 'focus');

    // Focus the element
    act(() => {
      result.current.focusElement(button);
    });

    expect(focusSpy).toHaveBeenCalledTimes(1);

    // Clean up
    document.body.removeChild(button);
  });

  it('should trap and release focus', () => {
    const { result } = renderHook(() => useKeyboard());

    // Create a container with focusable elements
    const container = document.createElement('div');
    const button1 = document.createElement('button');
    const button2 = document.createElement('button');
    const button3 = document.createElement('button');

    container.appendChild(button1);
    container.appendChild(button2);
    container.appendChild(button3);
    document.body.appendChild(container);

    // Mock focus methods
    const focusSpy1 = vi.spyOn(button1, 'focus');

    // Trap focus
    act(() => {
      result.current.trapFocus(container);
    });

    // First focusable element should be focused
    expect(focusSpy1).toHaveBeenCalledTimes(1);

    // Release focus
    act(() => {
      result.current.releaseFocus();
    });

    // Clean up
    document.body.removeChild(container);
  });

  it('should handle tab key in trapped focus', () => {
    // Create a custom test component with the hook
    const TestComponent = (): JSX.Element => {
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
    const button1 = getByTestId('button1');
    const button2 = getByTestId('button2');

    // Focus the first button
    act(() => {
      button1.focus();
    });
    expect(document.activeElement).toBe(button1);

    // Mock focus methods for verification
    const focusSpy1 = vi.spyOn(button1, 'focus');
    const focusSpy2 = vi.spyOn(button2, 'focus');

    // Simulate Tab+Shift on the first button which should move focus to the last button
    fireEvent.keyDown(button1, { key: 'Tab', shiftKey: true, bubbles: true });

    // Check if focus moved to the last button
    expect(focusSpy2).toHaveBeenCalled();
    // Verify that the first button's focus wasn't called again
    expect(focusSpy1).not.toHaveBeenCalled();
  });

  it('should detach event listeners when component unmounts', () => {
    const removeEventListenerSpy = vi.spyOn(mockElement, 'removeEventListener');

    const { result, unmount } = renderHook(() => useKeyboard());

    // Attach to mock element
    act(() => {
      result.current.attachToElement(mockElement);
    });

    // Unmount component
    unmount();

    // Event listener should be removed
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    );
  });
});
