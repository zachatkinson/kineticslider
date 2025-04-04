import type { Slide as _Slide } from '@/types';
import type { GestureEvent } from '@/types/gestures';
import { createSlideId } from '@/utils/id-helpers';

export const mockSlides = [
  {
    id: createSlideId('1'),
    title: 'First Slide',
    description: 'Description for the first slide',
    image: 'https://example.com/slide1.jpg',
    alt: 'Alt text for slide 1'
  },
  {
    id: createSlideId('2'),
    title: 'Second Slide',
    description: 'Description for the second slide',
    image: 'https://example.com/slide2.jpg',
    alt: 'Alt text for slide 2'
  },
  {
    id: createSlideId('3'),
    title: 'Third Slide',
    description: 'Description for the third slide',
    image: 'https://example.com/slide3.jpg',
    alt: 'Alt text for slide 3'
  }
];

export const _mockGestureEvents = {
  touchStart: new TouchEvent('touchstart', {
    touches: [{ clientX: 100, clientY: 50 }] as unknown as Touch[],
  }) as unknown as GestureEvent,
  touchMove: new TouchEvent('touchmove', {
    touches: [{ clientX: 200, clientY: 50 }] as unknown as Touch[],
  }) as unknown as GestureEvent,
  touchEnd: new TouchEvent('touchend') as unknown as GestureEvent,
  mouseDown: {
    type: 'pan',
    originalEvent: new MouseEvent('mousedown', {
      clientX: 100,
      clientY: 50,
    }),
    target: document.createElement('div'),
    center: {
      x: 100,
      y: 50
    },
    startTime: Date.now()
  } as unknown as GestureEvent,
  mouseMove: {
    type: 'pan',
    originalEvent: new MouseEvent('mousemove', {
      clientX: 200,
      clientY: 50,
    }),
    target: document.createElement('div'),
    center: {
      x: 200,
      y: 50
    },
    startTime: Date.now()
  } as unknown as GestureEvent,
  mouseUp: {
    type: 'pan',
    originalEvent: new MouseEvent('mouseup'),
    target: document.createElement('div'),
    center: {
      x: 200,
      y: 50
    },
    startTime: Date.now()
  } as unknown as GestureEvent,
};

export const _mockKeyboardEvents = {
  arrowLeft: new KeyboardEvent('keydown', { key: 'ArrowLeft' }),
  arrowRight: new KeyboardEvent('keydown', { key: 'ArrowRight' }),
  home: new KeyboardEvent('keydown', { key: 'Home' }),
  end: new KeyboardEvent('keydown', { key: 'End' }),
};

export const _mockAnimationConfig = {
  duration: 0.5,
  ease: 'power2.out',
  stagger: 0.1,
};
