/* eslint-env vitest */
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { KineticSlider } from '../../components/KineticSlider';
import type { Slide } from '../../types';
import { createSlideId } from '../../utils/id-helpers';

// Mock gsap animation for testing
const mockTo = vi.fn().mockImplementation((target: any, config: any) => {
  if (config.onComplete) {
    setTimeout(() => config.onComplete(), 10); // Simulate animation completion
  }
  return { kill: vi.fn() }; // Return a killable animation
});

const mockSet = vi.fn();

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

// Mock gsap
vi.stubGlobal('gsap', {
  to: mockTo,
  set: mockSet,
});

// Mock analytics and error tracking
vi.stubGlobal('analytics', {
  track: vi.fn(),
});

vi.stubGlobal('errorTracker', {
  captureError: vi.fn(),
});

// Create mock data
const createMockSlides = (count: number): Slide[] => {
  return Array.from({ length: count }).map((_, index) => ({
    id: createSlideId(`slide-${index + 1}`),
    title: `Test Slide ${index + 1}`,
    description: `Test Description ${index + 1}`,
    image: `/images/test${index + 1}.jpg`,
    alt: `Test Image ${index + 1}`,
  }));
};

const mockSlides = createMockSlides(5);

describe('KineticSlider Integration Tests - Gesture Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles complex touch gesture interactions correctly', async () => {
    const onSlideChange = vi.fn();
    const { container } = render(
      <KineticSlider 
        slides={mockSlides} 
        onSlideChange={onSlideChange} 
        initialSlide={2}
      />
    );

    const slider = screen.getByRole('region');
    
    // Test rapid consecutive swipes
    // First swipe left
    fireEvent.touchStart(slider, {
      touches: [{ clientX: 300, clientY: 100 }],
    });
    
    fireEvent.touchEnd(slider, {
      changedTouches: [{ clientX: 100, clientY: 100 }],
    });
    
    // Wait for animation to complete
    await waitFor(() => {
      expect(onSlideChange).toHaveBeenCalledWith(3);
    });
    
    // Reset mock for next assertion
    onSlideChange.mockClear();
    
    // Second swipe left immediately after
    fireEvent.touchStart(slider, {
      touches: [{ clientX: 300, clientY: 100 }],
    });
    
    fireEvent.touchEnd(slider, {
      changedTouches: [{ clientX: 100, clientY: 100 }],
    });
    
    // Wait for animation to complete
    await waitFor(() => {
      expect(onSlideChange).toHaveBeenCalledWith(4);
    });
  });
  
  it('handles incomplete gestures correctly', async () => {
    const onSlideChange = vi.fn();
    const { container } = render(
      <KineticSlider 
        slides={mockSlides} 
        onSlideChange={onSlideChange}
      />
    );

    const slider = screen.getByRole('region');
    
    // Start a gesture but don't complete it with enough movement
    fireEvent.touchStart(slider, {
      touches: [{ clientX: 300, clientY: 100 }],
    });
    
    fireEvent.touchEnd(slider, {
      changedTouches: [{ clientX: 280, clientY: 100 }], // Small movement, less than threshold
    });
    
    // Expect no slide change since movement was small
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(onSlideChange).not.toHaveBeenCalled();
  });
  
  it('handles complex gesture patterns with infinite loop', async () => {
    const onSlideChange = vi.fn();
    const { container } = render(
      <KineticSlider 
        slides={mockSlides} 
        onSlideChange={onSlideChange}
        infiniteLoop={true}
        initialSlide={0}
      />
    );

    const slider = screen.getByRole('region');
    
    // Swipe right from first slide to trigger loop to last slide
    fireEvent.touchStart(slider, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    
    fireEvent.touchEnd(slider, {
      changedTouches: [{ clientX: 300, clientY: 100 }],
    });
    
    // Wait for animation to complete
    await waitFor(() => {
      expect(onSlideChange).toHaveBeenCalledWith(4);
    });
    
    // Reset mock for next assertion
    onSlideChange.mockClear();
    
    // Swipe right again to go to slide 3
    fireEvent.touchStart(slider, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    
    fireEvent.touchEnd(slider, {
      changedTouches: [{ clientX: 300, clientY: 100 }],
    });
    
    // Wait for animation to complete
    await waitFor(() => {
      expect(onSlideChange).toHaveBeenCalledWith(3);
    });
    
    // Reset mock for next assertion
    onSlideChange.mockClear();
    
    // Swipe left multiple times to loop around to the beginning
    for (let i = 3; i < 8; i++) {
      fireEvent.touchStart(slider, {
        touches: [{ clientX: 300, clientY: 100 }],
      });
      
      fireEvent.touchEnd(slider, {
        changedTouches: [{ clientX: 100, clientY: 100 }],
      });
      
      // Wait for animation to complete
      await waitFor(() => {
        const expectedSlide = (i + 1) % 5; // Loop around to beginning
        expect(onSlideChange).toHaveBeenLastCalledWith(expectedSlide);
      });
      
      onSlideChange.mockClear();
    }
  });
  
  it('properly prevents default on touchmove to avoid page scrolling', async () => {
    const { container } = render(
      <KineticSlider slides={mockSlides} />
    );

    const slider = screen.getByRole('region');
    
    // Create a touch move event with preventDefault spy
    const preventDefault = vi.fn();
    fireEvent.touchStart(slider, {
      touches: [{ clientX: 300, clientY: 100 }],
    });
    
    // Fire touch move with mocked preventDefault
    const touchMoveEvent = new TouchEvent('touchmove', {
      bubbles: true,
      cancelable: true,
      touches: [
        new Touch({
          identifier: 0,
          target: slider,
          clientX: 200,
          clientY: 100,
          pageX: 200,
          pageY: 100,
        }),
      ],
    });
    
    // Manually attach preventDefault mock since fireEvent doesn't support it
    Object.defineProperty(touchMoveEvent, 'preventDefault', {
      value: preventDefault,
    });
    
    // Dispatch the event directly to ensure preventDefault is called
    slider.dispatchEvent(touchMoveEvent);
    
    // Expect preventDefault to have been called to prevent page scrolling
    expect(preventDefault).toHaveBeenCalled();
  });
}); 