import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSlideId } from "@/utils/id-helpers";
import { createBrandedNumber } from "@/types/branded";
import type { Slide } from "@/types/slider";

// Mock the modules (no implementation needed, just empty mock)
vi.mock("gsap", () => ({
  gsap: {
    to: vi.fn(),
  },
}));

vi.mock("@/hooks/useGestures", () => ({
  useGestures: () => ({
    attach: () => () => {},
  }),
}));

// Import the hook after mocks are set up
import { useKineticSlider } from "@/hooks/useKineticSlider";

describe("useKineticSlider - Basic API Test", () => {
  // Test data
  const mockSlides: Slide[] = [
    {
      id: createSlideId("slide-1"),
      title: "Slide 1",
      image: "image1.jpg",
      alt: "First slide image",
    },
    {
      id: createSlideId("slide-2"),
      title: "Slide 2",
      image: "image2.jpg",
      alt: "Second slide image",
    },
    {
      id: createSlideId("slide-3"),
      title: "Slide 3",
      image: "image3.jpg",
      alt: "Third slide image",
    },
  ];

  const defaultProps = {
    slides: mockSlides,
    duration: 0.5,
    ease: "power2.out",
    onSlideChange: vi.fn(),
    onAnimationComplete: vi.fn(),
    initialSlide: createBrandedNumber(0, "SlideIndex"),
    infiniteLoop: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with correct default values", () => {
    const { result } = renderHook(() => useKineticSlider(defaultProps));

    // Check that the hook returns the expected interface
    expect(result.current.currentSlide).toBe(0);
    expect(result.current.isAnimating).toBe(false);
    expect(typeof result.current.next).toBe("function");
    expect(typeof result.current.prev).toBe("function");
    expect(typeof result.current.goToSlide).toBe("function");
    expect(typeof result.current.handleGesture).toBe("function");
    expect(result.current.sliderRef).toBeDefined();
    expect(result.current.metrics).toBeDefined();
  });

  it("initializes with the provided initialSlide value", () => {
    const initialSlide = createBrandedNumber(1, "SlideIndex");
    const { result } = renderHook(() =>
      useKineticSlider({
        ...defaultProps,
        initialSlide,
      }),
    );

    expect(result.current.currentSlide).toBe(1);
  });

  it("exposes metrics object with slide information", () => {
    const { result } = renderHook(() => useKineticSlider(defaultProps));

    expect(result.current.metrics).toMatchObject({
      currentIndex: 0,
      totalSlides: mockSlides.length,
      isAnimating: false,
    });
  });

  it("provides the required API methods", () => {
    const { result } = renderHook(() => useKineticSlider(defaultProps));

    // Verify methods exist and are functions
    expect(typeof result.current.next).toBe("function");
    expect(typeof result.current.prev).toBe("function");
    expect(typeof result.current.goToSlide).toBe("function");
    expect(typeof result.current.handleGesture).toBe("function");
  });

  it("includes a slider reference", () => {
    const { result } = renderHook(() => useKineticSlider(defaultProps));

    // Verify sliderRef is a React ref
    expect(result.current.sliderRef).toHaveProperty("current");
  });
});
