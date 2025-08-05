/**
 * @fileoverview FocusManager - Focus management and trapping
 *
 * Manages focus behavior including focus trapping, restoration, skip links,
 * and programmatic focus control for accessibility compliance.
 *
 * @version 1.0.0
 */

import { SimpleEventEmitter } from '../core/event-emitter';
import { SLIDER_EVENTS } from '../core/constants';
import type { FocusManagementConfig } from '../core/types';
import { debugLogger } from '../utils/debug-logger';

/**
 * Focusable element selector
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
  'details[open] summary',
  'audio[controls]',
  'video[controls]',
].join(', ');

/**
 * Focus trap state
 */
interface FocusTrap {
  active: boolean;
  container: HTMLElement;
  previousFocus: HTMLElement | null;
  firstFocusable: HTMLElement | null;
  lastFocusable: HTMLElement | null;
}

/**
 * Focus restoration point
 */
interface FocusRestorePoint {
  element: HTMLElement;
  timestamp: number;
  context: string;
}

/**
 * Skip link configuration
 */
interface SkipLinkConfig {
  enabled: boolean;
  text: string;
  target: string;
  position: 'top-left' | 'top-right' | 'custom';
}

/**
 * Manages focus behavior and accessibility
 */
export class FocusManager extends SimpleEventEmitter {
  private config: FocusManagementConfig;
  private container: HTMLElement | null = null;

  // Focus trapping
  private focusTrap: FocusTrap = {
    active: false,
    container: null as unknown as HTMLElement,
    previousFocus: null,
    firstFocusable: null,
    lastFocusable: null,
  };

  // Focus restoration
  private restorePoints: FocusRestorePoint[] = [];
  private maxRestorePoints = 10;

  // Skip links
  private skipLinks: HTMLElement[] = [];

  // Event handlers (bound for cleanup)
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private focusinHandler: ((e: FocusEvent) => void) | null = null;

  constructor(config: FocusManagementConfig = {}) {
    super();

    this.config = {
      autoFocus: true,
      trapFocus: false,
      outlineStyle: '2px solid #0066cc',
      ...config,
    };
  }

  /**
   * Initialize focus manager
   */
  async initialize(container: HTMLElement): Promise<void> {
    this.container = container;

    try {
      // Setup focus outline styles
      this.setupFocusOutlineStyles();

      // Setup event handlers
      this.setupEventHandlers();

      // Create skip links if needed
      this.createSkipLinks();

      debugLogger.info('Initialized successfully', 'FocusManager');
    } catch (error) {
      debugLogger.error('FocusManager', 'Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup focus outline styles
   */
  private setupFocusOutlineStyles(): void {
    if (!this.config.outlineStyle) return;

    // Inject focus outline styles
    const styleId = 'kinetic-slider-focus-styles';
    let style = document.getElementById(styleId) as HTMLStyleElement;

    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }

    const css = `
      .kinetic-slider *:focus {
        outline: ${this.config.outlineStyle} !important;
        outline-offset: 2px !important;
      }
      
      .kinetic-slider *:focus:not(:focus-visible) {
        outline: none !important;
      }
      
      .kinetic-slider *:focus-visible {
        outline: ${this.config.outlineStyle} !important;
        outline-offset: 2px !important;
      }
      
      .kinetic-slider__skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        z-index: 1000;
        text-decoration: none;
        border-radius: 4px;
        transition: top 0.2s ease-in-out;
      }
      
      .kinetic-slider__skip-link:focus {
        top: 6px;
      }
    `;

    style.textContent = css;
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    if (!this.container) return;

    // Keydown handler for focus trapping
    this.keydownHandler = this.handleKeydown.bind(this);
    document.addEventListener('keydown', this.keydownHandler);

    // Focus event handler
    this.focusinHandler = this.handleFocusIn.bind(this);
    document.addEventListener('focusin', this.focusinHandler);
  }

  /**
   * Handle keydown events for focus trapping
   */
  private handleKeydown(event: KeyboardEvent): void {
    if (!this.focusTrap.active || event.key !== 'Tab') return;

    const { firstFocusable, lastFocusable } = this.focusTrap;
    if (!firstFocusable || !lastFocusable) return;

    // Trap focus within container
    if (event.shiftKey) {
      // Shift+Tab - moving backwards
      if (document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      }
    } else {
      // Tab - moving forwards
      if (document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  /**
   * Handle focus events
   */
  private handleFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement;

    // Emit focus change event
    this.emit(SLIDER_EVENTS.ACCESSIBILITY_FOCUS_CHANGED, {
      element: target,
      timestamp: Date.now(),
    });

    // Check if focus is within the slider
    if (this.container && this.container.contains(target)) {
      // Focus is within slider - this is good
      return;
    }

    // If focus trap is active and focus escaped, bring it back
    if (this.focusTrap.active && this.focusTrap.container) {
      const focusableElements = this.getFocusableElements(
        this.focusTrap.container
      );
      if (focusableElements.length > 0) {
        event.preventDefault();
        focusableElements[0].focus();
      }
    }
  }

  /**
   * Get all focusable elements within a container
   */
  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const elements = Array.from(
      container.querySelectorAll(FOCUSABLE_SELECTOR)
    ) as HTMLElement[];

    return elements.filter((element) => {
      // Filter out elements that are not actually focusable
      const style = window.getComputedStyle(element);
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        !element.hasAttribute('disabled') &&
        element.tabIndex !== -1
      );
    });
  }

  /**
   * Trap focus within container
   */
  trapFocus(container: HTMLElement): void {
    if (this.focusTrap.active) {
      debugLogger.warn('FocusManager', 'Focus trap already active');
      return;
    }

    // Store current focus for restoration
    this.focusTrap.previousFocus = document.activeElement as HTMLElement;

    // Get focusable elements
    const focusableElements = this.getFocusableElements(container);

    if (focusableElements.length === 0) {
      debugLogger.warn(
        'FocusManager',
        'No focusable elements found in container'
      );
      return;
    }

    // Setup focus trap
    this.focusTrap = {
      active: true,
      container,
      previousFocus: this.focusTrap.previousFocus,
      firstFocusable: focusableElements[0],
      lastFocusable: focusableElements[focusableElements.length - 1],
    };

    // Focus first element if auto-focus is enabled
    if (this.config.autoFocus) {
      this.focusTrap.firstFocusable?.focus();
    }

    // Emit event
    this.emit(SLIDER_EVENTS.ACCESSIBILITY_FOCUS_TRAPPED, {
      container,
      elementCount: focusableElements.length,
    });

    debugLogger.info('Focus trapped', 'FocusManager', {
      container: container.tagName,
      elementCount: focusableElements.length,
    });
  }

  /**
   * Release focus trap
   */
  releaseFocusTrap(): void {
    if (!this.focusTrap.active) return;

    // Restore previous focus
    if (
      this.focusTrap.previousFocus &&
      this.isElementFocusable(this.focusTrap.previousFocus)
    ) {
      this.focusTrap.previousFocus.focus();
    }

    // Reset trap state
    const container = this.focusTrap.container;
    this.focusTrap = {
      active: false,
      container: null as unknown as HTMLElement,
      previousFocus: null,
      firstFocusable: null,
      lastFocusable: null,
    };

    // Emit event
    this.emit(SLIDER_EVENTS.ACCESSIBILITY_FOCUS_RELEASED, {
      container,
    });

    debugLogger.info('Focus trap released', 'FocusManager');
  }

  /**
   * Save current focus as restore point
   */
  saveFocusRestorePoint(context: string = 'manual'): void {
    const activeElement = document.activeElement as HTMLElement;
    if (!activeElement || activeElement === document.body) return;

    const restorePoint: FocusRestorePoint = {
      element: activeElement,
      timestamp: Date.now(),
      context,
    };

    // Add to restore points
    this.restorePoints.push(restorePoint);

    // Limit restore points
    if (this.restorePoints.length > this.maxRestorePoints) {
      this.restorePoints.shift();
    }

    debugLogger.info('Focus restore point saved', 'FocusManager', {
      element: activeElement.tagName,
      context,
    });
  }

  /**
   * Restore focus to most recent restore point
   */
  restoreFocus(): boolean {
    const restorePoint = this.restorePoints.pop();

    if (!restorePoint || !this.isElementFocusable(restorePoint.element)) {
      return false;
    }

    restorePoint.element.focus();

    debugLogger.info('Focus restored', 'FocusManager', {
      element: restorePoint.element.tagName,
      context: restorePoint.context,
    });

    return true;
  }

  /**
   * Focus element safely
   */
  focusElement(element: HTMLElement, options: FocusOptions = {}): boolean {
    if (!this.isElementFocusable(element)) {
      debugLogger.warn('FocusManager', 'Element is not focusable:', element);
      return false;
    }

    try {
      element.focus(options);
      return true;
    } catch (error) {
      debugLogger.error('FocusManager', 'Failed to focus element:', error);
      return false;
    }
  }

  /**
   * Check if element is focusable
   */
  private isElementFocusable(element: HTMLElement): boolean {
    if (!element || !element.ownerDocument) return false;

    // Check if element is in DOM
    if (!element.ownerDocument.contains(element)) return false;

    // Check visibility
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }

    // Check if disabled
    if (element.hasAttribute('disabled')) return false;

    // Check tabindex
    if (element.tabIndex === -1) return false;

    // Check if element matches focusable selector
    return element.matches(FOCUSABLE_SELECTOR);
  }

  /**
   * Create skip links for accessibility
   */
  private createSkipLinks(): void {
    if (!this.container) return;

    const skipLinkConfig: SkipLinkConfig = {
      enabled: true,
      text: 'Skip to slider controls',
      target: '.kinetic-slider__controls',
      position: 'top-left',
    };

    if (!skipLinkConfig.enabled) return;

    // Find target element
    const target = this.container.querySelector(
      skipLinkConfig.target
    ) as HTMLElement;
    if (!target) return;

    // Create skip link
    const skipLink = document.createElement('a');
    skipLink.href = '#';
    skipLink.className = 'kinetic-slider__skip-link';
    skipLink.textContent = skipLinkConfig.text;
    skipLink.setAttribute('role', 'button');

    // Handle click
    skipLink.addEventListener('click', (event) => {
      event.preventDefault();
      this.focusElement(target);
    });

    // Insert at beginning of container
    this.container.insertBefore(skipLink, this.container.firstChild);
    this.skipLinks.push(skipLink);
  }

  /**
   * Get current focus trap state
   */
  getFocusTrapState(): { active: boolean; container: HTMLElement | null } {
    return {
      active: this.focusTrap.active,
      container: this.focusTrap.container,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<FocusManagementConfig>): void {
    this.config = { ...this.config, ...config };

    // Update focus outline styles if changed
    if (config.outlineStyle) {
      this.setupFocusOutlineStyles();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): FocusManagementConfig {
    return { ...this.config };
  }

  /**
   * Destroy focus manager
   */
  destroy(): void {
    debugLogger.info('Destroying...', 'FocusManager');

    // Release focus trap if active
    if (this.focusTrap.active) {
      this.releaseFocusTrap();
    }

    // Remove event handlers
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }

    if (this.focusinHandler) {
      document.removeEventListener('focusin', this.focusinHandler);
      this.focusinHandler = null;
    }

    // Remove skip links
    this.skipLinks.forEach((link) => link.remove());
    this.skipLinks = [];

    // Remove focus styles
    const style = document.getElementById('kinetic-slider-focus-styles');
    if (style) {
      style.remove();
    }

    // Clear restore points
    this.restorePoints = [];

    // Reset state
    this.container = null;

    // Remove all listeners
    this.removeAllListeners();
  }
}
