import React from 'react';

import { KineticSlider } from '../components/KineticSlider';
import type { Slide } from '../types';
import { createSlideId } from '../utils/id-helpers';

const slides: Slide[] = [
  {
    id: createSlideId('slide-1'),
    title: 'Welcome to KineticSlider',
    description: 'A modern, performant slider component',
    image: '/images/slide1.jpg',
    alt: 'Introduction slide',
  },
  {
    id: createSlideId('slide-2'),
    title: 'Powerful Features',
    description: 'Built with performance in mind',
    image: '/images/slide2.jpg',
    alt: 'Features slide',
  },
  {
    id: createSlideId('slide-3'),
    title: 'Get Started',
    description: 'Easy to integrate into your project',
    image: '/images/slide3.jpg',
    alt: 'Get started slide',
  },
];

const BasicExample: React.FC = () => {
  const handleSlideChange = (index: number): void => {
    if (process.env['NODE_ENV'] !== 'production') {
      document.dispatchEvent(
        new CustomEvent('slide-change', { detail: { index } })
      );
    }
  };

  const handleAnimationComplete = (): void => {
    if (process.env['NODE_ENV'] !== 'production') {
      document.dispatchEvent(new CustomEvent('animation-complete'));
    }
  };

  const props = {
    slides,
    onSlideChange: handleSlideChange,
    onAnimationComplete: handleAnimationComplete,
    initialIndex: 0,
    animationConfig: {
      duration: 0.5,
      ease: 'power2.inOut',
    },
  };

  return <KineticSlider {...props} />;
};

export default BasicExample;
