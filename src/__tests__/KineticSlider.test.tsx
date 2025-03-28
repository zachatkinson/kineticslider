/* eslint-env jest */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { KineticSlider } from '../KineticSlider';

// Use the global mocks
declare global {
  var gsapMock: jest.Mocked<typeof import('gsap').default>;
  var timelineMock: jest.Mocked<any>;
}

describe('KineticSlider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Animations', () => {
    it('uses correct animation duration', async () => {
      render(
        <KineticSlider>
          <div>Slide 1</div>
          <div>Slide 2</div>
        </KineticSlider>
      );

      await act(async () => {
        fireEvent.keyDown(document, { key: 'ArrowRight' });
        jest.advanceTimersByTime(100);
      });

      expect(global.gsapMock.timeline).toHaveBeenCalled();
      expect(global.gsapMock.timeline).toHaveBeenCalledWith(
        expect.objectContaining({
          defaults: expect.objectContaining({
            duration: 0.8,
          }),
        })
      );
    });

    it('uses correct easing function', async () => {
      render(
        <KineticSlider>
          <div>Slide 1</div>
          <div>Slide 2</div>
        </KineticSlider>
      );

      await act(async () => {
        fireEvent.keyDown(document, { key: 'ArrowRight' });
        jest.advanceTimersByTime(100);
      });

      expect(global.gsapMock.timeline).toHaveBeenCalledWith(
        expect.objectContaining({
          defaults: expect.objectContaining({
            ease: 'power3.out',
          }),
        })
      );
    });
  });

  describe('Gesture Controls', () => {
    it('disables gesture controls when enableGestures is false', () => {
      render(
        <KineticSlider enableGestures={false}>
          <div>Slide 1</div>
          <div>Slide 2</div>
        </KineticSlider>
      );

      const slider = screen.getByTestId('kinetic-slider');
      expect(slider).not.toHaveAttribute('role', 'region');
    });

    it('handles touch events correctly', async () => {
      render(
        <KineticSlider>
          <div>Slide 1</div>
          <div>Slide 2</div>
        </KineticSlider>
      );

      const slider = screen.getByTestId('kinetic-slider');

      await act(async () => {
        fireEvent.touchStart(slider, {
          touches: [{ clientX: 0, clientY: 0 }],
        });
        fireEvent.touchMove(slider, {
          touches: [{ clientX: -100, clientY: 0 }],
        });
        fireEvent.touchEnd(slider);
        jest.advanceTimersByTime(100);
      });

      expect(global.gsapMock.timeline).toHaveBeenCalled();
    });

    it('handles mouse drag events correctly', async () => {
      render(
        <KineticSlider>
          <div>Slide 1</div>
          <div>Slide 2</div>
        </KineticSlider>
      );

      const slider = screen.getByTestId('kinetic-slider');

      await act(async () => {
        fireEvent.mouseDown(slider, { clientX: 0, clientY: 0 });
        fireEvent.mouseMove(slider, { clientX: -100, clientY: 0 });
        fireEvent.mouseUp(slider);
        jest.advanceTimersByTime(100);
      });

      expect(global.gsapMock.timeline).toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('handles keyboard navigation', async () => {
      const onChange = jest.fn();
      render(
        <KineticSlider onChange={onChange}>
          <div>Slide 1</div>
          <div>Slide 2</div>
        </KineticSlider>
      );

      await act(async () => {
        fireEvent.keyDown(document, { key: 'ArrowRight' });
        jest.advanceTimersByTime(100);
        // Trigger the animation completion callback
        const onComplete = global.timelineMock.to.mock.calls[0][1].onComplete;
        onComplete?.();
      });

      expect(onChange).toHaveBeenCalledWith(1);
    });

    it('respects infinite prop', async () => {
      const onChange = jest.fn();
      render(
        <KineticSlider onChange={onChange} infinite={false}>
          <div>Slide 1</div>
          <div>Slide 2</div>
        </KineticSlider>
      );

      await act(async () => {
        fireEvent.keyDown(document, { key: 'ArrowRight' });
        jest.advanceTimersByTime(100);
        // Trigger the animation completion callback
        const onComplete = global.timelineMock.to.mock.calls[0][1].onComplete;
        onComplete?.();
      });

      expect(onChange).toHaveBeenCalledWith(1);

      await act(async () => {
        fireEvent.keyDown(document, { key: 'ArrowRight' });
        jest.advanceTimersByTime(100);
      });

      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('uses correct initial index', () => {
      const initialIndex = 1;
      render(
        <KineticSlider initialIndex={initialIndex}>
          <div>Slide 1</div>
          <div>Slide 2</div>
          <div>Slide 3</div>
        </KineticSlider>
      );

      const slides = screen.getAllByTestId('slide');
      expect(slides[initialIndex]).toHaveClass('active');
    });
  });

  describe('Event Handlers', () => {
    it('calls onChange when slide changes', async () => {
      const onChange = jest.fn();
      render(
        <KineticSlider onChange={onChange}>
          <div>Slide 1</div>
          <div>Slide 2</div>
        </KineticSlider>
      );

      await act(async () => {
        fireEvent.keyDown(document, { key: 'ArrowRight' });
        jest.advanceTimersByTime(100);
        // Trigger the animation completion callback
        const onComplete = global.timelineMock.to.mock.calls[0][1].onComplete;
        onComplete?.();
      });

      expect(onChange).toHaveBeenCalledWith(1);
    });

    it('handles rapid navigation correctly', async () => {
      const onChange = jest.fn();
      render(
        <KineticSlider onChange={onChange}>
          <div>Slide 1</div>
          <div>Slide 2</div>
          <div>Slide 3</div>
        </KineticSlider>
      );

      await act(async () => {
        fireEvent.keyDown(document, { key: 'ArrowRight' });
        jest.advanceTimersByTime(50);
        fireEvent.keyDown(document, { key: 'ArrowRight' });
        jest.advanceTimersByTime(50);
        fireEvent.keyDown(document, { key: 'ArrowRight' });
        jest.advanceTimersByTime(200);
        // Trigger the animation completion callback
        const onComplete = global.timelineMock.to.mock.calls[0][1].onComplete;
        onComplete?.();
      });

      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance Optimizations', () => {
    it('debounces drag events', async () => {
      render(
        <KineticSlider>
          <div>Slide 1</div>
          <div>Slide 2</div>
        </KineticSlider>
      );

      const slider = screen.getByTestId('kinetic-slider');

      await act(async () => {
        fireEvent.mouseDown(slider, { clientX: 0, clientY: 0 });
        
        // Simulate multiple rapid mouse moves
        for (let i = 0; i < 10; i++) {
          fireEvent.mouseMove(slider, { clientX: -10 * i, clientY: 0 });
          jest.advanceTimersByTime(10);
        }

        fireEvent.mouseUp(slider);
        jest.advanceTimersByTime(100);
      });

      expect(global.gsapMock.timeline).toHaveBeenCalledTimes(2);
    });

    it('handles window resize correctly', async () => {
      render(
        <KineticSlider>
          <div>Slide 1</div>
          <div>Slide 2</div>
        </KineticSlider>
      );

      await act(async () => {
        global.innerWidth = 800;
        global.innerHeight = 600;
        fireEvent.resize(window);
        jest.advanceTimersByTime(100);
      });

      expect(global.gsapMock.set).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty children gracefully', () => {
      render(<KineticSlider>{[]}</KineticSlider>);
      const slider = screen.getByTestId('kinetic-slider');
      expect(slider).toBeInTheDocument();
    });

    it('handles single child correctly', () => {
      render(
        <KineticSlider>
          <div>Single Slide</div>
        </KineticSlider>
      );

      const slider = screen.getByTestId('kinetic-slider');
      expect(slider).toBeInTheDocument();
      expect(screen.queryByLabelText(/previous slide/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/next slide/i)).not.toBeInTheDocument();
    });

    it('handles rapid navigation attempts during animation', async () => {
      const onChange = jest.fn();
      render(
        <KineticSlider onChange={onChange}>
          <div>Slide 1</div>
          <div>Slide 2</div>
          <div>Slide 3</div>
        </KineticSlider>
      );

      await act(async () => {
        fireEvent.keyDown(document, { key: 'ArrowRight' });
        jest.advanceTimersByTime(50);
        fireEvent.keyDown(document, { key: 'ArrowRight' });
        jest.advanceTimersByTime(50);
        fireEvent.keyDown(document, { key: 'ArrowRight' });
        jest.advanceTimersByTime(200);
        // Trigger the animation completion callback
        const onComplete = global.timelineMock.to.mock.calls[0][1].onComplete;
        onComplete?.();
      });

      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });
}); 