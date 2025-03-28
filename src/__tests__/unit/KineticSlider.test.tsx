/* eslint-env vitest */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render } from '@testing-library/react';
import { gsapMock, completeAnimation, startAnimation } from '../mocks/gsap.mock';

import { KineticSlider } from '../../components/KineticSlider';
import { Slide } from '../../types';

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

  describe('Navigation', () => {
    it('should handle slide navigation correctly', async () => {
      const slides: Slide[] = [
        { id: '1', content: 'Slide 1' },
        { id: '2', content: 'Slide 2' },
        { id: '3', content: 'Slide 3' }
      ];

      // Test initial state
      const { container } = render(
        <KineticSlider slides={slides} initialSlide={0} />
      );

      const slider = container.querySelector('.kinetic-slider-container');
      expect(slider).toBeDefined();

      // Verify initial state
      let slideElements = container.querySelectorAll('[aria-roledescription="slide"]');
      expect(slideElements[0]).toHaveAttribute('aria-current', 'true');
      expect(slideElements[1]).toHaveAttribute('aria-current', 'false');
      expect(slideElements[2]).toHaveAttribute('aria-current', 'false');

      // Trigger navigation
      await act(async () => {
        fireEvent.keyDown(slider!, { key: 'ArrowRight' });
        startAnimation();
      });

      // Verify GSAP animation was triggered with correct parameters
      expect(gsapMock.gsap.to).toHaveBeenCalledWith(
        expect.any(Element),
        expect.objectContaining({
          x: -100,
          duration: 0.5,
          ease: 'power2.out',
          onComplete: expect.any(Function)
        })
      );

      // Complete the animation
      await act(async () => {
        completeAnimation();
      });

      // Verify final state after animation
      slideElements = container.querySelectorAll('[aria-roledescription="slide"]');
      expect(slideElements[0]).toHaveAttribute('aria-current', 'false');
      expect(slideElements[1]).toHaveAttribute('aria-current', 'true');
      expect(slideElements[2]).toHaveAttribute('aria-current', 'false');
    });
  });

  describe('Animation', () => {
    it('creates GSAP animation with correct configuration', async () => {
      const { container } = render(<KineticSlider slides={mockSlides} />);
      const slider = container.querySelector('.kinetic-slider-container');
      expect(slider).toBeDefined();

      // Initial state
      expect(gsapMock.gsap.isAnimating()).toBe(false);

      // Trigger animation
      fireEvent.keyDown(slider!, { key: 'ArrowRight' });
      startAnimation();
      
      // Verify animation was triggered with correct config
      expect(gsapMock.gsap.to).toHaveBeenCalledWith(
        expect.any(Element),
        expect.objectContaining({
          x: -100,
          duration: 0.5,
          ease: 'power2.out',
          onComplete: expect.any(Function)
        })
      );

      // Verify animation is in progress
      expect(gsapMock.gsap.isAnimating()).toBe(true);

      // Complete animation
      await act(async () => {
        completeAnimation();
      });

      // Verify animation completed
      expect(gsapMock.gsap.isAnimating()).toBe(false);
    });

    it('handles animation completion correctly', async () => {
      const onSlideChange = vi.fn();
      const onAnimationComplete = vi.fn();
      const slides: Slide[] = [
        { id: '1', content: 'Slide 1' },
        { id: '2', content: 'Slide 2' }
      ];

      const { container } = render(
        <KineticSlider 
          slides={slides}
          onSlideChange={onSlideChange}
          onAnimationComplete={onAnimationComplete}
        />
      );

      const slider = container.querySelector('.kinetic-slider-container');
      expect(slider).toBeDefined();

      // Initial state
      expect(onSlideChange).not.toHaveBeenCalled();
      expect(onAnimationComplete).not.toHaveBeenCalled();
      
      // Trigger animation
      await act(async () => {
        fireEvent.keyDown(slider!, { key: 'ArrowRight' });
        startAnimation();
      });

      // Verify animation started
      expect(gsapMock.gsap.to).toHaveBeenCalled();
      expect(gsapMock.gsap.isAnimating()).toBe(true);

      // Complete animation
      await act(async () => {
        completeAnimation();
      });

      // Verify callbacks were called
      expect(onSlideChange).toHaveBeenCalledWith(1);
      expect(onAnimationComplete).toHaveBeenCalled();
      expect(gsapMock.gsap.isAnimating()).toBe(false);
    });
  });

  describe('Rendering', () => {
    it('renders slides correctly', () => {
      const { container } = render(<KineticSlider slides={mockSlides} />);
      const slides = container.querySelectorAll('[aria-roledescription="slide"]');
      expect(slides).toHaveLength(mockSlides.length);
      slides.forEach((slide, index) => {
        if (slide.textContent !== null && mockSlides[index]?.content) {
          expect(slide.textContent).toContain(mockSlides[index].content);
        }
      });
    });

    it('applies correct ARIA attributes', () => {
      const { container } = render(<KineticSlider slides={mockSlides} />);
      const slider = container.querySelector('.kinetic-slider-container');
      expect(slider).toHaveAttribute('aria-label', 'Image slider');
      
      const slides = container.querySelectorAll('[aria-roledescription="slide"]');
      expect(slides[0]).toHaveAttribute('aria-current', 'true');
      expect(slides[1]).toHaveAttribute('aria-current', 'false');
    });
  });

  describe('Error Handling', () => {
    it('handles missing slides gracefully', () => {
      const onError = vi.fn();
      const { container } = render(
        <KineticSlider slides={[]} onError={onError} />
      );
      expect(container).toBeInTheDocument();
      expect(container.querySelector('.kinetic-slider-container')).toBeNull();
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('handles single slide correctly', () => {
      const slides: Slide[] = [
        { id: '1', content: 'Single Slide' }
      ];

      const { container } = render(
        <KineticSlider slides={slides} />
      );

      const slider = container.querySelector('.kinetic-slider-container');
      expect(slider).toBeInTheDocument();
      expect(slider?.children).toHaveLength(1);
    });
  });
}); 