import { SlideProps } from '../../types';

export const mockSlides: SlideProps[] = [
  {
    id: 'slide-1',
    content: 'First Slide Content',
    image: '/images/slide1.jpg',
    title: 'Slide One'
  },
  {
    id: 'slide-2',
    content: 'Second Slide Content',
    image: '/images/slide2.jpg',
    title: 'Slide Two'
  },
  {
    id: 'slide-3',
    content: 'Third Slide Content',
    image: '/images/slide3.jpg',
    title: 'Slide Three'
  }
];

export interface GestureEvent extends Event {
  clientX: number;
  clientY: number;
  touches?: Touch[];
}

export const mockGestureEvents = {
  touchStart: new TouchEvent('touchstart', {
    touches: [{ clientX: 100, clientY: 50 }] as unknown as Touch[]
  }) as unknown as GestureEvent,
  touchMove: new TouchEvent('touchmove', {
    touches: [{ clientX: 200, clientY: 50 }] as unknown as Touch[]
  }) as unknown as GestureEvent,
  touchEnd: new TouchEvent('touchend') as unknown as GestureEvent,
  mouseDown: new MouseEvent('mousedown', { clientX: 100, clientY: 50 }) as GestureEvent,
  mouseMove: new MouseEvent('mousemove', { clientX: 200, clientY: 50 }) as GestureEvent,
  mouseUp: new MouseEvent('mouseup') as GestureEvent
};

export const mockKeyboardEvents = {
  arrowLeft: new KeyboardEvent('keydown', { key: 'ArrowLeft' }),
  arrowRight: new KeyboardEvent('keydown', { key: 'ArrowRight' }),
  home: new KeyboardEvent('keydown', { key: 'Home' }),
  end: new KeyboardEvent('keydown', { key: 'End' })
};

export const mockAnimationConfig = {
  duration: 0.5,
  ease: 'power2.out',
  stagger: 0.1
}; 