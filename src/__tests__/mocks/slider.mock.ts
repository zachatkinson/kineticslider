import { vi } from "vitest";
import type { Slide } from "@/types/slider";

// Mock functions that can be accessed and reset
export const mockFunctions = {
  next: vi.fn(),
  previous: vi.fn(),
  goToSlide: vi.fn(),
  trackError: vi.fn(),
  onSlideChange: vi.fn(),
  onAnimationComplete: vi.fn(),
  onError: vi.fn(),
};

// Mock error tracking
export const useErrorTrackingMock = {
  trackError: (error: Error, type: string) => {
    mockFunctions.trackError(error, type);
  },
  ERROR_TYPES: {
    NAVIGATION: "navigation",
    ANIMATION: "animation",
    RENDER: "render",
  },
};

// Mock animation hooks
export const useSliderAnimationMock = {
  animateSlide: vi.fn(),
};

// Mock gesture handling
export const useGestureHandlingMock = {
  handleTouchStart: vi.fn(),
  handleTouchMove: vi.fn(),
  handleTouchEnd: vi.fn(),
  handleMouseDown: vi.fn(),
  handleMouseMove: vi.fn(),
  handleMouseUp: vi.fn(),
};

// Mock keyboard navigation
export const useKeyboardNavigationMock = {
  handleKeyDown: (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      mockFunctions.next();
    } else if (event.key === "ArrowLeft") {
      mockFunctions.previous();
    }
  },
};

// Mock slider context
/**
 * Creates a mock slider context for testing purposes.
 *
 * @param testSlides - Array of slides to use in the mock context
 *
 * @returns {Object} A mock slider context object
 *
 */
export const createSliderContextMock = (testSlides: Slide[]): {
  state: {
    currentIndex: number;
    isAnimating: boolean;
    isDragging: boolean;
    dragDelta: { x: number; y: number };
    infiniteLoop: boolean;
    items: Slide[];
  };
  config: Record<string, unknown>;
  items: Slide[];
  actions: {
    next: ReturnType<typeof vi.fn>;
    previous: ReturnType<typeof vi.fn>;
    goTo: ReturnType<typeof vi.fn>;
    startAutoplay: ReturnType<typeof vi.fn>;
    stopAutoplay: ReturnType<typeof vi.fn>;
    updateDragDelta: ReturnType<typeof vi.fn>;
  };
} => ({
  state: {
    currentIndex: 0,
    isAnimating: false,
    isDragging: false,
    dragDelta: { x: 0, y: 0 },
    infiniteLoop: true,
    items: testSlides,
  },
  config: {},
  items: testSlides,
  actions: {
    next: mockFunctions.next,
    previous: mockFunctions.previous,
    goTo: mockFunctions.goToSlide,
    startAutoplay: vi.fn(),
    stopAutoplay: vi.fn(),
    updateDragDelta: vi.fn(),
  },
});

// Reset all mocks
/**
 *
 */
export function resetSliderMocks(): void {
  Object.values(mockFunctions).forEach((mock) => mock.mockClear());
  useSliderAnimationMock.animateSlide.mockClear();
  Object.values(useGestureHandlingMock).forEach((mock) => mock.mockClear());
}
