import type { Slide } from '@/types';
import type { GestureEvent } from '@/types/gestures';
import { createSlideId } from '@/utils/id-helpers';

export const mockSlides: Slide[] = [
  {
    id: createSlideId('1'),
    title: 'Slide 1',
    description: 'Description for slide 1',
    image: '/images/slide1.jpg',
    alt: 'Slide 1 image',
  },
  {
    id: createSlideId('2'),
    title: 'Slide 2',
    description: 'Description for slide 2',
    image: '/images/slide2.jpg',
    alt: 'Slide 2 image',
  },
  {
    id: createSlideId('3'),
    title: 'Slide 3',
    description: 'Description for slide 3',
    image: '/images/slide3.jpg',
    alt: 'Slide 3 image',
  },
];

export const mockGestureEvents = {
  touchStart: new TouchEvent('touchstart', {
    touches: [{ clientX: 100, clientY: 50 }] as unknown as Touch[],
  }) as unknown as GestureEvent,
  touchMove: new TouchEvent('touchmove', {
    touches: [{ clientX: 200, clientY: 50 }] as unknown as Touch[],
  }) as unknown as GestureEvent,
  touchEnd: new TouchEvent('touchend') as unknown as GestureEvent,
  mouseDown: new MouseEvent('mousedown', {
    clientX: 100,
    clientY: 50,
  }) as GestureEvent,
  mouseMove: new MouseEvent('mousemove', {
    clientX: 200,
    clientY: 50,
  }) as GestureEvent,
  mouseUp: new MouseEvent('mouseup') as GestureEvent,
};

export const mockKeyboardEvents = {
  arrowLeft: new KeyboardEvent('keydown', { key: 'ArrowLeft' }),
  arrowRight: new KeyboardEvent('keydown', { key: 'ArrowRight' }),
  home: new KeyboardEvent('keydown', { key: 'Home' }),
  end: new KeyboardEvent('keydown', { key: 'End' }),
};

export const mockAnimationConfig = {
  duration: 0.5,
  ease: 'power2.out',
  stagger: 0.1,
};
