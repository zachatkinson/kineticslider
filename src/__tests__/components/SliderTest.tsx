import React from 'react';
import { Slider } from './Slider';
import type { SlideItem, SliderConfig } from '../../types/slider';

const testItems: SlideItem[] = [
  {
    id: '1',
    content: (
      <div style={{ width: '100%', height: '400px', background: '#1a73e8', color: 'white' }}>
        Slide 1
      </div>
    ),
  },
  {
    id: '2',
    content: (
      <div style={{ width: '100%', height: '400px', background: '#34a853', color: 'white' }}>
        Slide 2
      </div>
    ),
  },
  {
    id: '3',
    content: (
      <div style={{ width: '100%', height: '400px', background: '#ea4335', color: 'white' }}>
        Slide 3
      </div>
    ),
  },
];

const testConfig: SliderConfig = {
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
  autoplay: {
    enabled: true,
    interval: 3000,
    pauseOnHover: true,
  },
  accessibility: {
    ariaLabel: 'Test Slider',
    keyboardNavigation: true,
    announceSlide: true,
  },
};

export const SliderTest: React.FC = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1>Slider Test</h1>
      <Slider
        items={testItems}
        config={testConfig}
        className="test-slider"
        style={{ height: '400px' }}
      />
    </div>
  );
}; 