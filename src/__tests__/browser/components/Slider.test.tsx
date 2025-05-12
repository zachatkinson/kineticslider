/**
 * Comprehensive test suite for the Slider component
 * Includes both unit and browser-specific tests
 */
import { vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Slider } from "@/components/Slider/Slider";
import { SliderProvider } from "@/context/SliderContext";
import { brandSliderId } from "@/types/branded";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { FeatureFlag } from "@/types/feature-flags";
import {
  mockFunctions,
  useErrorTrackingMock,
  useSliderAnimationMock,
  useGestureHandlingMock,
  useKeyboardNavigationMock,
  createSliderContextMock,
  resetSliderMocks,
} from "../../mocks/slider.mock";

declare global {
  interface Window {
    __MOCK_NAV_ERROR__?: boolean;
    __MOCK_SLIDER_CONFIG__?: any;
  }
}

// Mock error tracking module
vi.mock("@/hooks/slider/useErrorTracking", () => ({
  useErrorTracking: () => useErrorTrackingMock,
}));

// Mock animation hooks
vi.mock("@/hooks/slider/useSliderAnimation", () => ({
  useSliderAnimation: () => useSliderAnimationMock,
}));

// Mock gesture handling
vi.mock("@/hooks/slider/useGestureHandling", () => ({
  useGestureHandling: () => useGestureHandlingMock,
}));

// Mock keyboard navigation
vi.mock("@/hooks/slider/useKeyboardNavigation", () => ({
  useKeyboardNavigation: () => useKeyboardNavigationMock,
}));

// Mock slider context
vi.mock("@/context/SliderContext", () => ({
  useSlider: () => createSliderContextMock(testSlides),
  SliderProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

if (typeof window !== "undefined" && !window.requestAnimationFrame) {
  window.requestAnimationFrame = (cb: FrameRequestCallback) =>
    setTimeout(cb, 16);
}

const testSlides = [
  {
    id: brandSliderId("slide-1"),
    title: "First Slide",
    image: "/test-image-1.jpg",
    alt: "First slide image",
    content: <div data-testid="slide-1">First Slide</div>,
  },
  {
    id: brandSliderId("slide-2"),
    title: "Second Slide",
    image: "/test-image-2.jpg",
    alt: "Second slide image",
    content: <div data-testid="slide-2">Second Slide</div>,
  },
  {
    id: brandSliderId("slide-3"),
    title: "Third Slide",
    image: "/test-image-3.jpg",
    alt: "Third slide image",
    content: <div data-testid="slide-3">Third Slide</div>,
  },
];

describe("Slider Component", () => {
  beforeEach(() => {
    resetSliderMocks();
    (window as any).__MOCK_NAV_ERROR__ = false;
    (window as any).__MOCK_SLIDER_CONFIG__ = undefined;
  });

  afterEach(() => {
    delete (window as any).__MOCK_NAV_ERROR__;
  });

  describe("Rendering and Structure", () => {
    it("renders with feature error boundary", async () => {
      render(
        <SliderProvider items={testSlides}>
          <Slider slides={testSlides} />
        </SliderProvider>,
      );

      const errorBoundary = screen.getByTestId("feature-error-boundary");
      expect(errorBoundary).toBeInTheDocument();
      expect(errorBoundary).toHaveAttribute(
        "data-feature",
        FeatureFlag.NEW_CORE_SLIDER,
      );
    });

    it("renders all slides with correct active states", () => {
      render(
        <SliderProvider items={testSlides}>
          <Slider slides={testSlides} />
        </SliderProvider>,
      );

      testSlides.forEach((slide, index) => {
        const slideElement = screen.getByTestId(`slide-container-${index + 1}`);
        expect(slideElement).toBeInTheDocument();

        const slideContent = screen.getByTestId(`slide-content-${slide.id}`);
        expect(slideContent).toBeInTheDocument();
      });
    });
  });

  describe("Navigation", () => {
    it("handles keyboard navigation", async () => {
      render(
        <SliderProvider items={testSlides}>
          <Slider slides={testSlides} enableKeyboard={true} />
        </SliderProvider>,
      );

      const slider = screen.getByRole("region");
      slider.focus();

      // First slide should be active initially
      const firstSlide = screen.getByTestId("slide-container-1");
      expect(firstSlide).toHaveAttribute("data-active", "true");
      expect(firstSlide).not.toHaveAttribute("data-animating", "true");

      // Navigate to next slide
      fireEvent.keyDown(slider, { key: "ArrowRight" });

      // Wait for animation to complete
      await waitFor(
        () => {
          const secondSlide = screen.getByTestId("slide-container-2");
          expect(secondSlide).toHaveAttribute("data-active", "true");
          expect(secondSlide).not.toHaveAttribute("data-animating", "true");
          expect(firstSlide).not.toHaveAttribute("data-active", "true");
          expect(firstSlide).toHaveAttribute("data-animating", "true");
        },
        { timeout: 1000 },
      );

      // Navigate to previous slide
      fireEvent.keyDown(slider, { key: "ArrowLeft" });

      // Wait for animation to complete
      await waitFor(
        () => {
          expect(firstSlide).toHaveAttribute("data-active", "true");
          expect(firstSlide).not.toHaveAttribute("data-animating", "true");
          const secondSlide = screen.getByTestId("slide-container-2");
          expect(secondSlide).not.toHaveAttribute("data-active", "true");
          expect(secondSlide).toHaveAttribute("data-animating", "true");
        },
        { timeout: 1000 },
      );
    });

    it("handles navigation button clicks", async () => {
      render(
        <SliderProvider items={testSlides}>
          <Slider slides={testSlides} />
        </SliderProvider>,
      );

      // First slide should be active initially
      const firstSlide = screen.getByTestId("slide-container-1");
      expect(firstSlide).toHaveAttribute("data-active", "true");
      expect(firstSlide).not.toHaveAttribute("data-animating", "true");

      // Click next button
      const nextButton = screen.getByRole("button", { name: /next/i });
      fireEvent.click(nextButton);

      // Wait for animation to complete
      await waitFor(
        () => {
          expect(mockFunctions.next).toHaveBeenCalledTimes(1);
          const secondSlide = screen.getByTestId("slide-container-2");
          expect(secondSlide).toHaveAttribute("data-active", "true");
          expect(secondSlide).not.toHaveAttribute("data-animating", "true");
          expect(firstSlide).not.toHaveAttribute("data-active", "true");
          expect(firstSlide).toHaveAttribute("data-animating", "true");
        },
        { timeout: 1000 },
      );

      // Click previous button
      const prevButton = screen.getByRole("button", { name: /previous/i });
      fireEvent.click(prevButton);

      // Wait for animation to complete
      await waitFor(
        () => {
          expect(mockFunctions.previous).toHaveBeenCalledTimes(1);
          expect(firstSlide).toHaveAttribute("data-active", "true");
          expect(firstSlide).not.toHaveAttribute("data-animating", "true");
          const secondSlide = screen.getByTestId("slide-container-2");
          expect(secondSlide).not.toHaveAttribute("data-active", "true");
          expect(secondSlide).toHaveAttribute("data-animating", "true");
        },
        { timeout: 1000 },
      );
    });

    it("ignores keyboard navigation when disabled", async () => {
      render(
        <SliderProvider items={testSlides}>
          <Slider slides={testSlides} enableKeyboard={false} />
        </SliderProvider>,
      );

      const slider = screen.getByRole("region");
      slider.focus();

      fireEvent.keyDown(slider, { key: "ArrowRight" });
      expect(mockFunctions.next).not.toHaveBeenCalled();
    });

    it("handles animation state correctly", async () => {
      render(
        <SliderProvider items={testSlides}>
          <Slider
            slides={testSlides}
            onSlideChange={mockFunctions.onSlideChange}
            onAnimationComplete={mockFunctions.onAnimationComplete}
            onError={mockFunctions.onError}
            duration={300}
          />
        </SliderProvider>,
      );

      const slider = screen.getByRole("region");
      const nextButton = screen.getByTestId("next-button");
      const firstSlide = screen.getByTestId("slide-container-1");

      // Initial state
      expect(slider).toHaveAttribute("data-animating", "false");
      expect(firstSlide).toHaveAttribute("data-active", "true");

      // Trigger animation
      fireEvent.click(nextButton);

      // Verify animation state
      expect(slider).toHaveAttribute("data-animating", "true");

      // Wait for animation to complete
      await waitFor(
        () => {
          expect(mockFunctions.onAnimationComplete).toHaveBeenCalled();
          expect(slider).toHaveAttribute("data-animating", "false");
          expect(screen.getByTestId("slide-container-2")).toHaveAttribute(
            "data-active",
            "true",
          );
        },
        { timeout: 1000 },
      );
    });

    it("handles error UI and dismissal", async () => {
      const error = new Error("Navigation failed");
      mockFunctions.next.mockImplementationOnce(() => {
        throw error;
      });

      render(
        <SliderProvider items={testSlides} config={{ loop: true }}>
          <Slider
            slides={testSlides}
            onSlideChange={mockFunctions.onSlideChange}
            onAnimationComplete={mockFunctions.onAnimationComplete}
            onError={mockFunctions.onError}
          />
        </SliderProvider>,
      );

      const nextButton = screen.getByTestId("next-button");
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByTestId("slider-error")).toBeInTheDocument();
        expect(screen.getByText("Navigation failed")).toBeInTheDocument();
      });

      const dismissButton = screen.getByRole("button", {
        name: "Dismiss error",
      });
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByTestId("slider-error")).not.toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("tracks errors when navigation fails", async () => {
      (window as any).__MOCK_NAV_ERROR__ = true;
      render(
        <SliderProvider items={testSlides}>
          <Slider slides={testSlides} />
        </SliderProvider>,
      );

      // Click next button and wait for error
      await fireEvent.click(screen.getByTestId("next-button"));

      // Wait for error to be tracked
      await waitFor(() => {
        expect(mockFunctions.trackError).toHaveBeenCalledWith(
          expect.any(Error),
          "navigation",
        );
      });
    });

    it("displays error state when navigation fails", async () => {
      (window as any).__MOCK_NAV_ERROR__ = true;
      render(
        <SliderProvider items={testSlides}>
          <Slider slides={testSlides} />
        </SliderProvider>,
      );

      // Click next button and wait for error
      const nextButton = screen.getByTestId("next-button");
      fireEvent.click(nextButton);

      // Wait for error to be displayed
      await waitFor(() => {
        const errorElements = screen.getAllByTestId("slider-error");
        expect(errorElements.length).toBeGreaterThan(0);

        // Check that at least one error element has the correct content
        const hasErrorWithContent = errorElements.some((element) =>
          element.textContent?.includes("Navigation failed"),
        );
        expect(hasErrorWithContent).toBe(true);

        // Find and click the first dismiss button
        const dismissButton = screen.getByRole("button", {
          name: /dismiss error/i,
        });
        expect(dismissButton).toBeInTheDocument();
        fireEvent.click(dismissButton);

        // Verify all error elements are removed
        expect(screen.queryAllByTestId("slider-error")).toHaveLength(0);
      });
    });
  });

  describe("Accessibility", () => {
    it("maintains accessibility attributes", () => {
      render(
        <SliderProvider items={testSlides}>
          <Slider slides={testSlides} />
        </SliderProvider>,
      );

      const slider = screen.getByRole("region");
      expect(slider).toHaveAttribute("aria-label", "Image Slider");
      expect(slider).toHaveAttribute("aria-roledescription", "carousel");

      // Verify navigation buttons are accessible
      const nextButton = screen.getByRole("button", { name: /next/i });
      const prevButton = screen.getByRole("button", { name: /previous/i });
      expect(nextButton).toBeInTheDocument();
      expect(prevButton).toBeInTheDocument();

      // Verify ARIA live region
      const liveRegion = screen.getByTestId("slider-aria-live");
      expect(liveRegion).toHaveAttribute("aria-live", "polite");
      expect(liveRegion).toHaveAttribute("aria-atomic", "true");
    });
  });

  describe("Animation States", () => {
    it("handles animation state correctly", async () => {
      render(
        <SliderProvider items={testSlides}>
          <Slider slides={testSlides} />
        </SliderProvider>,
      );

      // Initial state should not be animating
      const firstSlide = screen.getByTestId("slide-container-1");
      expect(firstSlide).toHaveAttribute("data-active", "true");
      expect(firstSlide).not.toHaveAttribute("data-animating", "true");

      // Click next button to trigger animation
      const nextButton = screen.getByRole("button", { name: /next/i });
      fireEvent.click(nextButton);

      // Should be animating
      expect(firstSlide).toHaveAttribute("data-animating", "true");

      // Wait for animation to complete
      await waitFor(
        () => {
          const secondSlide = screen.getByTestId("slide-container-2");
          expect(secondSlide).toHaveAttribute("data-active", "true");
          expect(secondSlide).not.toHaveAttribute("data-animating", "true");
        },
        { timeout: 1000 },
      );
    });
  });
});
