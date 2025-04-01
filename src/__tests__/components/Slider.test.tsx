import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { Slider } from '../Slider';
import { SliderProvider } from '../../../context/SliderContext';
import type { SlideItem, SliderConfig } from '../../../types/slider';

const mockItems: SlideItem[] = [
  {
    id: '1',
    content: <div>Slide 1</div>,
  },
  {
    id: '2',
    content: <div>Slide 2</div>,
  },
  {
    id: '3',
    content: <div>Slide 3</div>,
  },
];

const mockConfig: SliderConfig = {
  direction: 'horizontal',
  animation: {
    duration: 300,
    easing: 'ease-in-out',
  },
  gesture: {
    direction: 'horizontal',
    threshold: 50,
    velocity: 0.5,
    resistance: 1,
  },
  loop: true,
  accessibility: {
    ariaLabel: 'Test Slider',
    keyboardNavigation: true,
    announceSlide: true,
  },
};

describe('Slider', () => {
  const renderSlider = () => {
    return render(
      <SliderProvider items={mockItems} config={mockConfig}>
        <Slider items={mockItems} config={mockConfig} />
      </SliderProvider>
    );
  };

  it('renders without crashing', () => {
    const { container } = renderSlider();
    expect(container).toBeInTheDocument();
  });

  it('renders all slides', () => {
    renderSlider();
    mockItems.forEach((item) => {
      expect(screen.getByText(`Slide ${item.id}`)).toBeInTheDocument();
    });
  });

  it('handles keyboard navigation', () => {
    renderSlider();
    const slider = screen.getByRole('region');
    
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(screen.getByText('Slide 2')).toHaveStyle({ transform: 'translateX(0)' });

    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    expect(screen.getByText('Slide 1')).toHaveStyle({ transform: 'translateX(0)' });
  });

  it('handles gesture navigation', () => {
    renderSlider();
    const slider = screen.getByRole('region');

    fireEvent.mouseDown(slider, { clientX: 500, clientY: 0 });
    fireEvent.mouseMove(slider, { clientX: 300, clientY: 0 });
    fireEvent.mouseUp(slider);

    expect(screen.getByText('Slide 2')).toHaveStyle({ transform: 'translateX(0)' });
  });

  it('respects accessibility attributes', () => {
    renderSlider();
    const slider = screen.getByRole('region');
    
    expect(slider).toHaveAttribute('aria-label', 'Test Slider');
    expect(slider).toHaveAttribute('tabIndex', '0');
    
    const slides = screen.getAllByRole('group');
    expect(slides[0]).toHaveAttribute('aria-label', 'Slide 1 of 3');
  });

  it('handles navigation buttons', () => {
    renderSlider();
    const nextButton = screen.getByLabelText('Next slide');
    const prevButton = screen.getByLabelText('Previous slide');

    fireEvent.click(nextButton);
    expect(screen.getByText('Slide 2')).toHaveStyle({ transform: 'translateX(0)' });

    fireEvent.click(prevButton);
    expect(screen.getByText('Slide 1')).toHaveStyle({ transform: 'translateX(0)' });
  });
}); 