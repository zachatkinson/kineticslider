/**
 * Mock slider data and props for testing
 * @returns {ReturnType} The return value
 */
import { vi } from 'vitest';
import type { Slide } from '../../types/slider';
import type { KineticSliderProps } from '../../types/slider';
import type { AnimationConfig } from '../../types/animation';
import type { SliderId as _SliderId, SlideIndex } from '../../types/branded';
import { createSlideId } from '../helpers/testHelpers';
import type { gsap } from 'gsap';

/**
 * Mock slides data
 */
export const mockSlides: Slide[] = [
  { id: createSlideId('1'), title: 'Slide 1', image: '/slide1.jpg', alt: 'Slide 1 description' },
  { id: createSlideId('2'), title: 'Slide 2', image: '/slide2.jpg', alt: 'Slide 2 description' },
  { id: createSlideId('3'), title: 'Slide 3', image: '/slide3.jpg', alt: 'Slide 3 description' },
];

/**
 * Mock slider props
 */
export const _mockSliderProps: Partial<KineticSliderProps> = {
  slides: mockSlides,
  initialSlide: 0 as SlideIndex,
  onSlideChange: vi.fn(),
  enableKeyboard: true,
  infiniteLoop: false,
};

/**
 * Mock animation configuration
 */
export const _mockAnimationConfig: Partial<AnimationConfig> = {
  target: {} as gsap.TweenTarget,
  duration: 0.5,
  ease: 'power2.out',
  stagger: 0.1
};

/**
 * Mock gesture events
 */
export const _mockGestureEvents = {
  onDragStart: vi.fn(),
  onDragEnd: vi.fn(),
  onDrag: vi.fn(),
  onSwipeLeft: vi.fn(),
  onSwipeRight: vi.fn()
};

/**
 * Mock keyboard events
 */
export const _mockKeyboardEvents = {
  onArrowLeft: vi.fn(),
  onArrowRight: vi.fn(),
  onEscape: vi.fn()
};

/**
 * Create a new mock slide
 * @param id
 * @param title
 * @param image
 * @returns {unknown} - The return value
 */
export function _createMockSlide(id: string, title = `Slide ${id}`, image = `/slide${id}.jpg`): Slide {
  return {
    id: createSlideId(id),
    title,
    image,
    alt: `${title} description`
  };
}

/**
 * Create a mock slider callback
 * @returns {unknown} The function return value
 */
export function _createMockSliderCallback(): {
  onSlideChange: ReturnType<typeof vi.fn>;
  onInit: ReturnType<typeof vi.fn>;
  onError: ReturnType<typeof vi.fn>;
} {
  return {
    onSlideChange: vi.fn(),
    onInit: vi.fn(),
    onError: vi.fn()
  };
} 