import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { KineticSlider } from '@/components/KineticSlider';
import { mockSlides, mockSliderProps } from '../mocks/sliderMocks';

describe('KineticSlider Integration', () => {
  it('integrates with keyboard navigation system', async () => {
    const onSlideChange = vi.fn();
    const user = userEvent.setup();
    render(<KineticSlider {...mockSliderProps} onSlideChange={onSlideChange} />);

    // Test keyboard navigation integration
    await user.keyboard('{ArrowRight}');
    expect(onSlideChange).toHaveBeenCalledWith(1);
    expect(screen.getByAltText('Slide 2 description')).toBeInTheDocument();

    await user.keyboard('{ArrowLeft}');
    expect(onSlideChange).toHaveBeenCalledWith(0);
    expect(screen.getByAltText('Slide 1 description')).toBeInTheDocument();
  });

  it('integrates with touch gesture system', async () => {
    const onSlideChange = vi.fn();
    render(<KineticSlider {...mockSliderProps} onSlideChange={onSlideChange} />);
    const slider = screen.getByTestId('kinetic-slider');

    // Test touch gesture integration
    fireEvent.touchStart(slider, { touches: [{ clientX: 500, clientY: 0 }] });
    fireEvent.touchMove(slider, { touches: [{ clientX: 100, clientY: 0 }] });
    fireEvent.touchEnd(slider);

    await waitFor(() => {
      expect(onSlideChange).toHaveBeenCalledWith(1);
      expect(screen.getByAltText('Slide 2 description')).toBeInTheDocument();
    });
  });

  it('integrates with animation system', async () => {
    const onAnimationComplete = vi.fn();
    render(
      <KineticSlider
        {...mockSliderProps}
        onAnimationComplete={onAnimationComplete}
      />
    );

    const slider = screen.getByTestId('kinetic-slider');
    
    // Test animation system integration
    fireEvent.touchStart(slider, { touches: [{ clientX: 500, clientY: 0 }] });
    fireEvent.touchMove(slider, { touches: [{ clientX: 100, clientY: 0 }] });
    fireEvent.touchEnd(slider);

    await waitFor(() => {
      expect(onAnimationComplete).toHaveBeenCalled();
    });
  });

  it('integrates with infinite loop system', async () => {
    const user = userEvent.setup();
    render(<KineticSlider {...mockSliderProps} infiniteLoop={true} />);

    // Test infinite loop system integration
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByAltText('Slide 3 description')).toBeInTheDocument();

    await user.keyboard('{ArrowRight}');
    await user.keyboard('{ArrowRight}');
    await user.keyboard('{ArrowRight}');
    expect(screen.getByAltText('Slide 1 description')).toBeInTheDocument();
  });
}); 