/**
 * @fileoverview KineticSlider - High-Performance PIXI.js-based Image Slider
 *
 * This is the main entry point for the KineticSlider library, providing a complete
 * solution for creating smooth, hardware-accelerated image sliders with advanced
 * visual effects and animations.
 *
 * @version 1.0.0
 * @author KineticSlider Team
 * @since 1.0.0
 */

/**
 * The current version of the KineticSlider library.
 *
 * @constant {string} KINETIC_SLIDER_VERSION
 * @description Semantic version string following semver.org standards
 * @example
 * ```typescript
 * import { KINETIC_SLIDER_VERSION } from 'kineticslider';
 * console.log(`Using KineticSlider v${KINETIC_SLIDER_VERSION}`);
 * ```
 */
import { VERSION } from './core/constants';

export const KINETIC_SLIDER_VERSION = VERSION;

import { serviceContainer, SERVICE_KEYS } from './core/container';
import { SliderCore } from './core/slider-core';
import { SliderPhysics } from './physics';
import { SliderRenderer } from './rendering'; // UPDATED: Use unified renderer
import { SliderController } from './input';
import { SimpleEventEmitter } from './core/event-emitter';

// Export all core components for external use
export { SliderCore as SliderEngine } from './core/slider-core';
export { SliderPhysics } from './physics';
export { SliderRenderer } from './rendering'; // UPDATED: Export unified class
export { SliderController } from './input';
export { SimpleEventEmitter } from './core/event-emitter';
export { serviceContainer, SERVICE_KEYS } from './core/container';

// Managers
export {
  ManagerCoordinator,
  AnimationManager,
  PerformanceMonitor,
  MemoryManager,
  AnimationQueue,
} from './managers';

// Configuration system (Phase 4.2)
export {
  ConfigValidator,
  DefaultsManager,
  defaultsManager,
  ConfigurationSystem,
  VALIDATION_ERROR_CODES,
  VALIDATION_WARNING_CODES,
  DEFAULT_CONFIGS,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
} from './config';

// React components
export { KineticSlider } from './components';
export type { KineticSliderProps } from './components';

// Export all types
export type * from './core/types';

// Export enums explicitly (they need value exports, not just type exports)
export { ScaleMode } from './core/types';

/**
 * Initialize the KineticSlider dependency injection container
 *
 * This sets up all services with proper factories for clean dependency management.
 * Call this once before using any slider components.
 *
 * @example
 * ```typescript
 * import { initializeSliderServices, SliderEngine } from '@kinetic/slider';
 *
 * // Initialize services
 * initializeSliderServices();
 *
 * // Create slider engine
 * const engine = serviceContainer.get<SliderEngine>(SERVICE_KEYS.ENGINE);
 * ```
 */
export function initializeSliderServices(): void {
  // Register event emitter (singleton)
  const eventEmitter = new SimpleEventEmitter();
  serviceContainer.registerInstance(SERVICE_KEYS.EVENT_EMITTER, eventEmitter);

  // Register physics engine factory
  serviceContainer.register(SERVICE_KEYS.PHYSICS, () => {
    // Minimal config for factory registration - actual config provided during usage
    return new SliderPhysics({
      slideCount: 1,
      slideWidth: 800,
      container: document.createElement('div'), // Temporary container
      sprites: [],
    });
  });

  // Register renderer factory
  serviceContainer.register(SERVICE_KEYS.RENDERER, () => {
    return new SliderRenderer();
  });

  // Register controller factory
  serviceContainer.register(SERVICE_KEYS.CONTROLLER, () => {
    return new SliderController();
  });

  // Register main engine factory (depends on other services)
  serviceContainer.register(SERVICE_KEYS.ENGINE, () => {
    const engine = new SliderCore();
    // Dependencies are injected via the service container when needed
    return engine;
  });
}

/**
 * Create a fully configured KineticSlider instance
 *
 * This is a convenience factory that initializes services and returns
 * a ready-to-use slider engine.
 *
 * @example
 * ```typescript
 * import { createKineticSlider } from '@kinetic/slider';
 *
 * const slider = createKineticSlider();
 * await slider.initialize(config);
 * ```
 */
export function createKineticSlider(): SliderCore {
  // Ensure services are initialized
  if (!serviceContainer.has(SERVICE_KEYS.ENGINE)) {
    initializeSliderServices();
  }

  // Return configured engine
  return serviceContainer.get<SliderCore>(SERVICE_KEYS.ENGINE);
}

/**
 * Reset all slider services
 *
 * Useful for testing or when you need to completely reinitialize the slider.
 */
export function resetSliderServices(): void {
  serviceContainer.clear();
}

// Auto-initialize services when imported (can be disabled by calling resetSliderServices)
initializeSliderServices();
