/**
 * Keyboard event handling types for the KineticSlider
 */

export interface KeyboardOptions {
  onLeft?: (() => void) | undefined;
  onRight?: (() => void) | undefined;
  onUp?: (() => void) | undefined;
  onDown?: (() => void) | undefined;
  onEnter?: (() => void) | undefined;
  onSpace?: (() => void) | undefined;
  onEscape?: (() => void) | undefined;
  onTab?: ((event: KeyboardEvent) => void) | undefined;
  onHome?: (() => void) | undefined;
  onEnd?: (() => void) | undefined;
  onPageUp?: (() => void) | undefined;
  onPageDown?: (() => void) | undefined;
  enabled?: boolean | undefined;
  preventDefault?: boolean | undefined;
  stopPropagation?: boolean | undefined;
}

export interface FocusTrapOptions {
  active?: boolean | undefined;
  autoFocus?: boolean | undefined;
  returnFocusOnDeactivate?: boolean | undefined;
  escapeDeactivates?: boolean | undefined;
  fallbackFocus?: string | (() => HTMLElement | null) | undefined;
  initialFocus?: string | HTMLElement | (() => HTMLElement | null) | undefined;
  onActivate?: (() => void) | undefined;
  onDeactivate?: (() => void) | undefined;
}

export interface UseKeyboardReturn {
  attachToElement: (element: HTMLElement | null) => void;
  focusElement: (selector: string | HTMLElement) => void;
  trapFocus: (
    container: HTMLElement | null,
    options?: FocusTrapOptions
  ) => void;
  releaseFocus: () => void;
}

/**
 * Read the current file to understand the interfaces and fix any mismatches
 */
