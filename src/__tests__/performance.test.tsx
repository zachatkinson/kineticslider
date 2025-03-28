/* eslint-env jest */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { KineticSlider } from '../KineticSlider';
import { performance } from 'perf_hooks';

describe('KineticSlider Performance', () => {
  // Helper to generate large number of slides
  const generateSlides = (count: number) => {
    return Array.from({ length: count }, (_, i) => (
      <div key={i} data-testid={`slide-${i}`} style={{ background: `hsl(${i * 360 / count}, 70%, 70%)` }}>
        Slide {i + 1}
      </div>
    ));
  };

  // Helper to measure execution time
  const measureExecutionTime = async (callback: () => Promise<void> | void) => {
    const start = performance.now();
    await callback();
    return performance.now() - start;
  };

  // Memory usage helper
  const getMemoryUsage = () => {
    if (global.gc) {
      global.gc(); // Force garbage collection if available
    }
    return process.memoryUsage().heapUsed / 1024 / 1024; // Convert to MB
  };

  describe('Render Performance', () => {
    it('renders quickly with few slides', async () => {
      const renderTime = await measureExecutionTime(async () => {
        await act(async () => {
          render(
            <KineticSlider>
              {generateSlides(3)}
            </KineticSlider>
          );
        });
      });

      expect(renderTime).toBeLessThan(100); // Should render in under 100ms
    });

    it('renders efficiently with many slides when lazy loading is enabled', async () => {
      const initialMemory = getMemoryUsage();
      
      const renderTime = await measureExecutionTime(async () => {
        await act(async () => {
          render(
            <KineticSlider lazyLoad>
              {generateSlides(100)}
            </KineticSlider>
          );
        });
      });

      const memoryUsed = getMemoryUsage() - initialMemory;

      expect(renderTime).toBeLessThan(200); // Should render in under 200ms
      expect(memoryUsed).toBeLessThan(10); // Should use less than 10MB additional memory
    });
  });

  describe('Animation Performance', () => {
    it('maintains smooth animations during rapid navigation', async () => {
      const onChange = jest.fn();
      let slider: HTMLElement;
      
      render(
        <KineticSlider onChange={onChange}>
          {generateSlides(10)}
        </KineticSlider>
      );
      
      slider = await screen.findByTestId('kinetic-slider');

      const animationTime = await measureExecutionTime(async () => {
        for (let i = 0; i < 5; i++) {
          await act(async () => {
            // Simulate right arrow key press instead of clicking next button
            fireEvent.keyDown(document, { key: 'ArrowRight' });
            // Wait for animation frame
            await new Promise(resolve => requestAnimationFrame(resolve));
          });
        }
      });

      const averageFrameTime = animationTime / 5;
      expect(averageFrameTime).toBeLessThan(20); // Target 50fps (20ms per frame)
    });
  });

  describe('Gesture Performance', () => {
    it('handles rapid drag events efficiently', async () => {
      let slider: HTMLElement;
      
      render(
        <KineticSlider>
          {generateSlides(5)}
        </KineticSlider>
      );
      
      slider = await screen.findByTestId('kinetic-slider');

      const dragTime = await measureExecutionTime(async () => {
        // Simulate rapid drag movements
        await act(async () => {
          fireEvent.mouseDown(slider, { clientX: 0, clientY: 0 });
          for (let i = 0; i < 50; i++) {
            fireEvent.mouseMove(document, { clientX: -i * 2, clientY: 0 });
            // Wait for next frame
            await new Promise(resolve => requestAnimationFrame(resolve));
          }
          fireEvent.mouseUp(document);
        });
      });

      const averageEventTime = dragTime / 50;
      expect(averageEventTime).toBeLessThan(18); // Allow slightly more time for gesture processing
    });
  });

  describe('Memory Management', () => {
    it('cleans up resources properly', async () => {
      let slider: HTMLElement;
      let unmount: () => void;
      
      const result = render(
        <KineticSlider>
          {generateSlides(20)}
        </KineticSlider>
      );
      unmount = result.unmount;
      slider = await screen.findByTestId('kinetic-slider');

      await act(async () => {
        fireEvent.mouseDown(slider, { clientX: 0, clientY: 0 });
        fireEvent.mouseMove(document, { clientX: -100, clientY: 0 });
        fireEvent.mouseUp(document);
      });

      const memoryBefore = getMemoryUsage();
      await act(async () => {
        unmount();
      });
      const memoryAfter = getMemoryUsage();

      expect(memoryAfter).toBeLessThanOrEqual(memoryBefore + 2); // Allow 2MB variance
    });

    it('manages memory efficiently with lazy loading', async () => {
      let slider: HTMLElement;
      let unmount: () => void;
      
      const result = render(
        <KineticSlider lazyLoad>
          {generateSlides(100)}
        </KineticSlider>
      );
      unmount = result.unmount;
      slider = await screen.findByTestId('kinetic-slider');

      const initialMemory = getMemoryUsage();

      // Navigate through slides using keyboard instead of buttons
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          fireEvent.keyDown(document, { key: 'ArrowRight' });
          await new Promise(resolve => setTimeout(resolve, 100));
        });
      }

      const memoryDuringNavigation = getMemoryUsage();
      await act(async () => {
        unmount();
      });
      const memoryAfterUnmount = getMemoryUsage();

      expect(memoryDuringNavigation - initialMemory).toBeLessThan(83); // Allow up to 83MB during navigation
      expect(memoryAfterUnmount).toBeLessThanOrEqual(initialMemory + 2); // Allow 2MB variance after cleanup
    });
  });
}); 