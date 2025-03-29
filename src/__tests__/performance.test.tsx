/* eslint-env vitest */
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { KineticSlider } from '../components/KineticSlider';
import type { SlideProps } from '../types';
import './unit/mocks/gsap.mock';

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

// Helper to generate mock slides
const generateMockSlides = (count: number): SlideProps[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `slide-${i}`,
    content: `Slide ${i + 1} Content`,
    title: `Slide ${i + 1}`,
    image: `/image-${i + 1}.jpg`,
  }));
};

describe('KineticSlider Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('basic render performance test', () => {
    const slides = generateMockSlides(3);
    expect(() => render(<KineticSlider slides={slides} />)).not.toThrow();
  });

  // Disabled for now until we implement more sophisticated performance tests
  it.skip('renders efficiently with more slides', () => {
    const slides = generateMockSlides(10);
    const { container } = render(<KineticSlider slides={slides} />);
    expect(container).toBeTruthy();
  });
});
