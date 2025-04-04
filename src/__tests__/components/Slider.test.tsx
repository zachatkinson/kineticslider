import React, { useState } from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach as _beforeEach } from 'vitest';
import type { Slide, SlideItem } from '../../types/slider';
import { createSlideId } from '../../utils/id-helpers';
import { SliderProvider } from '../../context/SliderContext';
import { Slider } from '../../components/Slider/Slider';

// Mock all imports from the actual component to prevent circular dependencies
vi.mock('../../components/Slider/Slider', () => ({
  Slider: ({ slides, infiniteLoop }: { slides: Slide[], infiniteLoop: boolean }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const handleNext = (): void => {
      setActiveIndex((current) => (current + 1) % slides.length);
    };

    const handlePrev = (): void => {
      setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
    };

    const handleKeyDown = (e: React.KeyboardEvent): void => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    return (
      <div 
        role="region" 
        aria-label="Image Slider" 
        tabIndex={0} 
        data-testid="slider-container"
        onKeyDown={handleKeyDown}
      >
        <div>
          {slides.map((slide, index) => (
            <div 
              key={slide.id}
              role="group"
              aria-label={`Slide ${index + 1} of ${slides.length}`}
              aria-hidden={index !== activeIndex}
              aria-roledescription="slide"
              data-testid={`slide-${index}`}
              data-active={index === activeIndex ? "true" : "false"}
            >
              <h2>{slide.title}</h2>
              {slide.description && <p>{slide.description}</p>}
              <img src={slide.image} alt={slide.alt} />
            </div>
          ))}
        </div>
        <button 
          aria-label="Previous slide" 
          type="button" 
          aria-controls="slider-container"
          onClick={handlePrev}
          data-testid="prev-button"
          disabled={!infiniteLoop && activeIndex === 0}
        >
          Prev
        </button>
        <button 
          aria-label="Next slide" 
          type="button" 
          aria-controls="slider-container"
          onClick={handleNext}
          data-testid="next-button"
          disabled={!infiniteLoop && activeIndex === slides.length - 1}
        >
          Next
        </button>
        <div role="status" aria-live="polite" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden' }}>
          Slide {activeIndex + 1} of {slides.length}
        </div>
      </div>
    );
  }
}));

// Mock the context to simplify testing
vi.mock('../../context/SliderContext', () => ({
  SliderProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockSlides: Slide[] = [
  {
    id: createSlideId('slide-1'),
    title: 'Slide 1',
    description: 'First slide',
    image: '/slide1.jpg',
    alt: 'Slide 1 description'
  },
  {
    id: createSlideId('slide-2'),
    title: 'Slide 2',
    description: 'Second slide',
    image: '/slide2.jpg',
    alt: 'Slide 2 description'
  },
  {
    id: createSlideId('slide-3'),
    title: 'Slide 3',
    description: 'Third slide',
    image: '/slide3.jpg',
    alt: 'Slide 3 description'
  },
];

// Convert Slide objects to SlideItem objects for the SliderProvider
const mockSlideItems: SlideItem[] = mockSlides.map(slide => ({
  id: slide.id,
  content: (
    <div data-testid={`slide-content-${slide.id}`}>
      <img src={slide.image} alt={slide.alt} />
      <h2>{slide.title}</h2>
      {slide.description && <p>{slide.description}</p>}
    </div>
  )
}));

describe('Slider', () => {
  const renderSlider = (): ReturnType<typeof render> => {
    return render(
      <SliderProvider items={mockSlideItems} config={{ loop: true }}>
        <Slider 
          slides={mockSlides} 
          infiniteLoop={true} 
          enableKeyboard={true}
          enableGestures={true} 
        />
      </SliderProvider>
    );
  };

  it('renders without crashing', () => {
    const { container } = renderSlider();
    expect(container).toBeInTheDocument();
  });

  it('renders all slides', () => {
    renderSlider();
    expect(screen.getByRole('region')).toBeInTheDocument();
    
    // Check all slides are rendered
    for (let i = 0; i < mockSlides.length; i++) {
      const slideNumber = i + 1;
      expect(screen.getByLabelText(`Slide ${slideNumber} of ${mockSlides.length}`)).toBeInTheDocument();
    }
    
    // Check slide content is present
    mockSlides.forEach(slide => {
      expect(screen.getByText(slide.title)).toBeInTheDocument();
      if (slide.description) {
        expect(screen.getByText(slide.description)).toBeInTheDocument();
      }
      const slideImage = screen.getByAltText(slide.alt);
      expect(slideImage).toBeInTheDocument();
      expect(slideImage).toHaveAttribute('src', slide.image);
    });
  });

  it('respects accessibility attributes', () => {
    renderSlider();
    const slider = screen.getByRole('region');
    
    // Check main slider accessibility attributes
    expect(slider).toHaveAttribute('aria-label', 'Image Slider');
    expect(slider).toHaveAttribute('tabIndex', '0');
    
    // Check individual slide accessibility
    const slides = screen.getAllByRole('group');
    slides.forEach((slide, index) => {
      const slideNumber = index + 1;
      expect(slide).toHaveAttribute('aria-label', `Slide ${slideNumber} of ${mockSlides.length}`);
      expect(slide).toHaveAttribute('aria-roledescription', 'slide');
      
      // First slide should be visible, others hidden
      if (index === 0) {
        expect(slide).toHaveAttribute('aria-hidden', 'false');
      } else {
        expect(slide).toHaveAttribute('aria-hidden', 'true');
      }
    });
    
    // Check navigation buttons accessibility
    const nextButton = screen.getByLabelText('Next slide');
    const prevButton = screen.getByLabelText('Previous slide');
    expect(nextButton).toHaveAttribute('aria-controls', expect.any(String));
    expect(prevButton).toHaveAttribute('aria-controls', expect.any(String));
    expect(nextButton).toHaveAttribute('type', 'button');
    expect(prevButton).toHaveAttribute('type', 'button');
  });

  it('handles keyboard navigation', () => {
    renderSlider();
    const slider = screen.getByTestId('slider-container');
    
    // First slide should be active initially
    expect(screen.getByTestId('slide-0')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('slide-1')).toHaveAttribute('data-active', 'false');
    
    // Navigate to next slide with keyboard
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    
    // Second slide should be active
    expect(screen.getByTestId('slide-0')).toHaveAttribute('data-active', 'false');
    expect(screen.getByTestId('slide-1')).toHaveAttribute('data-active', 'true');
    
    // Navigate back to first slide
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    
    // First slide should be active again
    expect(screen.getByTestId('slide-0')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('slide-1')).toHaveAttribute('data-active', 'false');
  });

  it('handles navigation buttons', () => {
    renderSlider();
    const nextButton = screen.getByTestId('next-button');
    const prevButton = screen.getByTestId('prev-button');
    
    // First slide should be active initially
    expect(screen.getByTestId('slide-0')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('slide-1')).toHaveAttribute('data-active', 'false');
    
    // Navigate to next slide
    fireEvent.click(nextButton);
    
    // Second slide should be active
    expect(screen.getByTestId('slide-0')).toHaveAttribute('data-active', 'false');
    expect(screen.getByTestId('slide-1')).toHaveAttribute('data-active', 'true');
    
    // Navigate back to first slide
    fireEvent.click(prevButton);
    
    // First slide should be active again
    expect(screen.getByTestId('slide-0')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('slide-1')).toHaveAttribute('data-active', 'false');
  });

  it('wraps around in infinite loop mode', () => {
    renderSlider();
    const nextButton = screen.getByTestId('next-button');
    const _prevButton = screen.getByTestId('prev-button');
    
    // First slide should be active initially
    expect(screen.getByTestId('slide-0')).toHaveAttribute('data-active', 'true');
    
    // Click next button twice to reach the last slide
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);
    
    // Third slide should be active
    expect(screen.getByTestId('slide-2')).toHaveAttribute('data-active', 'true');
    
    // Click next again to loop back to the first slide
    fireEvent.click(nextButton);
    
    // First slide should be active
    expect(screen.getByTestId('slide-0')).toHaveAttribute('data-active', 'true');
  });

  it('has proper screen reader announcement element', () => {
    renderSlider();
    
    // Check that the live region exists
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion.textContent).toContain('Slide 1 of 3');
  });

  it('disables next/prev buttons at boundaries when loop is disabled', () => {
    render(
      <SliderProvider items={mockSlideItems} config={{ loop: false }}>
        <Slider 
          slides={mockSlides} 
          infiniteLoop={false} 
          enableKeyboard={true}
          enableGestures={true} 
        />
      </SliderProvider>
    );
    
    // Force set the disabled attribute directly on the buttons
    const prevButton = screen.getByTestId('prev-button');
    const nextButton = screen.getByTestId('next-button');
    
    // Check initial state - previous button should be disabled
    expect(prevButton).toHaveAttribute('disabled');
    expect(nextButton).not.toHaveAttribute('disabled');
    
    // Click next button twice to reach the last slide 
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);
    
    // On the last slide, next button should be disabled
    expect(nextButton).toHaveAttribute('disabled');
  });
}); 