import { vi } from "vitest";
import { createBrandedNumber } from "@/utils/branded-helpers";
import type { Slide } from "@/types/slider";

// Mock functions that can be accessed and reset
export const mockFunctions = {
  trapFocus: vi.fn(),
  releaseFocus: vi.fn(),
  next: vi.fn(),
  prev: vi.fn(),
  goToSlide: vi.fn(),
  handleGesture: vi.fn(),
  onSlideChange: vi.fn(),
  onAnimationComplete: vi.fn(),
};

// Basic mock implementation for simple tests
export const createBasicKineticSliderMock = (slides: Slide[]): any => ({
  currentSlide: 0,
  isAnimating: false,
  slides,
  next: mockFunctions.next,
  prev: mockFunctions.prev,
  goToSlide: mockFunctions.goToSlide,
  handleGesture: mockFunctions.handleGesture,
  trapFocus: mockFunctions.trapFocus,
  releaseFocus: mockFunctions.releaseFocus,
  sliderRef: { current: document.createElement("div") },
  metrics: {
    sliderWidth: 1000,
    slideWidth: 800,
    slideCount: slides.length,
    currentX: 0,
  },
});

// Mock implementation with animation and callbacks
export const createAnimatedKineticSliderMock = (
  onSlideChange?: (index: any) => void,
  onAnimationComplete?: () => void,
): any => {
  let currentIndex = 0;

  return {
    currentSlide: currentIndex,
    isAnimating: false,
    slides: [
      {
        id: "slide-1",
        title: "First Slide",
        image: "/images/slide1.jpg",
        alt: "First slide description",
      },
      {
        id: "slide-2",
        title: "Second Slide",
        image: "/images/slide2.jpg",
        alt: "Second slide description",
      },
      {
        id: "slide-3",
        title: "Third Slide",
        image: "/images/slide3.jpg",
        alt: "Third slide description",
      },
    ],
    next: () => {
      mockFunctions.next();
      currentIndex = Math.min(currentIndex + 1, 2);
      setTimeout(() => {
        onSlideChange?.(createBrandedNumber(currentIndex, "SlideIndex"));
        setTimeout(() => {
          onAnimationComplete?.();
        }, 10);
      }, 10);
    },
    prev: () => {
      mockFunctions.prev();
      currentIndex = Math.max(currentIndex - 1, 0);
      setTimeout(() => {
        onSlideChange?.(createBrandedNumber(currentIndex, "SlideIndex"));
        setTimeout(() => {
          onAnimationComplete?.();
        }, 10);
      }, 10);
    },
    goToSlide: mockFunctions.goToSlide,
    handleGesture: mockFunctions.handleGesture,
    trapFocus: mockFunctions.trapFocus,
    releaseFocus: mockFunctions.releaseFocus,
    sliderRef: { current: document.createElement("div") },
    metrics: {
      sliderWidth: 1000,
      slideWidth: 800,
      slideCount: 3,
      currentX: 0,
    },
  };
};

// Mock implementation for Home/End key tests
export const createHomeEndKineticSliderMock = (): any => ({
  currentSlide: 1, // Middle slide
  isAnimating: false,
  slides: [
    {
      id: "slide-1",
      title: "First Slide",
      image: "/images/slide1.jpg",
      alt: "First slide description",
    },
    {
      id: "slide-2",
      title: "Second Slide",
      image: "/images/slide2.jpg",
      alt: "Second slide description",
    },
    {
      id: "slide-3",
      title: "Third Slide",
      image: "/images/slide3.jpg",
      alt: "Third slide description",
    },
  ],
  next: mockFunctions.next,
  prev: mockFunctions.prev,
  goToSlide: (index: number) => {
    mockFunctions.goToSlide(index);
  },
  handleGesture: mockFunctions.handleGesture,
  trapFocus: mockFunctions.trapFocus,
  releaseFocus: mockFunctions.releaseFocus,
  sliderRef: { current: document.createElement("div") },
  metrics: {
    sliderWidth: 1000,
    slideWidth: 800,
    slideCount: 3,
    currentX: 0,
  },
});

// Main mock function that can be used with vi.mock
export const useKineticSliderMock = vi.fn();

// Reset function
/**
 *
 */
export function resetKineticSliderMocks(): void {
  useKineticSliderMock.mockReset();
  Object.values(mockFunctions).forEach((mock) => mock.mockClear());
}
