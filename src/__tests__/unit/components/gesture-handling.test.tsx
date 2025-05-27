import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { KineticSlider } from "@/components/KineticSlider/KineticSlider";
import type { Slide } from "@/types";
import { createSlideId } from "@/utils/id-helpers";

// Important: vi.mock calls are hoisted, so define mocks using inline functions
vi.mock("@/hooks/useGestures", () => {
  return {
    useGestures: () => ({
      attach: () => vi.fn(),
    }),
  };
});

// Mock gsap for animations with proper default export
vi.mock("gsap", () => {
  const mockTo = vi.fn(() => ({ kill: vi.fn() }));
  const mockConfig = vi.fn();

  return {
    default: {
      to: mockTo,
      config: mockConfig,
    },
    to: mockTo,
    config: mockConfig,
  };
});

// Create test data
const createMockSlides = (count: number): Slide[] => {
  return Array.from({ length: count }).map((_, index) => ({
    id: createSlideId(`slide-${index + 1}`),
    title: `Test Slide ${index + 1}`,
    description: `Test Description ${index + 1}`,
    image: `/images/test${index + 1}.jpg`,
    alt: `Test Image ${index + 1}`,
  }));
};

describe("KineticSlider - Gesture Handling (Unit)", () => {
  let mockSlides: Slide[];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create test data
    mockSlides = createMockSlides(5);

    // Mock ResizeObserver
    vi.stubGlobal(
      "ResizeObserver",
      vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      })),
    );

    // Mock IntersectionObserver
    vi.stubGlobal(
      "IntersectionObserver",
      vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      })),
    );
  });

  it("renders without crashing when gestures are enabled", () => {
    render(<KineticSlider slides={mockSlides} enableGestures={true} />);

    // Verify basic rendering - use role selector instead of data-testid
    expect(
      screen.getByRole("region", { name: "Image slider" }),
    ).toBeInTheDocument();
  });

  it("renders without crashing when gestures are disabled", () => {
    render(<KineticSlider slides={mockSlides} enableGestures={false} />);

    // Verify basic rendering - use role selector instead of data-testid
    expect(
      screen.getByRole("region", { name: "Image slider" }),
    ).toBeInTheDocument();
  });

  it("renders navigation buttons correctly", () => {
    render(<KineticSlider slides={mockSlides} enableGestures={true} />);

    // Verify that navigation buttons are present
    expect(screen.getByRole("button", { name: "Next slide" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Previous slide" }),
    ).toBeInTheDocument();
  });
});
