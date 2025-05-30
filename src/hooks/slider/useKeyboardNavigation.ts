import React from "react";
import { useCallback } from "react";
import { useSlider } from "../../context/SliderContext";
import { createBrandedNumber } from "../../utils/branded-helpers";
import type { KeyboardNavigationHook } from "../../types/hooks";

/**
 *
 * @returns {unknown} The function return value
 *
 */
export function useKeyboardNavigation(): KeyboardNavigationHook {
  const { state, items, actions } = useSlider();

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (state.isAnimating) return;

      switch (event.key) {
        case "ArrowLeft":
        case "ArrowUp":
          event.preventDefault();
          actions.previous();
          break;
        case "ArrowRight":
        case "ArrowDown":
          event.preventDefault();
          actions.next();
          break;
        case "Home":
          event.preventDefault();
          actions.goTo(createBrandedNumber(0, "SlideIndex"));
          break;
        case "End":
          event.preventDefault();
          actions.goTo(createBrandedNumber(items.length - 1, "SlideIndex"));
          break;
        default:
          break;
      }
    },
    [state.isAnimating, items.length, actions],
  );

  return { handleKeyDown };
}
