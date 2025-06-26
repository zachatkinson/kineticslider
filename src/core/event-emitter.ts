import type { EventEmitter } from './types';
import { SLIDER_EVENTS } from './constants';

/**
 * Simple type-safe event emitter for slider component communication
 *
 * Provides a clean pubsub pattern for components to communicate
 * without tight coupling. Used by SliderEngine to coordinate between
 * Physics, Renderer, and Controller.
 *
 * @example
 * ```typescript
 * const emitter = new SimpleEventEmitter();
 * emitter.on('slide-change', (index) => console.log('New slide:', index));
 * emitter.emit('slide-change', 2);
 * ```
 */
export class SimpleEventEmitter implements EventEmitter {
  private listeners = new Map<string, Array<(...args: unknown[]) => void>>();

  /**
   * Subscribe to an event
   */
  on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Subscribe to an event once (auto-unsubscribe after first emission)
   */
  once(event: string, callback: (...args: unknown[]) => void): void {
    const onceCallback = (...args: unknown[]): void => {
      callback(...args);
      this.off(event, onceCallback);
    };
    this.on(event, onceCallback);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, callback: (...args: unknown[]) => void): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;

    const index = eventListeners.indexOf(callback);
    if (index > -1) {
      eventListeners.splice(index, 1);

      // Clean up empty arrays
      if (eventListeners.length === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit an event to all subscribers
   */
  emit(event: string, ...args: unknown[]): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;

    // Create a copy to avoid issues if listeners are modified during emission
    const listenersCopy = [...eventListeners];

    listenersCopy.forEach((callback) => {
      try {
        callback(...args);
      } catch (error) {
        // Emit error event instead of console.error for better error handling
        if (event !== SLIDER_EVENTS.ERROR) {
          this.emit(SLIDER_EVENTS.ERROR, { event, error, callback });
        }
      }
    });
  }

  /**
   * Remove all listeners for a specific event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get list of events that have listeners
   */
  eventNames(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Get number of listeners for an event
   */
  listenerCount(event: string): number {
    const eventListeners = this.listeners.get(event);
    return eventListeners ? eventListeners.length : 0;
  }
}
