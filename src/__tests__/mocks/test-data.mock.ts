/**
 * Mock test data for use across test files
 */
import type { Slide } from "@/types/slider";
import { createSlideId } from "@/utils/test-utils";

/**
 * Standard mock slides for testing
 */
export const mockSlides: Slide[] = [
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

/**
 * Mock slides with additional content property
 */
export const mockSlidesWithContent: Slide[] = [
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

/**
 * Single mock slide for simple tests
 */
export const singleMockSlide: Slide = {
  id: createSlideId("test-slide"),
  title: "Test Slide",
  image: "/images/test.jpg",
  alt: "Test slide description",
};

/**
 * Create mock slides with custom count
 *
 * @param count Number of slides to create
 *
 * @returns Array of mock slides
 *
 */
export const createMockSlides = (count: number): Slide[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: createSlideId(`slide-${index + 1}`),
    title: `Slide ${index + 1}`,
    image: `/images/slide${index + 1}.jpg`,
    alt: `Slide ${index + 1} description`,
  }));
};

/**
 * Create mock slides with custom properties
 *
 * @param count Number of slides to create
 *
 * @param overrides Custom properties to override
 *
 * @returns Array of mock slides with custom properties
 *
 */
export const createMockSlidesWithProps = (
  count: number,
  overrides?: Partial<Slide>
): Slide[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: createSlideId(`slide-${index + 1}`),
    title: `Slide ${index + 1}`,
    image: `/images/slide${index + 1}.jpg`,
    alt: `Slide ${index + 1} description`,
    ...overrides,
  }));
}; 