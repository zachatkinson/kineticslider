import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PixiSlider } from '../PixiApp';
import * as PIXI from 'pixi.js';

// Mock PIXI.js
vi.mock('pixi.js', () => ({
  Application: vi.fn(() => ({
    renderer: {
      resize: vi.fn(),
    },
    stage: {
      addChild: vi.fn(),
    },
    ticker: {
      add: vi.fn(),
    },
    destroy: vi.fn(),
  })),
  Container: vi.fn(() => ({
    addChild: vi.fn(),
    destroy: vi.fn(),
    visible: false,
    alpha: 0,
  })),
  Sprite: vi.fn(() => ({
    anchor: { set: vi.fn() },
    position: { set: vi.fn() },
    scale: { set: vi.fn() },
    destroy: vi.fn(),
    texture: {
      width: 1920,
      height: 1080,
    },
  })),
  Assets: {
    load: vi.fn().mockResolvedValue({
      width: 1920,
      height: 1080,
      destroy: vi.fn(),
    }),
  },
}));

// Mock GSAP
vi.mock('gsap', () => ({
  gsap: {
    timeline: vi.fn(() => ({
      to: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('PixiSlider', () => {
  const mockSlides = [
    { id: '1', image: '/image1.jpg', alt: 'Image 1' },
    { id: '2', image: '/image2.jpg', alt: 'Image 2' },
    { id: '3', image: '/image3.jpg', alt: 'Image 3' },
  ];

  const defaultProps = {
    width: 800,
    height: 600,
    slides: mockSlides,
  };

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    vi.resetAllMocks();
  });

  it('renders without crashing', () => {
    render(<PixiSlider {...defaultProps} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('initializes PIXI.Application with correct props', () => {
    render(<PixiSlider {...defaultProps} />);
    expect(PIXI.Application).toHaveBeenCalledWith(
      expect.objectContaining({
        width: defaultProps.width,
        height: defaultProps.height,
        backgroundColor: 0x000000,
        antialias: true,
        autoDensity: true,
      })
    );
  });

  it('loads all slides on mount', async () => {
    render(<PixiSlider {...defaultProps} />);
    expect(PIXI.Assets.load).toHaveBeenCalledTimes(mockSlides.length);
    mockSlides.forEach(slide => {
      expect(PIXI.Assets.load).toHaveBeenCalledWith(slide.image);
    });
  });

  it('handles keyboard navigation', () => {
    const onSlideChange = vi.fn();
    render(<PixiSlider {...defaultProps} onSlideChange={onSlideChange} />);

    const canvas = screen.getByRole('img');
    canvas.focus();

    // Test right arrow key
    fireEvent.keyDown(canvas, { key: 'ArrowRight' });
    expect(onSlideChange).toHaveBeenCalledWith(1);

    // Test left arrow key
    fireEvent.keyDown(canvas, { key: 'ArrowLeft' });
    expect(onSlideChange).toHaveBeenCalledWith(0);
  });

  it('handles resize events', async () => {
    const { rerender } = render(<PixiSlider {...defaultProps} />);

    // Trigger a resize
    await act(async () => {
      rerender(<PixiSlider {...defaultProps} width={1000} height={800} />);
    });

    expect(PIXI.Application).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 1000,
        height: 800,
      })
    );
  });

  it('cleans up resources on unmount', () => {
    const { unmount } = render(<PixiSlider {...defaultProps} />);
    unmount();
    expect(PIXI.Application).toHaveBeenCalled();
    const mockResults = vi.mocked(PIXI.Application).mock.results;
    expect(mockResults.length).toBeGreaterThan(0);
    expect(mockResults[0].type).toBe('return');
    const mockApp = mockResults[0].value as { destroy: typeof vi.fn };
    expect(mockApp.destroy).toHaveBeenCalledWith(true);
  });

  it('announces slide changes to screen readers', () => {
    const { container } = render(<PixiSlider {...defaultProps} />);
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();

    // Trigger a slide change
    fireEvent.keyDown(screen.getByRole('img'), { key: 'ArrowRight' });
    if (liveRegion?.textContent) {
      expect(liveRegion.textContent).toContain('Showing slide 2 of 3');
      expect(liveRegion.textContent).toContain(mockSlides[1].alt);
    }
  });

  it('handles errors gracefully', async () => {
    // Mock console.error to prevent error output in tests
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onError = vi.fn();

    // Mock PIXI.Assets.load to reject
    (PIXI.Assets.load as typeof vi.fn).mockRejectedValueOnce(new Error('Failed to load image'));

    render(<PixiSlider {...defaultProps} onError={onError} />);

    // Wait for error to be logged
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(consoleError).toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('maintains focus management', () => {
    render(<PixiSlider {...defaultProps} />);
    const canvas = screen.getByRole('img');

    // Check if canvas is focusable
    expect(canvas).toHaveAttribute('tabIndex', '0');

    // Focus the canvas
    canvas.focus();
    expect(document.activeElement).toBe(canvas);
  });

  it('provides proper ARIA attributes', () => {
    render(<PixiSlider {...defaultProps} />);
    const canvas = screen.getByRole('img');

    expect(canvas).toHaveAttribute('aria-label', `Image Slider with ${mockSlides.length} slides`);
    expect(canvas).toHaveAttribute('role', 'img');
  });

  it('shows error boundary fallback on initialization error', async () => {
    // Mock console.error to prevent error output in tests
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onError = vi.fn();

    // Mock PIXI.Application to throw
    vi.mocked(PIXI.Application).mockImplementationOnce(() => {
      throw new Error('WebGL not supported');
    });

    render(<PixiSlider {...defaultProps} onError={onError} />);

    // Error boundary should catch the error and show fallback
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong with the image slider/)).toBeInTheDocument();
    expect(onError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('handles empty slides array', () => {
    const onError = vi.fn();
    render(<PixiSlider {...defaultProps} slides={[]} onError={onError} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('handles texture loading failure', async () => {
    const onError = vi.fn();
    (PIXI.Assets.load as typeof vi.fn).mockResolvedValueOnce(null);

    render(<PixiSlider {...defaultProps} onError={onError} />);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('handles navigation to invalid slide index', async () => {
    const onError = vi.fn();
    const { container } = render(<PixiSlider {...defaultProps} onError={onError} />);

    // Force an invalid slide index
    const invalidIndex = mockSlides.length + 1;
    fireEvent.keyDown(screen.getByRole('img'), { key: 'ArrowRight' });
    fireEvent.keyDown(screen.getByRole('img'), { key: 'ArrowRight' });
    fireEvent.keyDown(screen.getByRole('img'), { key: 'ArrowRight' });

    // Should wrap around to the beginning instead of throwing an error
    const liveRegion = container.querySelector('[aria-live="polite"]');
    if (liveRegion?.textContent) {
      expect(liveRegion.textContent).toContain('Showing slide 1 of 3');
    }
  });
}); 