/**
 * Types related to application state management
 */

/**
 * Global application state interface
 */
export interface AppState {
  slides: {
    items: Slide[];
    currentIndex: SlideIndex;
    isDragging: boolean;
    dragDelta: GestureDelta;
    isAnimating: boolean;
  };
  ui: {
    isFullscreen: boolean;
    isMuted: boolean;
    theme: 'light' | 'dark';
  };
  settings: {
    autoplay: boolean;
    loop: boolean;
    gestureEnabled: boolean;
    keyboardEnabled: boolean;
  };
}

/**
 * Store-related type definitions and interfaces
 */
import type { SlideIndex, SliderId } from './branded';
import type { GestureDelta } from './gesture';
import type { Slide } from './slider';

// Action types
export type SlideAction = 
  | { type: 'SET_CURRENT_SLIDE'; index: SlideIndex }
  | { type: 'SET_DRAGGING'; isDragging: boolean }
  | { type: 'SET_DRAG_DELTA'; delta: GestureDelta }
  | { type: 'SET_ANIMATING'; isAnimating: boolean }
  | { type: 'ADD_SLIDE'; slide: Slide }
  | { type: 'REMOVE_SLIDE'; id: SliderId }
  | { type: 'REORDER_SLIDES'; ids: SliderId[] };

export type UIAction =
  | { type: 'TOGGLE_FULLSCREEN' }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_THEME'; theme: 'light' | 'dark' };

export type SettingsAction =
  | { type: 'TOGGLE_AUTOPLAY' }
  | { type: 'TOGGLE_LOOP' }
  | { type: 'TOGGLE_GESTURE' }
  | { type: 'TOGGLE_KEYBOARD' };

// Selector types
export type SlideSelector<T> = (state: AppState['slides']) => T;
export type UISelector<T> = (state: AppState['ui']) => T;
export type SettingsSelector<T> = (state: AppState['settings']) => T; 