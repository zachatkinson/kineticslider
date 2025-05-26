// Mocks must come first
const mockNext = vi.fn();
const mockPrevious = vi.fn();
const mockGoToSlide = vi.fn();
const mockTrackError = vi.fn();

vi.mock("@/context/SliderContext", () => {
  const React = require("react");
  return {
    __esModule: true,
    useSlider: () => ({
      state: {
        isAnimating: false,
        currentIndex: 0,
        previousIndex: 2,
        direction: "next",
      },
      config: {
        hideNavigation: false,
        loop: true,
        animationDuration: 300,
        enableKeyboard: true,
        enableGestures: true,
      },
      items: [],
      actions: {
        next: mockNext,
        previous: mockPrevious,
        goTo: mockGoToSlide,
      },
    }),
    SliderProvider: ({
      children,
      _items,
      config,
    }: {
      children: React.ReactNode;
      _items: any;
      config: { loop: boolean };
    }) => (
      <div data-testid="slider-provider" data-loop={config.loop}>
        {children}
      </div>
    ),
  };
});

vi.mock("@/hooks/slider/useGestureHandling", () => ({
  useGestureHandling: () => ({
    handleTouchStart: vi.fn(),
    handleTouchMove: vi.fn(),
    handleTouchEnd: vi.fn(),
    handleMouseDown: vi.fn(),
    handleMouseMove: vi.fn(),
    handleMouseUp: vi.fn(),
  }),
}));

vi.mock("@/hooks/slider/useKeyboardNavigation", () => ({
  useKeyboardNavigation: () => ({
    handleKeyDown: vi.fn(),
  }),
}));

vi.mock("@/hooks/slider/useSliderAnimation", () => ({
  useSliderAnimation: () => ({
    animateSlide: vi.fn(({ onComplete }: { onComplete: () => void }) => {
      vi.advanceTimersByTime(300);
      onComplete();
      // Simulate transitionend event
      const event = new Event("transitionend");
      document.dispatchEvent(event);
    }),
  }),
}));

vi.mock("@/hooks/slider/usePerformanceMonitoring", () => ({
  usePerformanceMonitoring: () => ({
    getMetrics: vi.fn(() => ({ fps: 60, animationDuration: 300 })),
  }),
}));

vi.mock("@/hooks/slider/useErrorTracking", () => ({
  __esModule: true,
  useErrorTracking: () => ({
    trackError: mockTrackError,
    ERROR_TYPES: {
      ANIMATION: "animation",
      RENDER: "render",
      NAVIGATION: "navigation",
      OPERATION: "operation",
    },
  }),
}));

vi.mock("@/utils/styles", () => ({
  getSlideStyle: vi.fn(() => ({})),
}));

vi.mock("@/migration-tools/error-boundary", () => ({
  FeatureErrorBoundary: ({
    children,
    feature,
  }: {
    children: React.ReactNode;
    feature: FeatureFlag;
  }) => (
    <div data-testid="feature-error-boundary" data-feature={feature}>
      {children}
    </div>
  ),
}));

import React from "react";
import {
  render,
  screen,
  fireEvent,
} from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Slider, _isRefNotNull } from "@/components/Slider/Slider";
import { SliderProvider } from "@/context/SliderContext";
import type { Slide } from "@/types/slider";
import { createSlideId } from "@/utils/test-utils";
import { FeatureFlag } from "@/types/feature-flags";

describe("Slider", () => {
  const mockSlides: Slide[] = [
    {
      id: createSlideId("1"),
      title: "First Slide",
      image: "/slide1.jpg",
      alt: "First slide image",
      content: "First Slide",
    },
    {
      id: createSlideId("2"),
      title: "Second Slide",
      image: "/slide2.jpg",
      alt: "Second slide image",
      content: "Second Slide",
    },
    {
      id: createSlideId("3"),
      title: "Third Slide",
      image: "/slide3.jpg",
      alt: "Third slide image",
      content: "Third Slide",
    },
  ];

  const mockOnSlideChange = vi.fn();
  const mockOnAnimationComplete = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders slides correctly", () => {
    render(
      <Slider
        slides={mockSlides}
        onSlideChange={mockOnSlideChange}
        onAnimationComplete={mockOnAnimationComplete}
        onError={mockOnError}
      />,
    );

    // Check if all slides are rendered
    mockSlides.forEach((slide, index) => {
      const slideContainer = screen.getByTestId(`slide-container-${index + 1}`);
      const slideContent = screen.getByTestId(`slide-content-${slide.id}`);
      expect(slideContainer).toBeInTheDocument();
      expect(slideContent).toBeInTheDocument();
    });

    // Check if navigation buttons are present
    expect(screen.getByTestId("prev-button")).toBeInTheDocument();
    expect(screen.getByTestId("next-button")).toBeInTheDocument();
  });

  it("handles keyboard navigation", async () => {
    render(
      <Slider
        slides={mockSlides}
        onSlideChange={mockOnSlideChange}
        onAnimationComplete={mockOnAnimationComplete}
        onError={mockOnError}
        enableKeyboard={true}
      />,
    );

    const slider = screen.getByTestId("slider-container");
    slider.focus();

    // Test right arrow navigation
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(mockNext).toHaveBeenCalled();

    // Test left arrow navigation
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(mockPrevious).toHaveBeenCalled();
  });

  it("handles navigation button clicks", async () => {
    render(
      <Slider
        slides={mockSlides}
        onSlideChange={mockOnSlideChange}
        onAnimationComplete={mockOnAnimationComplete}
        onError={mockOnError}
      />,
    );

    // Test next button
    const nextButton = screen.getByTestId("next-button");
    fireEvent.click(nextButton);
    expect(mockNext).toHaveBeenCalled();

    // Test previous button
    const prevButton = screen.getByTestId("prev-button");
    fireEvent.click(prevButton);
    expect(mockPrevious).toHaveBeenCalled();
  });

  it("handles error state", () => {
    const error = new Error("Navigation failed");
    mockNext.mockImplementationOnce(() => {
      throw error;
    });

    render(
      <Slider
        slides={mockSlides}
        onSlideChange={mockOnSlideChange}
        onAnimationComplete={mockOnAnimationComplete}
        onError={mockOnError}
      />,
    );

    const nextButton = screen.getByTestId("next-button");
    fireEvent.click(nextButton);

    expect(mockOnError).toHaveBeenCalledWith(error);
    expect(mockTrackError).toHaveBeenCalledWith(error, "navigation");
  });

  const mockSlideItems = mockSlides.map((slide) => ({
    id: slide.id,
    content: <div>{slide.title}</div>,
  }));

  it("renders without crashing", () => {
    const { container } = render(
      <SliderProvider items={mockSlideItems} config={{ loop: true }}>
        <Slider
          slides={mockSlides}
          onSlideChange={mockOnSlideChange}
          onAnimationComplete={mockOnAnimationComplete}
          onError={mockOnError}
        />
      </SliderProvider>,
    );
    expect(container).toBeInTheDocument();
  });

  it("handles mock navigation error for testing", async () => {
    // Set up the mock navigation error flag
    const mockWindow = window as any;
    mockWindow.__MOCK_NAV_ERROR__ = true;

    render(
      <Slider
        slides={mockSlides}
        onSlideChange={mockOnSlideChange}
        onAnimationComplete={mockOnAnimationComplete}
        onError={mockOnError}
      />,
    );

    // Trigger navigation to hit the mock error path
    const nextButton = screen.getByTestId("next-button");
    fireEvent.click(nextButton);

    // The mock error should trigger error handling
    expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
    expect(mockTrackError).toHaveBeenCalledWith(expect.any(Error), "navigation");

    // Clean up
    delete mockWindow.__MOCK_NAV_ERROR__;
  });

  it("exports _isRefNotNull utility function", () => {
    // Test the utility function for coverage
    expect(typeof _isRefNotNull).toBe("function");
    
    // Test with null ref
    const nullRef = { current: null };
    expect(_isRefNotNull(nullRef)).toBe(false);
    
    // Test with non-null ref
    const validRef = { current: document.createElement("div") };
    expect(_isRefNotNull(validRef)).toBe(true);
  });

  it("handles keyboard events with unsupported keys", () => {
    render(
      <Slider
        slides={mockSlides}
        onSlideChange={mockOnSlideChange}
        onAnimationComplete={mockOnAnimationComplete}
        onError={mockOnError}
        enableKeyboard={true}
      />,
    );

    const slider = screen.getByTestId("slider-container");
    slider.focus();

    // Test unsupported key (should hit default case)
    fireEvent.keyDown(slider, { key: "Enter" });
    fireEvent.keyDown(slider, { key: "Space" });
    fireEvent.keyDown(slider, { key: "Escape" });

    // No navigation should happen for unsupported keys
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockPrevious).not.toHaveBeenCalled();
  });
});
