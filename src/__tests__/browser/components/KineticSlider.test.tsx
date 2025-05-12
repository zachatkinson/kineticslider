import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { KineticSlider } from "@/components/KineticSlider";
import { createSlideId } from "@/utils/id-helpers";
import type { Slide } from "@/types/slider";
import {
  mockFunctions,
  createBasicKineticSliderMock,
  useKineticSliderMock,
  resetKineticSliderMocks,
  createHomeEndKineticSliderMock,
} from "../../mocks/kinetic-slider.mock";

// Mock the useKineticSlider hook - must be at the top level
vi.mock("@/hooks/useKineticSlider", () => ({
  useKineticSlider: (...args: any[]) => useKineticSliderMock(...args),
}));

describe("KineticSlider (Browser)", () => {
  const mockSlides: Slide[] = [
    {
      id: createSlideId("slide-1"),
      title: "First Slide",
      image: "/images/slide1.jpg",
      alt: "First slide description",
    },
    {
      id: createSlideId("slide-2"),
      title: "Second Slide",
      image: "/images/slide2.jpg",
      alt: "Second slide description",
    },
    {
      id: createSlideId("slide-3"),
      title: "Third Slide",
      image: "/images/slide3.jpg",
      alt: "Third slide description",
    },
  ];

  beforeEach(() => {
    resetKineticSliderMocks();
    useKineticSliderMock.mockImplementation(() =>
      createBasicKineticSliderMock(mockSlides),
    );
  });

  it("renders the component without crashing", () => {
    useKineticSliderMock.mockReturnValue(
      createBasicKineticSliderMock(mockSlides),
    );
    render(<KineticSlider slides={mockSlides} />);
    expect(
      screen.getByRole("button", { name: /next slide/i }),
    ).toBeInTheDocument();
  });

  it("handles keyboard navigation with arrow keys", async () => {
    render(
      <KineticSlider
        slides={mockSlides}
        enableKeyboard={true}
      />,
    );

    // Simulate right arrow key press
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
      // Wait for animation to complete
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Verify right arrow called next
    expect(mockFunctions.next).toHaveBeenCalled();

    // Simulate left arrow key press to go back
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
      // Wait for animation to complete
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Verify left arrow called prev
    expect(mockFunctions.prev).toHaveBeenCalled();
  });

  it("implements keyboard navigation for Home and End keys correctly", async () => {
    useKineticSliderMock.mockImplementation(() => createHomeEndKineticSliderMock());
    
    render(
      <KineticSlider
        slides={mockSlides}
        enableKeyboard={true}
      />,
    );

    // Test Home key
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Home" }));
      // Wait for any potential animations
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockFunctions.goToSlide).toHaveBeenCalledWith(0);

    // Test End key
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "End" }));
      // Wait for any potential animations
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockFunctions.goToSlide).toHaveBeenCalledWith(2);
  });
});
