import { useCallback, useRef } from 'react';

interface UseGesturesOptions {
  enabled?: boolean;
  onSwipe?: (direction: 'left' | 'right', distance: number) => void;
  onDrag?: (distance: number) => void;
  threshold?: number;
}

interface UseGesturesResult {
  attach: (element: HTMLElement) => () => void;
}

interface TouchPoint {
  x: number;
  y: number;
}

export const useGestures = ({
  enabled = true,
  onSwipe,
  onDrag,
  threshold = 50
}: UseGesturesOptions): UseGesturesResult => {
  const touchStart = useRef<TouchPoint>({ x: 0, y: 0 });
  const touchEnd = useRef<TouchPoint>({ x: 0, y: 0 });
  const isDragging = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault();
    if (e.touches[0]) {
      touchStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
      touchEnd.current = { ...touchStart.current };
      isDragging.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    if (e.touches[0] && isDragging.current) {
      touchEnd.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
      const distance = touchEnd.current.x - touchStart.current.x;
      onDrag?.(distance);
    }
  }, [onDrag]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault();
    if (!enabled || !isDragging.current) return;

    const distanceX = touchEnd.current.x - touchStart.current.x;
    const distanceY = touchEnd.current.y - touchStart.current.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontalSwipe && Math.abs(distanceX) > threshold) {
      onSwipe?.(distanceX > 0 ? 'right' : 'left', Math.abs(distanceX));
    }

    isDragging.current = false;
  }, [enabled, threshold, onSwipe]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    touchStart.current = {
      x: e.clientX,
      y: e.clientY
    };
    touchEnd.current = { ...touchStart.current };
    isDragging.current = true;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging.current) {
      touchEnd.current = {
        x: e.clientX,
        y: e.clientY
      };
      const distance = touchEnd.current.x - touchStart.current.x;
      onDrag?.(distance);
    }
  }, [onDrag]);

  const handleMouseUp = useCallback(() => {
    if (!enabled || !isDragging.current) return;

    const distanceX = touchEnd.current.x - touchStart.current.x;
    const distanceY = touchEnd.current.y - touchStart.current.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontalSwipe && Math.abs(distanceX) > threshold) {
      onSwipe?.(distanceX > 0 ? 'right' : 'left', Math.abs(distanceX));
    }

    isDragging.current = false;
  }, [enabled, threshold, onSwipe]);

  const attach = useCallback((element: HTMLElement) => {
    if (!enabled) return () => {};

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    element.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown, handleMouseMove, handleMouseUp]);

  return { attach };
}; 