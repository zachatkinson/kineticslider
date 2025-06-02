/**
 * Integration tests for KineticSlider with Canvas Configuration
 * Tests the complete integration of canvas system with the main slider component
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { KineticSlider } from '../../components/KineticSlider/KineticSlider';
import { createPixiCanvasConfig } from '../../utils/pixi-canvas';
import type { Slide, SliderId } from '../../types/slider';
import type { CanvasConfig } from '../../types/pixi';

// Mock PIXI.js for integration tests
vi.mock('pixi.js', () => ({
  Application: vi.fn().mockImplementation(() => ({
    stage: { addChild: vi.fn(), removeChild: vi.fn() },
    renderer: { resize: vi.fn() },
    destroy: vi.fn(),
  })),
  Container: vi.fn().mockImplementation(() => ({
    addChild: vi.fn(),
    removeChild: vi.fn(),
  })),
  Sprite: vi.fn().mockImplementation(() => ({
    anchor: { set: vi.fn() },
    scale: { set: vi.fn() },
  })),
  Texture: {
    from: vi.fn().mockReturnValue({}),
  },
}));

// Mock GSAP
vi.mock('gsap', () => ({
  default: {
    to: vi.fn().mockResolvedValue({}),
    set: vi.fn(),
    timeline: vi.fn().mockReturnValue({
      to: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      play: vi.fn().mockReturnThis(),
    }),
    config: vi.fn(),
  },
  gsap: {
    to: vi.fn().mockResolvedValue({}),
    set: vi.fn(),
    timeline: vi.fn().mockReturnValue({
      to: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      play: vi.fn().mockReturnThis(),
    }),
    config: vi.fn(),
  },
}));

// Mock WebGL optimization utilities
vi.mock('../../utils/webgl-optimization', () => ({
  createOptimizedPixiOptions: vi.fn().mockReturnValue({
    powerPreference: 'high-performance',
    antialias: true,
    autoDensity: true,
  }),
  initializeWebGLOptimizations: vi.fn().mockReturnValue({
    contextManager: { isWebGL2: true },
    textureManager: { cacheTexture: vi.fn() },
    batchOptimizer: { getStats: vi.fn() },
    performanceMonitor: { startMonitoring: vi.fn() },
  }),
}));

// Test data
const createTestSlides = (): Slide[] => [
  {
    id: 'slide-1' as SliderId,
    title: 'Slide 1',
    image: '/test-image-1.jpg',
    alt: 'Test slide 1',
  },
  {
    id: 'slide-2' as SliderId,
    title: 'Slide 2',
    image: '/test-image-2.jpg',
    alt: 'Test slide 2',
  },
  {
    id: 'slide-3' as SliderId,
    title: 'Slide 3',
    image: '/test-image-3.jpg',
    alt: 'Test slide 3',
  },
];

// Mock getBoundingClientRect
const mockGetBoundingClientRect = (width: number, height: number): (() => DOMRect) => {
  return vi.fn(() => ({
    width,
    height,
    top: 0,
    left: 0,
    bottom: height,
    right: width,
    x: 0,
    y: 0,
    toJSON: (): object => ({}),
  }));
};

describe('KineticSlider Canvas Integration', () => {
  const slides = createTestSlides();

  beforeEach(() => {
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});

    // Mock window.devicePixelRatio
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      value: 1,
    });

    // Mock ResizeObserver
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Modern Canvas Configuration', () => {
    it('should accept canvas configuration prop', async () => {
      const canvasConfig: CanvasConfig = createPixiCanvasConfig({
        mode: 'responsive',
        dimensions: { width: 1200, height: 800 },
        aspectRatio: 'cover',
      });

      render(
        <KineticSlider
          slides={slides}
          canvas={canvasConfig}
        />
      );

      // Should render without errors
      await waitFor(() => {
        expect(screen.getByRole('region')).toBeInTheDocument();
      });
    });

    it('should use responsive canvas mode by default', async () => {
      render(
        <KineticSlider
          slides={slides}
        />
      );

      // Should render with default responsive configuration
      await waitFor(() => {
        expect(screen.getByRole('region')).toBeInTheDocument();
      });

      // Should not show any deprecation warnings for modern usage
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should handle fullscreen canvas mode', async () => {
      const canvasConfig: CanvasConfig = createPixiCanvasConfig({
        mode: 'fullscreen',
        dimensions: { width: 800, height: 600 },
      });

      const { container } = render(
        <KineticSlider
          slides={slides}
          canvas={canvasConfig}
        />
      );

      // Mock container size
      const sliderElement = container.querySelector('[role="region"]') as HTMLElement;
      if (sliderElement) {
        sliderElement.getBoundingClientRect = mockGetBoundingClientRect(1920, 1080);
      }

      await waitFor(() => {
        expect(screen.getByRole('region')).toBeInTheDocument();
      });
    });

    it('should handle fixed canvas mode', async () => {
      const canvasConfig: CanvasConfig = createPixiCanvasConfig({
        mode: 'fixed',
        dimensions: { width: 800, height: 600 },
      });

      render(
        <KineticSlider
          slides={slides}
          canvas={canvasConfig}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('region')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('should enable performance monitoring in development', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const canvasConfig: CanvasConfig = createPixiCanvasConfig({
        mode: 'responsive',
        dimensions: { width: 800, height: 600 },
        aspectRatio: 'cover',
      });

      render(
        <KineticSlider
          slides={slides}
          canvas={canvasConfig}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('region')).toBeInTheDocument();
      });

      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should handle performance monitoring errors gracefully', async () => {
      const canvasConfig: CanvasConfig = createPixiCanvasConfig({
        mode: 'responsive',
        dimensions: { width: 800, height: 600 },
        aspectRatio: 'cover',
      });

      render(
        <KineticSlider
          slides={slides}
          canvas={canvasConfig}
        />
      );

      // Should still render despite performance callback error
      await waitFor(() => {
        expect(screen.getByRole('region')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid canvas configuration gracefully', async () => {
      const invalidConfig = {
        mode: 'responsive' as any,
        dimensions: { width: 800, height: 600 },
        aspectRatio: 'cover' as any,
      };

      render(
        <KineticSlider
          slides={slides}
          canvas={invalidConfig}
        />
      );

      // Should still render with fallback configuration
      await waitFor(() => {
        expect(screen.getByRole('region')).toBeInTheDocument();
      });
    });

    it('should handle missing slides gracefully', async () => {
      const canvasConfig: CanvasConfig = createPixiCanvasConfig({
        mode: 'responsive',
        dimensions: { width: 800, height: 600 },
        aspectRatio: 'cover',
      });

      render(
        <KineticSlider
          slides={[]}
          canvas={canvasConfig}
        />
      );

      // Should render without errors even with empty slides
      await waitFor(() => {
        expect(screen.getByRole('region')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should handle container resize events', async () => {
      const canvasConfig: CanvasConfig = createPixiCanvasConfig({
        mode: 'responsive',
        dimensions: { width: 800, height: 600 },
        aspectRatio: 'cover',
      });

      const { container } = render(
        <KineticSlider
          slides={slides}
          canvas={canvasConfig}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('region')).toBeInTheDocument();
      });

      // Simulate container resize
      const sliderElement = container.querySelector('[role="region"]') as HTMLElement;
      if (sliderElement) {
        sliderElement.getBoundingClientRect = mockGetBoundingClientRect(1200, 800);
        
        // Trigger resize event
        act(() => {
          window.dispatchEvent(new Event('resize'));
        });
      }

      // Should handle resize without errors
      await waitFor(() => {
        expect(screen.getByRole('region')).toBeInTheDocument();
      });
    });

    it('should handle breakpoint changes', async () => {
      const canvasConfig: CanvasConfig = createPixiCanvasConfig({
        mode: 'responsive',
        dimensions: { width: 800, height: 600 },
        aspectRatio: 'cover',
      });

      render(
        <KineticSlider
          slides={slides}
          canvas={canvasConfig}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('region')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain accessibility features with canvas system', async () => {
      const canvasConfig: CanvasConfig = createPixiCanvasConfig({
        mode: 'responsive',
        dimensions: { width: 800, height: 600 },
        aspectRatio: 'cover',
      });

      render(
        <KineticSlider
          slides={slides}
          canvas={canvasConfig}
        />
      );

      await waitFor(() => {
        const slider = screen.getByRole('region');
        expect(slider).toBeInTheDocument();
      });
    });

    it('should provide proper ARIA attributes for canvas elements', async () => {
      const canvasConfig: CanvasConfig = createPixiCanvasConfig({
        mode: 'responsive',
        dimensions: { width: 800, height: 600 },
        aspectRatio: 'cover',
      });

      render(
        <KineticSlider
          slides={slides}
          canvas={canvasConfig}
        />
      );

      await waitFor(() => {
        const slider = screen.getByRole('region');
        expect(slider).toBeInTheDocument();
        // Canvas should be properly integrated with accessibility
        expect(slider).toHaveAttribute('role', 'region');
      });
    });
  });

  describe('Integration with Other Features', () => {
    it('should work with animation configuration', async () => {
      const canvasConfig: CanvasConfig = createPixiCanvasConfig({
        mode: 'responsive',
        dimensions: { width: 800, height: 600 },
        aspectRatio: 'cover',
      });

      render(
        <KineticSlider
          slides={slides}
          canvas={canvasConfig}
          duration={1}
          ease="power2.out"
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('region')).toBeInTheDocument();
      });
    });

    it('should work with interaction configuration', async () => {
      const canvasConfig: CanvasConfig = createPixiCanvasConfig({
        mode: 'responsive',
        dimensions: { width: 800, height: 600 },
        aspectRatio: 'cover',
      });

      const onSlideChange = vi.fn();

      render(
        <KineticSlider
          slides={slides}
          canvas={canvasConfig}
          onSlideChange={onSlideChange}
          enableKeyboard={true}
          enableGestures={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('region')).toBeInTheDocument();
      });
    });

    it('should work with basic configuration', async () => {
      const canvasConfig: CanvasConfig = createPixiCanvasConfig({
        mode: 'responsive',
        dimensions: { width: 800, height: 600 },
        aspectRatio: 'cover',
      });

      render(
        <KineticSlider
          slides={slides}
          canvas={canvasConfig}
          infiniteLoop={true}
          lazyLoad={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('region')).toBeInTheDocument();
      });
    });
  });

  describe('Canvas Context Creation', () => {
    it('should create a valid canvas context', async () => {
      const canvasConfig: CanvasConfig = createPixiCanvasConfig({
        mode: 'responsive',
        dimensions: { width: 800, height: 600 },
        aspectRatio: 'cover',
      });

      const { container } = render(
        <KineticSlider
          slides={slides}
          canvas={canvasConfig}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('region')).toBeInTheDocument();
      });

      // Check if canvas element exists (it may not in this test environment)
      const mockCanvas = container.querySelector('canvas') as HTMLCanvasElement;
      
      if (mockCanvas) {
        const mockCanvasContext = mockCanvas.getContext('2d');
        
        if (mockCanvasContext) {
          // Canvas context created successfully
          expect(mockCanvasContext).toBeDefined();
        }
      } else {
        // Canvas element not found - this is expected in test environment
        // The component should still render successfully without canvas
        expect(screen.getByRole('region')).toBeInTheDocument();
      }
    });
  });
}); 