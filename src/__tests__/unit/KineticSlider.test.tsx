/* eslint-env vitest */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { KineticSlider } from '../../components/KineticSlider';
import type { Slide } from '../../types';
import { createSlideId } from '../../utils/id-helpers';
// Import the mock which will override the global gsap object
import './mocks/gsap.mock';

// Setup mocks for browser APIs
vi.stubGlobal(
  'ResizeObserver',
  vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
);

vi.stubGlobal(
  'IntersectionObserver',
  vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
);

// Mock analytics and error tracking
vi.stubGlobal('analytics', {
  track: vi.fn(),
});

vi.stubGlobal('errorTracker', {
  captureError: vi.fn(),
});

// Define mock slides for testing
const mockSlides: Slide[] = [
  {
    id: createSlideId('slide-1'),
    title: 'Test Slide 1',
    description: 'Test Description 1',
    image: '/images/test1.jpg',
    alt: 'Test Image 1',
  },
  {
    id: createSlideId('slide-2'),
    title: 'Test Slide 2',
    description: 'Test Description 2',
    image: '/images/test2.jpg',
    alt: 'Test Image 2',
  },
];

const mockProps = {
  slides: mockSlides,
  onSlideChange: vi.fn(),
  onAnimationComplete: vi.fn(),
};

describe('KineticSlider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<KineticSlider {...mockProps} />);
    expect(container).toBeTruthy();
  });

  it('renders all slides', () => {
    render(<KineticSlider {...mockProps} />);
    mockSlides.forEach((slide) => {
      expect(screen.getByText(slide.title)).toBeInTheDocument();
    });
  });

  // Add more test cases as needed
});
