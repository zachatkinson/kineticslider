/* eslint-env vitest */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render } from '@testing-library/react';
import { gsapMock, completeAnimation, startAnimation } from './mocks/gsap.mock';
import { KineticSlider } from '../components/KineticSlider';
import { Slide } from '../types';
import './types/globals.d';

// Mock GSAP
vi.mock('gsap', () => ({
  gsap: gsapMock.gsap
}));

// Mock error tracker
const mockErrorTracker = {
  captureError: vi.fn((_error: Error, _context: Record<string, unknown>) => {}),
};

// Mock analytics
const mockAnalytics = {
  track: vi.fn((_event: string, _data: Record<string, unknown>) => {}),
};

// Test data
const mockSlides: Slide[] = [
  {
    id: '1',
    content: 'Slide 1'
  },
  {
    id: '2',
    content: 'Slide 2'
  },
  {
    id: '3',
    content: 'Slide 3'
  }
];

// Mock window.gsap
beforeAll(() => {
  window.gsap = gsapMock.gsap;
  window.analytics = mockAnalytics;
  window.errorTracker = mockErrorTracker;
});

describe('KineticSlider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render slides correctly', () => {
    const slides = [
      { id: '1', content: <div>Slide 1</div> },
      { id: '2', content: <div>Slide 2</div> },
      { id: '3', content: <div>Slide 3</div> }
    ];

    const { container } = render(<KineticSlider slides={slides} />);
    const slideElements = container.querySelectorAll('[aria-roledescription="slide"]');
    expect(slideElements).toHaveLength(3);
    expect(slideElements[0]).toHaveAttribute('aria-current', 'true');
    expect(slideElements[1]).toHaveAttribute('aria-current', 'false');
    expect(slideElements[2]).toHaveAttribute('aria-current', 'false');
  });

  it('handles keyboard navigation correctly', async () => {
    const slides = [
      { id: '1', content: <div>Slide 1</div> },
      { id: '2', content: <div>Slide 2</div> },
      { id: '3', content: <div>Slide 3</div> }
    ];

    const { container } = render(<KineticSlider slides={slides} />);
    const slider = container.querySelector('.kinetic-slider-container');
    expect(slider).toBeDefined();

    // Initial state check
    let allSlides = container.querySelectorAll('[aria-roledescription="slide"]');
    expect(allSlides[0]).toHaveAttribute('aria-current', 'true');
    expect(allSlides[1]).toHaveAttribute('aria-current', 'false');

    // Navigate to next slide
    await act(async () => {
      fireEvent.keyDown(slider!, { key: 'ArrowRight' });
      startAnimation();
    });

    // During animation, no slide should be current
    allSlides = container.querySelectorAll('[aria-roledescription="slide"]');
    expect(allSlides[0]).toHaveAttribute('aria-current', 'false');
    expect(allSlides[1]).toHaveAttribute('aria-current', 'false');

    // Complete animation
    await act(async () => {
      completeAnimation();
    });

    // After animation, second slide should be current
    allSlides = container.querySelectorAll('[aria-roledescription="slide"]');
    expect(allSlides[0]).toHaveAttribute('aria-current', 'false');
    expect(allSlides[1]).toHaveAttribute('aria-current', 'true');
  });
});
