import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGestures } from '../../hooks/useGestures';

// Helper to create touch events with proper structure
const createTouchEvent = (type: string, touches: Array<{ clientX: number; clientY: number }>) => {
  const touchList = touches.map(t => ({
    clientX: t.clientX,
    clientY: t.clientY,
    identifier: 0,
    target: document.createElement('div'),
    screenX: t.clientX,
    screenY: t.clientY,
    pageX: t.clientX,
    pageY: t.clientY,
    radiusX: 1,
    radiusY: 1,
    rotationAngle: 0,
    force: 1,
  }));

  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
  }) as TouchEvent;

  // Mock the touch lists
  Object.defineProperties(event, {
    touches: {
      value: touchList,
      configurable: true
    },
    targetTouches: {
      value: touchList,
      configurable: true
    },
    changedTouches: {
      value: touchList,
      configurable: true
    },
    preventDefault: {
      value: vi.fn(),
      configurable: true
    }
  });

  return event;
};

describe('useGestures', () => {
  let element: HTMLDivElement;
  let onSwipe: ReturnType<typeof vi.fn>;
  let onDrag: ReturnType<typeof vi.fn>;
  let cleanup: () => void;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
    onSwipe = vi.fn();
    onDrag = vi.fn();
    vi.useFakeTimers();
    // Spy on removeEventListener for both element and document
    vi.spyOn(element, 'removeEventListener');
    vi.spyOn(document, 'removeEventListener');
  });

  afterEach(() => {
    cleanup?.();
    document.body.removeChild(element);
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Touch Events', () => {
    it('handles touch swipe gestures', () => {
      const { result } = renderHook(() =>
        useGestures({ onSwipe: onSwipe, onDrag: onDrag, threshold: 50 })
      );
      cleanup = result.current.attach(element);

      // Start touch
      const touchStartEvent = createTouchEvent('touchstart', [{ clientX: 0, clientY: 0 }]);
      Object.defineProperty(touchStartEvent, 'preventDefault', { value: vi.fn() });
      element.dispatchEvent(touchStartEvent);
      expect(touchStartEvent.preventDefault).toHaveBeenCalled();

      // Move touch
      const touchMoveEvent = createTouchEvent('touchmove', [{ clientX: 100, clientY: 0 }]);
      Object.defineProperty(touchMoveEvent, 'preventDefault', { value: vi.fn() });
      element.dispatchEvent(touchMoveEvent);
      expect(touchMoveEvent.preventDefault).toHaveBeenCalled();
      expect(onDrag).toHaveBeenCalledWith(100);

      // End touch
      const touchEndEvent = createTouchEvent('touchend', [{ clientX: 100, clientY: 0 }]);
      Object.defineProperty(touchEndEvent, 'preventDefault', { value: vi.fn() });
      element.dispatchEvent(touchEndEvent);
      expect(touchEndEvent.preventDefault).toHaveBeenCalled();
      expect(onSwipe).toHaveBeenCalledWith('right', 100);
    });

    it('handles touch drag events', () => {
      const { result } = renderHook(() =>
        useGestures({ onSwipe: onSwipe, onDrag: onDrag, threshold: 50 })
      );
      cleanup = result.current.attach(element);

      // Start touch
      const touchStartEvent = createTouchEvent('touchstart', [{ clientX: 0, clientY: 0 }]);
      element.dispatchEvent(touchStartEvent);
      expect(touchStartEvent.preventDefault).toHaveBeenCalled();

      // Multiple small move events that shouldn't trigger swipe
      const positions = [10, 20, 30];
      positions.forEach(pos => {
        const touchMoveEvent = createTouchEvent('touchmove', [{ clientX: pos, clientY: 0 }]);
        element.dispatchEvent(touchMoveEvent);
        expect(touchMoveEvent.preventDefault).toHaveBeenCalled();
        expect(onDrag).toHaveBeenCalledWith(pos);
      });

      // End touch without exceeding threshold
      const touchEndEvent = createTouchEvent('touchend', [{ clientX: 30, clientY: 0 }]);
      element.dispatchEvent(touchEndEvent);
      expect(touchEndEvent.preventDefault).toHaveBeenCalled();
      expect(onSwipe).not.toHaveBeenCalled(); // Should not trigger swipe for small movements
    });
  });

  describe('Mouse Events', () => {
    it('handles mouse drag gestures', async () => {
      const { result } = renderHook(() => useGestures({
        onSwipe: onSwipe,
        onDrag: onDrag,
        threshold: 50,
      }));

      const cleanup = result.current.attach(element);

      await act(async () => {
        const mouseDownEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          clientX: 100,
          clientY: 50,
          button: 0,
        });
        element.dispatchEvent(mouseDownEvent);

        const mouseMoveEvent = new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          clientX: 200,
          clientY: 50,
          buttons: 1,
        });
        element.dispatchEvent(mouseMoveEvent);

        const mouseUpEvent = new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          button: 0,
        });
        element.dispatchEvent(mouseUpEvent);
      });

      expect(onSwipe).toHaveBeenCalledWith('right', expect.any(Number));
      cleanup();
    });

    it('handles mouse drag events', async () => {
      const { result } = renderHook(() => useGestures({
        onSwipe: onSwipe,
        onDrag: onDrag,
        threshold: 50,
      }));

      const cleanup = result.current.attach(element);

      await act(async () => {
        const mouseDownEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          clientX: 100,
          clientY: 50,
          button: 0,
        });
        element.dispatchEvent(mouseDownEvent);

        const mouseMoveEvent = new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          clientX: 120,
          clientY: 50,
          buttons: 1,
        });
        element.dispatchEvent(mouseMoveEvent);
      });

      expect(onDrag).toHaveBeenCalledWith(expect.any(Number));
      cleanup();
    });
  });

  describe('Event Cleanup', () => {
    it('removes event listeners on unmount', () => {
      const { result } = renderHook(() =>
        useGestures({ onSwipe: onSwipe, onDrag: onDrag })
      );

      const cleanupFn = result.current.attach(element);
      
      // Call the cleanup function directly instead of unmounting
      cleanupFn();

      // Verify element event listeners
      expect(element.removeEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
      expect(element.removeEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function));
      expect(element.removeEventListener).toHaveBeenCalledWith('touchend', expect.any(Function));
      expect(element.removeEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));

      // Verify document event listeners
      expect(document.removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(document.removeEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
    });
  });

  describe('Error Handling', () => {
    it('handles invalid touch events gracefully', async () => {
      const { result } = renderHook(() => useGestures({
        onSwipe: onSwipe,
        onDrag: onDrag,
      }));

      const cleanup = result.current.attach(element);

      await act(async () => {
        const invalidTouchEvent = new TouchEvent('touchmove', {
          bubbles: true,
          cancelable: true,
          touches: [],
        });
        element.dispatchEvent(invalidTouchEvent);
      });

      expect(onDrag).not.toHaveBeenCalled();
      cleanup();
    });

    it('prevents default on touch events to avoid scrolling', async () => {
      const { result } = renderHook(() => useGestures({
        onSwipe: onSwipe,
        onDrag: onDrag,
      }));

      const cleanup = result.current.attach(element);

      const preventDefault = vi.fn();
      const touchStartEvent = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [new Touch({
          identifier: 1,
          target: element,
          clientX: 100,
          clientY: 50,
        })],
      });
      Object.defineProperty(touchStartEvent, 'preventDefault', {
        value: preventDefault,
        configurable: true,
      });

      await act(async () => {
        element.dispatchEvent(touchStartEvent);
      });

      expect(preventDefault).toHaveBeenCalled();
      cleanup();
    });
  });
}); 