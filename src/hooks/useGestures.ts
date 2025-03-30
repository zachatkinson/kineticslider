import { useCallback } from 'react';

import {
  GestureConfig,
  GestureOptions,
  SwipeDirection,
  UseGesturesReturn,
} from '@/types/gestures';

export const useGestures = (
  config: GestureConfig = { threshold: 50, minVelocity: 0.5 }
): UseGesturesReturn => {
  const attach = useCallback(
    (element: HTMLElement, options: GestureOptions) => {
      let startX = 0;
      let startY = 0;
      let isDragging = false;
      let startTime = 0;

      const handlePointerDown = (e: PointerEvent): void => {
        startX = e.clientX;
        startY = e.clientY;
        startTime = performance.now();
        isDragging = true;
        element.setPointerCapture(e.pointerId);
        e.preventDefault();
      };

      const handlePointerMove = (e: PointerEvent): void => {
        if (!isDragging) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        const deltaTime = (performance.now() - startTime) / 1000; // Convert to seconds
        const velocity = Math.abs(deltaX) / deltaTime;

        // Only handle horizontal swipes with sufficient velocity
        if (
          Math.abs(deltaX) > Math.abs(deltaY) &&
          Math.abs(deltaX) > config.threshold &&
          velocity > config.minVelocity
        ) {
          const direction: SwipeDirection = deltaX > 0 ? 'right' : 'left';
          options.onSwipe?.(direction);
          isDragging = false;
        }
      };

      const handlePointerUp = (e: PointerEvent): void => {
        if (isDragging) {
          element.releasePointerCapture(e.pointerId);
          isDragging = false;
        }
      };

      const handlePointerCancel = (e: PointerEvent): void => {
        if (isDragging) {
          element.releasePointerCapture(e.pointerId);
          isDragging = false;
        }
      };

      element.addEventListener('pointerdown', handlePointerDown);
      element.addEventListener('pointermove', handlePointerMove);
      element.addEventListener('pointerup', handlePointerUp);
      element.addEventListener('pointercancel', handlePointerCancel);

      return () => {
        element.removeEventListener('pointerdown', handlePointerDown);
        element.removeEventListener('pointermove', handlePointerMove);
        element.removeEventListener('pointerup', handlePointerUp);
        element.removeEventListener('pointercancel', handlePointerCancel);
      };
    },
    [config]
  );

  return { attach };
};
