import {
  SliderState as _SliderState,
  SliderConfig as _SliderConfig,
} from "../types/slider";
import {
  GestureDirection as _GestureDirection,
  GestureDelta as _GestureDelta,
} from "../types/gesture";
import { SlideStyleOptions, SlideStyle } from "../types/styles";

/**
 * Calculates the style for a slide based on its index and slider state
 *
 * @param options Configuration options for style calculation
 *
 * @returns Style object for the slide
 *
 */
export const getSlideStyle = (options: SlideStyleOptions): SlideStyle => {
  const { index, state, config } = options;
  const isActive = index === state.currentIndex;
  const isPrev = index === state.currentIndex - 1;

  let transform = "translateX(100%)";
  if (isActive) transform = "translateX(0)";
  if (isPrev) transform = "translateX(-100%)";

  if (state.isDragging) {
    const delta =
      config.direction === "horizontal" ? state.dragDelta.x : state.dragDelta.y;
    transform = `translateX(calc(${isActive ? "0" : "100"}% + ${delta}px))`;
  }

  return {
    transform,
    transition: state.isAnimating
      ? `transform ${config.animation.duration}ms ${config.animation.easing}`
      : "none",
  };
};
