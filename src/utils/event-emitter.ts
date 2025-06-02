/**
 * Simple Event Emitter Utility
 * 
 * Lightweight event emitter for internal use in services and components.
 * Provides basic pub/sub functionality without external dependencies.
 * 
 * @module EventEmitter
 * @version 1.0.0
 */

/**
 * Simple event emitter class for internal use
 * 
 * @example
 * ```typescript
 * class MyService extends SimpleEventEmitter {
 *   doSomething() {
 *     this.emit('action', { data: 'value' });
 *   }
 * }
 * 
 * const service = new MyService();
 * service.on('action', (data) => console.log(data));
 * service.doSomething(); // Logs: { data: 'value' }
 * ```
 */
export class SimpleEventEmitter {
  private listeners = new Map<string, Array<(...args: unknown[]) => void>>();

  /**
   * Add an event listener
   * 
   * @param event - Event name
   *
   * @param listener - Event listener function
   *
   */
  on(event: string, listener: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.push(listener);
    }
  }

  /**
   * Remove an event listener
   * 
   * @param event - Event name
   *
   * @param listener - Event listener function to remove
   *
   */
  off(event: string, listener: (...args: unknown[]) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event
   * 
   * @param event - Event name
   *
   * @param args - Event arguments
   *
   */
  emit(event: string, ...args: unknown[]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in event listener for '${event}':`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for an event or all events
   * 
   * @param event - Optional event name. If not provided, removes all listeners
   *
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get the number of listeners for an event
   * 
   * @param event - Event name
   *
   * @returns Number of listeners
   *
   */
  listenerCount(event: string): number {
    const eventListeners = this.listeners.get(event);
    return eventListeners ? eventListeners.length : 0;
  }

  /**
   * Get all event names that have listeners
   * 
   * @returns Array of event names
   *
   */
  eventNames(): string[] {
    return Array.from(this.listeners.keys());
  }
} 