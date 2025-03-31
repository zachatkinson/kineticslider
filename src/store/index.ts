import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AppState } from '../types/store';

export const useStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        theme: 'light',
        setTheme: (theme) => set({ theme }),
        isMenuOpen: false,
        toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
      }),
      {
        name: 'app-storage',
      }
    )
  )
); 