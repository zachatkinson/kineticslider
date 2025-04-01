import { SliderState } from './slider';
import { GestureDirection } from './gesture';

export interface SlideStyleOptions {
  index: number;
  state: SliderState;
  config: {
    direction: GestureDirection;
    animation: {
      duration: number;
      easing: string;
    };
  };
}

export interface SlideStyle {
  transform: string;
  transition: string;
} 