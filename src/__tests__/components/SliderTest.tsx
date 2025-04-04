import React from 'react';
import { Slider } from '../../components/Slider';
import type { Slide, SliderConfig } from '../../types/slider';
import { createSlideId } from '../../utils/id-helpers';

const testSlides: Slide[] = [
  {
    id: createSlideId('1'),
    title: 'Slide 1',
    image: '/images/slide1.jpg',
    alt: 'Slide 1 description',
    content: (
      <div style={{ width: '100%', height: '400px', background: '#1a73e8', color: 'white' }}>
        Slide 1
      </div>
    ),
  },
  {
    id: createSlideId('2'),
    title: 'Slide 2',
    image: '/images/slide2.jpg',
    alt: 'Slide 2 description',
    content: (
      <div style={{ width: '100%', height: '400px', background: '#34a853', color: 'white' }}>
        Slide 2
      </div>
    ),
  },
  {
    id: createSlideId('3'),
    title: 'Slide 3',
    image: '/images/slide3.jpg',
    alt: 'Slide 3 description',
    content: (
      <div style={{ width: '100%', height: '400px', background: '#ea4335', color: 'white' }}>
        Slide 3
      </div>
    ),
  },
];

const _testConfig: SliderConfig = {
  loop: true,
  autoplay: true,
  autoplayDelay: 3000,
  gestureThreshold: 50,
  gestureDirection: 'horizontal',
};

export const _SliderTest: React.FC = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1>Slider Test</h1>
      <Slider
        slides={testSlides}
        className="test-slider"
        style={{ height: '400px' }}
        infiniteLoop={true}
        duration={0.3}
        ease="ease-in-out"
        enableKeyboard={true}
        enableGestures={true}
      />
    </div>
  );
}; 