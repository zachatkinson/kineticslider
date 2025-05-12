/**
 * Type definitions for interactive elements and components
 *
 * @module
 * @version 1.0.0
 */

/**
 * Interface for elements that can receive focus
 *
 * @example Example usage
 */
export interface Focusable {
  /**
   * Focus the element
   */
  focus: () => void;
}

/**
 * Interface for elements that can be initially focused
 *
 * @example Example usage
 */
export interface InitialFocusable {
  /**
   * Set initial focus on the element
   */
  initialFocus: () => void;
}

/**
 * Interface for elements that can be activated
 *
 * @example Example usage
 */
export interface Activatable {
  /**
   * Activate the element
   */
  activate: () => void;
}

/**
 * Interface for elements that can be selected
 *
 * @example Example usage
 */
export interface Selectable {
  /**
   * Select the element
   */
  select: () => void;

  /**
   * Whether the element is currently selected
   */
  isSelected: boolean;
}

/**
 * Interface for elements that can have their visibility toggled
 *
 * @example Example usage
 */
export interface Toggleable {
  /**
   * Toggle the element's visibility or state
   */
  toggle: () => void;

  /**
   * Whether the element is currently visible or active
   */
  isVisible: boolean;
}
