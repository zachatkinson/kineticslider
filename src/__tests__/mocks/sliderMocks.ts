import { vi } from 'vitest';
import type { Slide } from '@/types/slider';
import type { SlideId } from '@/types/branded';
import { createSlideId } from '../helpers/testHelpers';

export const mockSlides: Slide[] = [
  { id: createSlideId('1'), title: 'Slide 1', image: '/slide1.jpg', alt: 'Slide 1 description' },
  { id: createSlideId('2'), title: 'Slide 2', image: '/slide2.jpg', alt: 'Slide 2 description' },
  { id: createSlideId('3'), title: 'Slide 3', image: '/slide3.jpg', alt: 'Slide 3 description' },
];

export const mockSliderProps = {
  slides: mockSlides,
  initialSlide: 0,
  onSlideChange: vi.fn(),
  enableKeyboard: true,
  infiniteLoop: false,
}; 