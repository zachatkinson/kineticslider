/* eslint-env vitest */
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { KineticSlider } from '../../components/KineticSlider';
import type { Slide } from '../../types';
import { createSlideId } from '../../utils/id-helpers';
// Import the mock which will override the global gsap object
import './mocks/gsap.mock';

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
  {
    id: createSlideId('slide-3'),
    title: 'Test Slide 3',
    description: 'Test Description 3',
    image: '/images/test3.jpg',
    alt: 'Test Image 3',
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

  it('navigates to the next slide when next button is clicked', async () => {
    const { getByRole } = render(<KineticSlider {...mockProps} />);
    const nextButton = getByRole('button', { name: /next slide/i });
    
    // Click the next button
    fireEvent.click(nextButton);
    
    // Wait for animation to complete
    await waitFor(() => {
      expect(mockProps.onSlideChange).toHaveBeenCalledWith(1);
      expect(mockProps.onAnimationComplete).toHaveBeenCalled();
    });
  });
  
  it('navigates to the previous slide when prev button is clicked', async () => {
    // Start at slide 1 (index 1)
    const { getByRole } = render(
      <KineticSlider {...mockProps} initialSlide={1} />
    );
    const prevButton = getByRole('button', { name: /previous slide/i });
    
    // Click the previous button
    fireEvent.click(prevButton);
    
    // Wait for animation to complete
    await waitFor(() => {
      expect(mockProps.onSlideChange).toHaveBeenCalledWith(0);
      expect(mockProps.onAnimationComplete).toHaveBeenCalled();
    });
  });
  
  it('responds to keyboard navigation', async () => {
    render(<KineticSlider {...mockProps} />);
    
    // Press right arrow key
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    
    // Wait for animation to complete
    await waitFor(() => {
      expect(mockProps.onSlideChange).toHaveBeenCalledWith(1);
    });
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Press left arrow key
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    
    // Wait for animation to complete
    await waitFor(() => {
      expect(mockProps.onSlideChange).toHaveBeenCalledWith(0);
    });
  });
  
  it('disables previous button at the first slide without infinite loop', () => {
    const { getByRole } = render(<KineticSlider {...mockProps} />);
    const prevButton = getByRole('button', { name: /previous slide/i });
    
    expect(prevButton).toBeDisabled();
  });
  
  it('disables next button at the last slide without infinite loop', () => {
    const { getByRole } = render(
      <KineticSlider {...mockProps} initialSlide={2} />
    );
    const nextButton = getByRole('button', { name: /next slide/i });
    
    expect(nextButton).toBeDisabled();
  });
  
  it('enables navigation buttons at edges with infinite loop enabled', () => {
    // Test first slide with infinite loop
    const { getByRole: getFirstSlideRoles } = render(
      <KineticSlider {...mockProps} infiniteLoop={true} />
    );
    const prevButtonFirstSlide = getFirstSlideRoles('button', { name: /previous slide/i });
    
    expect(prevButtonFirstSlide).not.toBeDisabled();
    
    // Test last slide with infinite loop
    const { getByRole: getLastSlideRoles } = render(
      <KineticSlider {...mockProps} initialSlide={2} infiniteLoop={true} />
    );
    const nextButtonLastSlide = getLastSlideRoles('button', { name: /next slide/i });
    
    expect(nextButtonLastSlide).not.toBeDisabled();
  });
  
  it('loops back to the first slide from the last slide with infinite loop', async () => {
    const { getByRole } = render(
      <KineticSlider {...mockProps} initialSlide={2} infiniteLoop={true} />
    );
    const nextButton = getByRole('button', { name: /next slide/i });
    
    // Click next on the last slide
    fireEvent.click(nextButton);
    
    // Wait for animation to complete
    await waitFor(() => {
      // Verify it looped to the first slide
      expect(mockProps.onSlideChange).toHaveBeenCalledWith(0);
      expect(mockSet).toHaveBeenCalled(); // Should use gsap.set for the jump
    });
  });
  
  it('loops to the last slide from the first slide with infinite loop', async () => {
    const { getByRole } = render(
      <KineticSlider {...mockProps} infiniteLoop={true} />
    );
    const prevButton = getByRole('button', { name: /previous slide/i });
    
    // Click prev on the first slide
    fireEvent.click(prevButton);
    
    // Wait for animation to complete
    await waitFor(() => {
      // Verify it looped to the last slide
      expect(mockProps.onSlideChange).toHaveBeenCalledWith(2);
      expect(mockSet).toHaveBeenCalled(); // Should use gsap.set for the jump
    });
  });
  
  it('handles gesture swipe left for next slide', async () => {
    render(<KineticSlider {...mockProps} />);
    
    // Simulate swipe left
    fireEvent.touchStart(screen.getByRole('region'), {
      touches: [{ clientX: 300, clientY: 100 }],
    });
    
    fireEvent.touchEnd(screen.getByRole('region'), {
      changedTouches: [{ clientX: 100, clientY: 100 }],
    });
    
    // Wait for animation to complete
    await waitFor(() => {
      expect(mockProps.onSlideChange).toHaveBeenCalledWith(1);
    });
  });
  
  it('handles gesture swipe right for previous slide', async () => {
    render(<KineticSlider {...mockProps} initialSlide={1} />);
    
    // Simulate swipe right
    fireEvent.touchStart(screen.getByRole('region'), {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    
    fireEvent.touchEnd(screen.getByRole('region'), {
      changedTouches: [{ clientX: 300, clientY: 100 }],
    });
    
    // Wait for animation to complete
    await waitFor(() => {
      expect(mockProps.onSlideChange).toHaveBeenCalledWith(0);
    });
  });
});
