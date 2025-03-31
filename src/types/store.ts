/**
 * Types related to application state management
 */

/**
 * Global application state interface
 */
export interface AppState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  isMenuOpen: boolean;
  toggleMenu: () => void;
} 