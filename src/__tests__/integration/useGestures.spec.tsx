import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGestures } from '../../hooks/useGestures';

// Helper to create pointer events with proper structure
const createPointerEvent = (type: string, options: {
  clientX: number;
  clientY: number;
  pointerId?: number;
}) => {
  const mockTarget = {
    setPointerCapture: vi.fn(),
    releasePointerCapture: vi.fn(),
  } as unknown as Element;

  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
  }) as PointerEvent;

  Object.defineProperties(event, {
    clientX: { value: options.clientX },
    clientY: { value: options.clientY },
    pointerId: { value: options.pointerId || 1 },
    preventDefault: { value: vi.fn() },
    target: { value: mockTarget }
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
    vi.spyOn(element, 'addEventListener');
    vi.spyOn(element, 'removeEventListener');
  });

  afterEach(() => {
    cleanup?.();
    document.body.removeChild(element);
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Pointer Events', () => {
    it('handles pointer swipe gestures', () => {
      const { result } = renderHook(() =>
        useGestures({ onSwipe, onDrag, threshold: 50 })
      );
      cleanup = result.current.attach(element);

      // Start pointer interaction
      const pointerDownEvent = createPointerEvent('pointerdown', { clientX: 0, clientY: 0 });
      element.dispatchEvent(pointerDownEvent);
      expect(pointerDownEvent.preventDefault).toHaveBeenCalled();
      expect((pointerDownEvent.target as Element).setPointerCapture).toHaveBeenCalledWith(1);

      // Move pointer
      const pointerMoveEvent = createPointerEvent('pointermove', { clientX: 100, clientY: 0 });
      element.dispatchEvent(pointerMoveEvent);
      expect(pointerMoveEvent.preventDefault).toHaveBeenCalled();
      expect(onDrag).toHaveBeenCalledWith(100);

      // End pointer interaction
      const pointerUpEvent = createPointerEvent('pointerup', { clientX: 100, clientY: 0 });
      element.dispatchEvent(pointerUpEvent);
      expect(pointerUpEvent.preventDefault).toHaveBeenCalled();
      expect((pointerUpEvent.target as Element).releasePointerCapture).toHaveBeenCalledWith(1);
      expect(onSwipe).toHaveBeenCalledWith('right', expect.any(Number));
    });

    it('handles pointer drag events', () => {
      const { result } = renderHook(() =>
        useGestures({ onSwipe, onDrag, threshold: 50 })
      );
      cleanup = result.current.attach(element);

      // Start pointer interaction
      const pointerDownEvent = createPointerEvent('pointerdown', { clientX: 0, clientY: 0 });
      element.dispatchEvent(pointerDownEvent);
      expect((pointerDownEvent.target as Element).setPointerCapture).toHaveBeenCalledWith(1);

      // Multiple small move events that shouldn't trigger swipe
      const positions = [10, 20, 30];
      positions.forEach(pos => {
        const pointerMoveEvent = createPointerEvent('pointermove', { clientX: pos, clientY: 0 });
        element.dispatchEvent(pointerMoveEvent);
        expect(onDrag).toHaveBeenCalledWith(pos);
      });

      // End pointer interaction without exceeding threshold
      const pointerUpEvent = createPointerEvent('pointerup', { clientX: 30, clientY: 0 });
      element.dispatchEvent(pointerUpEvent);
      expect((pointerUpEvent.target as Element).releasePointerCapture).toHaveBeenCalledWith(1);
      expect(onSwipe).not.toHaveBeenCalled(); // Should not trigger swipe for small movements
    });

    it('handles pointer cancellation', () => {
      const { result } = renderHook(() =>
        useGestures({ onSwipe, onDrag, threshold: 50 })
      );
      cleanup = result.current.attach(element);

      // Start pointer interaction
      const pointerDownEvent = createPointerEvent('pointerdown', { clientX: 0, clientY: 0 });
      element.dispatchEvent(pointerDownEvent);

      // Cancel pointer interaction
      const pointerCancelEvent = createPointerEvent('pointercancel', { clientX: 50, clientY: 0 });
      element.dispatchEvent(pointerCancelEvent);
      expect((pointerCancelEvent.target as Element).releasePointerCapture).toHaveBeenCalledWith(1);

      // Move after cancel should not trigger drag
      const pointerMoveEvent = createPointerEvent('pointermove', { clientX: 100, clientY: 0 });
      element.dispatchEvent(pointerMoveEvent);
      expect(onDrag).not.toHaveBeenCalled();
    });
  });

  describe('Event Cleanup', () => {
    it('removes event listeners and styles on cleanup', () => {
      const { result } = renderHook(() =>
        useGestures({ onSwipe, onDrag })
      );

      const cleanupFn = result.current.attach(element);
      
      cleanupFn();

      expect(element.removeEventListener).toHaveBeenCalledWith('pointerdown', expect.any(Function));
      expect(element.removeEventListener).toHaveBeenCalledWith('pointermove', expect.any(Function));
      expect(element.removeEventListener).toHaveBeenCalledWith('pointerup', expect.any(Function));
      expect(element.removeEventListener).toHaveBeenCalledWith('pointercancel', expect.any(Function));
      
      expect(element.style.touchAction).toBe('');
      expect(element.style.userSelect).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('handles invalid pointer events gracefully', async () => {
      const { result } = renderHook(() => useGestures({
        onSwipe,
        onDrag,
      }));

      const cleanup = result.current.attach(element);

      await act(async () => {
        const invalidPointerEvent = createPointerEvent('pointermove', { clientX: 0, clientY: 0 });
        element.dispatchEvent(invalidPointerEvent);
      });

      expect(onDrag).not.toHaveBeenCalled();
      cleanup();
    });
  });
}); 