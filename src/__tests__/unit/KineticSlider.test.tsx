import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KineticSlider } from '../../components/KineticSlider';
import { createSlideId } from '../../utils/id-helpers';

// Mock GSAP - this needs to be at the top due to hoisting
vi.mock('gsap', () => {
  return {
    __esModule: true,
    default: {
      to: vi.fn().mockImplementation((target: any, config: any) => {
        if (config && config.onComplete) {
          config.onComplete();
        }
        return { kill: vi.fn() };
      }),
      fromTo: vi.fn().mockImplementation((target: any, fromVars: any, toVars: any) => {
        if (toVars && toVars.onComplete) {
          toVars.onComplete();
        }
        return { kill: vi.fn() };
      }),
      timeline: vi.fn().mockImplementation(() => ({
        to: vi.fn(),
        add: vi.fn(),
        kill: vi.fn()
      })),
      set: vi.fn(),
      config: vi.fn(),
      registerPlugin: vi.fn(),
      killTweensOf: vi.fn(),
      utils: {
        toArray: vi.fn().mockImplementation((selector: any) => 
          Array.isArray(selector) ? selector : [selector]
        )
      }
    },
    gsap: {
      to: vi.fn().mockImplementation((target: any, config: any) => {
        if (config && config.onComplete) {
          config.onComplete();
        }
        return { kill: vi.fn() };
      }),
      fromTo: vi.fn().mockImplementation((target: any, fromVars: any, toVars: any) => {
        if (toVars && toVars.onComplete) {
          toVars.onComplete();
        }
        return { kill: vi.fn() };
      }),
      timeline: vi.fn().mockImplementation(() => ({
        to: vi.fn(),
        add: vi.fn(),
        kill: vi.fn()
      })),
      set: vi.fn(),
      config: vi.fn(),
      registerPlugin: vi.fn(),
      killTweensOf: vi.fn(),
      utils: {
        toArray: vi.fn().mockImplementation((selector: any) => 
          Array.isArray(selector) ? selector : [selector]
        )
      }
    }
  };
});

// Mock the ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

describe('KineticSlider', () => {
  const mockSlides = [
    {
      id: createSlideId('slide1'),
      title: 'Slide 1',
      image: '/slide1.jpg',
      alt: 'Slide 1 description'
    },
    {
      id: createSlideId('slide2'),
      title: 'Slide 2',
      image: '/slide2.jpg',
      alt: 'Slide 2 description'
    },
    {
      id: createSlideId('slide3'),
      title: 'Slide 3',
      image: '/slide3.jpg',
      alt: 'Slide 3 description'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders slides correctly', () => {
    render(<KineticSlider slides={mockSlides} />);
    
    // Check if all slides are rendered
    expect(screen.getByAltText('Slide 1 description')).toBeInTheDocument();
    expect(screen.getByAltText('Slide 2 description')).toBeInTheDocument();
    expect(screen.getByAltText('Slide 3 description')).toBeInTheDocument();
  });
}); 