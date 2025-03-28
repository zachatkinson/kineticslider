/* eslint-env jest */
import '@testing-library/jest-dom';
import { act, fireEvent, render } from '@testing-library/react';
import gsap from 'gsap';

import React from 'react';

import { KineticSlider } from '../KineticSlider';

// Extend Window interface
declare global {
  interface Window {
    analytics: {
      track: (event: string, data: Record<string, unknown>) => void;
    };
    errorTracker: {
      captureError: (
        error: Error | null,
        context: Record<string, unknown>
      ) => void;
    };
  }
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      gsap: typeof gsap;
    }
  }
}

// Mock GSAP
jest.mock('gsap', () => {
  const mockTimeline = {
    to: jest.fn().mockReturnThis(),
    kill: jest.fn(),
    eventCallback: jest.fn((event, callback) => {
      if (event === 'onComplete' && callback) {
        // Store the callback to call it later
        mockTimeline.onComplete = callback;
      }
      return mockTimeline;
    }),
    play: jest.fn(),
    onComplete: null as null | (() => void),
  };

  const mockGsap = {
    timeline: jest.fn(({ onComplete }) => {
      // Store the onComplete callback from timeline creation
      if (onComplete) {
        mockTimeline.onComplete = onComplete;
      }
      return mockTimeline;
    }),
    to: jest.fn(),
    set: jest.fn(),
    killTweensOf: jest.fn(),
  };

  return mockGsap;
});

// Mock error tracker
const mockErrorTracker = {
  captureError: jest.fn(),
};

// Mock analytics
const mockAnalytics = {
  track: jest.fn(),
};

// Test data
const mockSlides = [
  <div key="1" data-testid="slide-1">
    Slide 1
  </div>,
  <div key="2" data-testid="slide-2">
    Slide 2
  </div>,
  <div key="3" data-testid="slide-3">
    Slide 3
  </div>,
];

// Mock window.gsap
beforeAll(() => {
  global.gsap = gsap;
  window.analytics = mockAnalytics;
  window.errorTracker = mockErrorTracker;
});

describe('KineticSlider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should render slides correctly', () => {
    const { getByTestId } = render(<KineticSlider>{mockSlides}</KineticSlider>);

    // Verify that slides are rendered
    mockSlides.forEach((_, index) => {
      expect(getByTestId(`slide-${index + 1}`)).toBeInTheDocument();
    });
  });

  it('handles keyboard navigation correctly', async () => {
    const { container } = render(
      <KineticSlider>
        <div>Slide 1</div>
        <div>Slide 2</div>
        <div>Slide 3</div>
      </KineticSlider>
    );

    // Get the first slide
    const firstSlide = container.querySelector(
      '[aria-roledescription="slide"]'
    );
    expect(firstSlide).toHaveAttribute('aria-current', 'true');

    // Press right arrow key
    fireEvent.keyDown(firstSlide!, { key: 'ArrowRight' });

    // Run requestAnimationFrame
    await act(async () => {
      jest.runOnlyPendingTimers();
      // Wait for React to process state updates
      await Promise.resolve();
    });

    // Get the GSAP timeline mock
    const timelineMock = (gsap.timeline as jest.Mock).mock.results[0].value;

    // Run the animation completion callback
    await act(async () => {
      if (timelineMock.onComplete) {
        timelineMock.onComplete();
      }
      // Wait for React to process state updates
      await Promise.resolve();
      // Run any pending timers
      jest.runOnlyPendingTimers();
    });

    // After animation completes and state updates, verify the second slide is active
    const slides = container.querySelectorAll('[aria-roledescription="slide"]');
    expect(slides[0]).toHaveAttribute('aria-current', 'false');
    expect(slides[1]).toHaveAttribute('aria-current', 'true');
    expect(slides[2]).toHaveAttribute('aria-current', 'false');
  });
});

// ... rest of the file ...
