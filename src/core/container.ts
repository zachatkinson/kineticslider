/**
 * Simple Service Container for Dependency Injection
 * Provides clean, testable dependency management for the KineticSlider
 */

import { ERROR_MESSAGES } from './constants';

type ServiceFactory<T> = () => T;
type ServiceInstance<T> = T;

export interface IServiceContainer {
  register<T>(key: string, factory: ServiceFactory<T>): void;
  registerInstance<T>(key: string, instance: ServiceInstance<T>): void;
  get<T>(key: string): T;
  has(key: string): boolean;
  clear(): void;
}

/**
 * Service Container Implementation
 *
 * @example
 * ```typescript
 * const container = new ServiceContainer();
 * container.register('logger', () => new Logger());
 * const logger = container.get<Logger>('logger');
 * ```
 */
export class ServiceContainer implements IServiceContainer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private factories = new Map<string, ServiceFactory<any>>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private instances = new Map<string, ServiceInstance<any>>();
  private singletons = new Set<string>();

  /**
   * Register a service factory (lazy instantiation)
   */
  register<T>(key: string, factory: ServiceFactory<T>, singleton = true): void {
    this.factories.set(key, factory);
    if (singleton) {
      this.singletons.add(key);
    }
  }

  /**
   * Register a service instance directly
   */
  registerInstance<T>(key: string, instance: ServiceInstance<T>): void {
    this.instances.set(key, instance);
    this.singletons.add(key);
  }

  /**
   * Get a service instance
   */
  get<T>(key: string): T {
    // Return existing instance if available
    if (this.instances.has(key)) {
      return this.instances.get(key) as T;
    }

    // Create new instance from factory
    const factory = this.factories.get(key);
    if (!factory) {
      throw new Error(ERROR_MESSAGES.SERVICE_NOT_FOUND(key));
    }

    const instance = factory();

    // Store if singleton
    if (this.singletons.has(key)) {
      this.instances.set(key, instance);
    }

    return instance;
  }

  /**
   * Check if service is registered
   */
  has(key: string): boolean {
    return this.factories.has(key) || this.instances.has(key);
  }

  /**
   * Clear all services
   */
  clear(): void {
    this.factories.clear();
    this.instances.clear();
    this.singletons.clear();
  }
}

// Global service container instance
export const serviceContainer = new ServiceContainer();

/**
 * Service Keys for Dependency Injection
 */
export const SERVICE_KEYS = {
  ENGINE: 'slider-engine',
  PHYSICS: 'slider-physics',
  RENDERER: 'slider-renderer',
  CONTROLLER: 'slider-controller',
  EVENT_EMITTER: 'event-emitter',
} as const;
