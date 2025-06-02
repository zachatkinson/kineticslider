/**
 * Test Utilities
 * 
 * Centralized utility functions for testing to eliminate duplication
 * across test files and provide consistent testing patterns.
 * 
 * @module TestUtilities
 * @version 1.0.0
 */

/**
 * Common test data factories
 */
export const testDataFactories = {
  /**
   * Create mock slide data
   * 
   * @param count - Number of slides to create
   *
   * @param options - Additional options for slide creation
   *
   * @param options.includeImages - Whether to include image URLs in slides
   * 
   * @returns Array of slide objects
   *
   */
  createMockSlides(count: number = 3, options: { includeImages?: boolean } = {}): Array<{
    id: string;
    title: string;
    content: string;
    image?: string;
  }> {
    return Array.from({ length: count }, (_, index) => ({
      id: `slide-${index}`,
      title: `Slide ${index + 1}`,
      content: `Content for slide ${index + 1}`,
      ...(options.includeImages && { image: `/images/slide-${index + 1}.jpg` })
    }));
  },

  /**
   * Create mock error objects
   * 
   * @param message - Error message
   *
   * @param type - Error type
   * 
   * @returns Mock error object
   *
   */
  createMockError(message: string = 'Test error', type: string = 'TestError'): Error {
    const error = new Error(message);
    error.name = type;
    return error;
  },

  /**
   * Create mock event objects
   * 
   * @param type - Event type
   *
   * @param properties - Additional event properties
   * 
   * @returns Mock event object
   *
   */
  createMockEvent(type: string, properties: Record<string, unknown> = {}): Event {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.assign(event, properties);
    return event;
  },

  /**
   * Create mock keyboard event
   * 
   * @param key - Key pressed
   *
   * @param options - Additional event options
   *
   * @param options.ctrlKey - Whether Ctrl key is pressed
   *
   * @param options.shiftKey - Whether Shift key is pressed
   *
   * @param options.altKey - Whether Alt key is pressed
   *
   * @param options.metaKey - Whether Meta key is pressed
   * 
   * @returns Mock keyboard event
   *
   */
  createMockKeyboardEvent(key: string, options: {
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
  } = {}): KeyboardEvent {
    return new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...options
    });
  }
};

/**
 * Common test assertions and helpers
 */
export const testHelpers = {
  /**
   * Wait for a condition to be true
   * 
   * @param condition - Function that returns boolean
   *
   * @param timeout - Maximum time to wait in milliseconds
   *
   * @param interval - Check interval in milliseconds
   * 
   * @returns Promise that resolves when condition is true
   *
   */
  async waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  },

  /**
   * Wait for element to be visible
   * 
   * @param selector - CSS selector
   *
   * @param timeout - Maximum time to wait
   * 
   * @returns Promise that resolves when element is visible
   *
   */
  async waitForElement(selector: string, timeout: number = 5000): Promise<Element> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element && element.getBoundingClientRect().width > 0) {
        return element;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Element ${selector} not found or not visible within ${timeout}ms`);
  },

  /**
   * Simulate user interaction delay
   * 
   * @param ms - Milliseconds to wait
   * 
   * @returns Promise that resolves after delay
   *
   */
  async userDelay(ms: number = 100): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Get element center coordinates
   * 
   * @param element - HTML element
   * 
   * @returns Object with x and y coordinates
   *
   */
  getElementCenter(element: Element): { x: number; y: number } {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  },

  /**
   * Check if element is in viewport
   * 
   * @param element - HTML element to check
   * 
   * @returns True if element is in viewport
   *
   */
  isInViewport(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
};

/**
 * Performance testing utilities
 */
export const performanceHelpers = {
  /**
   * Measure function execution time
   * 
   * @param fn - Function to measure
   *
   * @param iterations - Number of iterations to run
   * 
   * @returns Object with timing statistics
   *
   */
  async measurePerformance<T>(
    fn: () => T | Promise<T>,
    iterations: number = 1
  ): Promise<{
    average: number;
    min: number;
    max: number;
    total: number;
    results: T[];
  }> {
    const times: number[] = [];
    const results: T[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const result = await fn();
      const end = performance.now();
      
      times.push(end - start);
      results.push(result);
    }

    return {
      average: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      total: times.reduce((a, b) => a + b, 0),
      results
    };
  },

  /**
   * Check if performance is within acceptable range
   * 
   * @param actualTime - Actual execution time in ms
   *
   * @param expectedTime - Expected execution time in ms
   *
   * @param tolerance - Tolerance percentage (0.1 = 10%)
   * 
   * @returns True if performance is acceptable
   *
   */
  isPerformanceAcceptable(
    actualTime: number,
    expectedTime: number,
    tolerance: number = 0.2
  ): boolean {
    const maxTime = expectedTime * (1 + tolerance);
    return actualTime <= maxTime;
  }
};

/**
 * Accessibility testing utilities
 */
export const accessibilityHelpers = {
  /**
   * Check if element has proper ARIA attributes
   * 
   * @param element - Element to check
   *
   * @param requiredAttributes - Required ARIA attributes
   * 
   * @returns True if all required attributes are present
   *
   */
  hasRequiredAriaAttributes(
    element: Element,
    requiredAttributes: string[]
  ): boolean {
    return requiredAttributes.every(attr => 
      element.hasAttribute(attr) && element.getAttribute(attr) !== ''
    );
  },

  /**
   * Check if element is focusable
   * 
   * @param element - Element to check
   * 
   * @returns True if element is focusable
   *
   */
  isFocusable(element: Element): boolean {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];

    return focusableSelectors.some(selector => element.matches(selector)) ||
           (element.hasAttribute('tabindex') && element.getAttribute('tabindex') !== '-1');
  },

  /**
   * Get all focusable elements within a container
   * 
   * @param container - Container element
   * 
   * @returns Array of focusable elements
   *
   */
  getFocusableElements(container: Element): Element[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors));
  }
};

/**
 * Animation testing utilities
 */
export const animationHelpers = {
  /**
   * Wait for CSS animation to complete
   * 
   * @param element - Element with animation
   *
   * @param timeout - Maximum time to wait
   * 
   * @returns Promise that resolves when animation completes
   *
   */
  async waitForAnimationEnd(element: Element, timeout: number = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Animation did not complete within ${timeout}ms`));
      }, timeout);

      const handleAnimationEnd = (): void => {
        clearTimeout(timeoutId);
        element.removeEventListener('animationend', handleAnimationEnd);
        element.removeEventListener('transitionend', handleAnimationEnd);
        resolve();
      };

      element.addEventListener('animationend', handleAnimationEnd);
      element.addEventListener('transitionend', handleAnimationEnd);
    });
  },

  /**
   * Check if element is currently animating
   * 
   * @param element - Element to check
   * 
   * @returns True if element is animating
   *
   */
  isAnimating(element: Element): boolean {
    const computedStyle = window.getComputedStyle(element);
    const animationName = computedStyle.getPropertyValue('animation-name');
    const transitionProperty = computedStyle.getPropertyValue('transition-property');
    
    return animationName !== 'none' || transitionProperty !== 'none';
  }
};

// Re-export mock utilities from centralized location
export { 
  createMockFunction,
  createAsyncMock,
  createAsyncErrorMock,
  mockTimers
} from '../__tests__/mocks/test-helpers.mock'; 