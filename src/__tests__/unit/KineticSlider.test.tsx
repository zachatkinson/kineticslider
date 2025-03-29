/* eslint-env vitest */
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { KineticSlider } from '../../components/KineticSlider';
import type { SlideProps } from '../../types';
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
const mockSlides: SlideProps[] = [
  {
    id: '1',
    content: 'Slide 1 content',
    title: 'Slide 1',
    image: '/slide1.jpg',
  },
  {
    id: '2',
    content: 'Slide 2 content',
    title: 'Slide 2',
    image: '/slide2.jpg',
  },
];

describe('KineticSlider Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    // Just verify that no errors are thrown when rendering
    expect(() => render(<KineticSlider slides={mockSlides} />)).not.toThrow();
  });
});
