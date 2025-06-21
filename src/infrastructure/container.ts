/**
 * Dependency Injection Container
 *
 * A lightweight DI container for managing service dependencies and lifecycle.
 * Supports singleton, transient, and factory patterns.
 */

// ===== CONTAINER TYPES =====

export type ServiceLifetime = 'singleton' | 'transient' | 'scoped';

export interface ServiceDescriptor<T = unknown> {
  token: string | symbol;
  factory: (container: Container) => T;
  lifetime: ServiceLifetime;
  instance?: T;
}

export interface ContainerOptions {
  enableValidation?: boolean;
  enableCircularDependencyDetection?: boolean;
}

// ===== CONTAINER IMPLEMENTATION =====

export class Container {
  private services = new Map<string | symbol, ServiceDescriptor>();
  private instances = new Map<string | symbol, unknown>();
  private resolutionStack = new Set<string | symbol>();
  private options: ContainerOptions;

  constructor(options: ContainerOptions = {}) {
    this.options = {
      enableValidation: true,
      enableCircularDependencyDetection: true,
      ...options,
    };
  }

  /**
   * Register a service with the container
   */
  register<T>(
    token: string | symbol,
    factory: (container: Container) => T,
    lifetime: ServiceLifetime = 'singleton'
  ): this {
    if (this.options.enableValidation && this.services.has(token)) {
      throw new Error(`Service '${String(token)}' is already registered`);
    }

    this.services.set(token, {
      token,
      factory,
      lifetime,
    });

    return this;
  }

  /**
   * Register a singleton service
   */
  registerSingleton<T>(
    token: string | symbol,
    factory: (container: Container) => T
  ): this {
    return this.register(token, factory, 'singleton');
  }

  /**
   * Register a transient service
   */
  registerTransient<T>(
    token: string | symbol,
    factory: (container: Container) => T
  ): this {
    return this.register(token, factory, 'transient');
  }

  /**
   * Register a scoped service
   */
  registerScoped<T>(
    token: string | symbol,
    factory: (container: Container) => T
  ): this {
    return this.register(token, factory, 'scoped');
  }

  /**
   * Register an instance directly
   */
  registerInstance<T>(token: string | symbol, instance: T): this {
    this.instances.set(token, instance);
    return this;
  }

  /**
   * Resolve a service from the container
   */
  resolve<T>(token: string | symbol): T {
    // Check for circular dependencies
    if (this.options.enableCircularDependencyDetection) {
      if (this.resolutionStack.has(token)) {
        const stackArray = Array.from(this.resolutionStack);
        throw new Error(
          `Circular dependency detected: ${stackArray.join(' -> ')} -> ${String(token)}`
        );
      }
    }

    // Check for direct instance
    if (this.instances.has(token)) {
      return this.instances.get(token) as T;
    }

    // Get service descriptor
    const descriptor = this.services.get(token);
    if (!descriptor) {
      throw new Error(`Service '${String(token)}' is not registered`);
    }

    // Handle different lifetimes
    switch (descriptor.lifetime) {
      case 'singleton':
        return this.resolveSingleton<T>(descriptor as ServiceDescriptor<T>);

      case 'transient':
        return this.resolveTransient<T>(descriptor as ServiceDescriptor<T>);

      case 'scoped':
        return this.resolveScoped<T>(descriptor as ServiceDescriptor<T>);

      default:
        throw new Error(`Unknown service lifetime: ${descriptor.lifetime}`);
    }
  }

  /**
   * Try to resolve a service, return null if not found
   */
  tryResolve<T>(token: string | symbol): T | null {
    try {
      return this.resolve<T>(token);
    } catch {
      return null;
    }
  }

  /**
   * Check if a service is registered
   */
  isRegistered(token: string | symbol): boolean {
    return this.services.has(token) || this.instances.has(token);
  }

  /**
   * Create a child container (scope)
   */
  createScope(): Container {
    const scope = new Container(this.options);

    // Copy service registrations
    for (const [token, descriptor] of this.services) {
      scope.services.set(token, { ...descriptor });
    }

    // Copy singleton instances
    for (const [token, instance] of this.instances) {
      scope.instances.set(token, instance);
    }

    return scope;
  }

  /**
   * Dispose the container and cleanup resources
   */
  dispose(): void {
    // Dispose instances that implement IDisposable
    for (const instance of this.instances.values()) {
      if (
        instance &&
        typeof (instance as { dispose?: () => void }).dispose === 'function'
      ) {
        (instance as { dispose: () => void }).dispose();
      }
    }

    this.services.clear();
    this.instances.clear();
    this.resolutionStack.clear();
  }

  /**
   * Get all registered service tokens
   */
  getRegisteredTokens(): (string | symbol)[] {
    const tokens = new Set<string | symbol>();

    for (const token of this.services.keys()) {
      tokens.add(token);
    }

    for (const token of this.instances.keys()) {
      tokens.add(token);
    }

    return Array.from(tokens);
  }

  // ===== PRIVATE METHODS =====

  private resolveSingleton<T>(descriptor: ServiceDescriptor<T>): T {
    if (descriptor.instance) {
      return descriptor.instance;
    }

    this.resolutionStack.add(descriptor.token);
    try {
      const instance = descriptor.factory(this);
      descriptor.instance = instance;
      return instance;
    } finally {
      this.resolutionStack.delete(descriptor.token);
    }
  }

  private resolveTransient<T>(descriptor: ServiceDescriptor<T>): T {
    this.resolutionStack.add(descriptor.token);
    try {
      return descriptor.factory(this);
    } finally {
      this.resolutionStack.delete(descriptor.token);
    }
  }

  private resolveScoped<T>(descriptor: ServiceDescriptor<T>): T {
    // For scoped services, behave like singleton within the scope
    return this.resolveSingleton<T>(descriptor);
  }
}

// ===== SERVICE TOKENS =====

/**
 * Service tokens for type-safe dependency injection
 */
export const ServiceTokens = {
  // Core Services
  SlideService: Symbol('SlideService'),
  NavigationService: Symbol('NavigationService'),
  AutoplayService: Symbol('AutoplayService'),
  AnimationService: Symbol('AnimationService'),
  ResponsiveService: Symbol('ResponsiveService'),

  // Infrastructure Services
  EventService: Symbol('EventService'),
  LoggerService: Symbol('LoggerService'),
  PerformanceService: Symbol('PerformanceService'),
  ErrorService: Symbol('ErrorService'),

  // Observability Services
  AnalyticsService: Symbol('AnalyticsService'),
  MonitoringService: Symbol('MonitoringService'),

  // Capability Services
  CapabilityService: Symbol('CapabilityService'),

  // Configuration
  SliderConfig: Symbol('SliderConfig'),
  SliderState: Symbol('SliderState'),
} as const;

// ===== CONTAINER BUILDER =====

/**
 * Builder pattern for configuring the container
 */
export class ContainerBuilder {
  private container: Container;

  constructor(options?: ContainerOptions) {
    this.container = new Container(options);
  }

  /**
   * Add singleton service
   */
  addSingleton<T>(
    token: string | symbol,
    factory: (container: Container) => T
  ): this {
    this.container.registerSingleton(token, factory);
    return this;
  }

  /**
   * Add transient service
   */
  addTransient<T>(
    token: string | symbol,
    factory: (container: Container) => T
  ): this {
    this.container.registerTransient(token, factory);
    return this;
  }

  /**
   * Add scoped service
   */
  addScoped<T>(
    token: string | symbol,
    factory: (container: Container) => T
  ): this {
    this.container.registerScoped(token, factory);
    return this;
  }

  /**
   * Add instance
   */
  addInstance<T>(token: string | symbol, instance: T): this {
    this.container.registerInstance(token, instance);
    return this;
  }

  /**
   * Build the container
   */
  build(): Container {
    return this.container;
  }
}

// ===== DECORATORS =====

/**
 * Injectable decorator for marking classes as injectable
 */
export function Injectable(token?: string | symbol) {
  return function <T extends new (...args: unknown[]) => unknown>(
    constructor: T
  ): T {
    // Store metadata for automatic registration
    (
      constructor as T & { __injectable: boolean; __token: string | symbol }
    ).__injectable = true;
    (
      constructor as T & { __injectable: boolean; __token: string | symbol }
    ).__token = token || constructor.name;
    return constructor;
  };
}

/**
 * Inject decorator for property injection
 */
export function Inject(token: string | symbol) {
  return function (target: Record<string, unknown>, propertyKey: string): void {
    // Store injection metadata - simplified without Reflect
    const existingTokens =
      (
        target as {
          __injectTokens?: Array<{
            token: string | symbol;
            propertyKey: string;
          }>;
        }
      ).__injectTokens || [];
    existingTokens.push({ token, propertyKey });
    (
      target as {
        __injectTokens: Array<{ token: string | symbol; propertyKey: string }>;
      }
    ).__injectTokens = existingTokens;
  };
}

// ===== UTILITY FUNCTIONS =====

/**
 * Create a default container with common services
 */
export function createDefaultContainer(): Container {
  return new ContainerBuilder({
    enableValidation: true,
    enableCircularDependencyDetection: true,
  }).build();
}

/**
 * Auto-register services marked with @Injectable
 */
export function autoRegisterServices(
  container: Container,
  services: Array<new (...args: unknown[]) => unknown>
): void {
  for (const service of services) {
    const serviceWithMeta = service as typeof service & {
      __injectable?: boolean;
      __token?: string | symbol;
    };
    if (serviceWithMeta.__injectable) {
      const token = serviceWithMeta.__token;
      if (token) {
        container.registerSingleton(token, () => new service());
      }
    }
  }
}
