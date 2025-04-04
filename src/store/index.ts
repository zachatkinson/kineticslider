import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AppState } from '../types/store';
import type { GestureDelta } from '../types/gesture';
import type { SlideIndex } from '../types/branded';

export const useStore = create<AppState>()(
  devtools(
    persist(
      (_set) => ({
        slides: {
          items: [],
          currentIndex: 0 as SlideIndex,
          isDragging: false,
          dragDelta: { x: 0, y: 0 } as GestureDelta,
          isAnimating: false
        },
        ui: {
          isFullscreen: false,
          isMuted: false,
          theme: 'light'
        },
        settings: {
          autoplay: false,
          loop: false,
          gestureEnabled: true,
          keyboardEnabled: true
        },
        user: null,
        setUser: (_user: Record<string, unknown>) => {
          // Implementation using _set goes here
        }
      }),
      {
        name: 'app-storage',
      }
    )
  )
); 