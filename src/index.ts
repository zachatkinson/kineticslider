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
import { SliderEngine } from './core/engine';
import { SliderPhysics } from './physics';
import { PixiSliderRenderer } from './physics/renderer'; // FIXED: Use tested renderer
import { SliderController } from './input';
import { SimpleEventEmitter } from './core/event-emitter';

// Export all core components for external use
export { SliderEngine } from './core/engine';
export { SliderPhysics } from './physics';
export { PixiSliderRenderer } from './physics/renderer'; // FIXED: Export tested class
export { SliderController } from './input';
export { SimpleEventEmitter } from './core/event-emitter';
export { serviceContainer, SERVICE_KEYS } from './core/container';

// Export all types
export type * from './core/types';

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
    return new SliderPhysics();
  });

  // Register renderer factory
  serviceContainer.register(SERVICE_KEYS.RENDERER, () => {
    return new PixiSliderRenderer();
  });

  // Register controller factory
  serviceContainer.register(SERVICE_KEYS.CONTROLLER, () => {
    return new SliderController();
  });

  // Register main engine factory (depends on other services)
  serviceContainer.register(SERVICE_KEYS.ENGINE, () => {
    const engine = new SliderEngine();
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
export function createKineticSlider(): SliderEngine {
  // Ensure services are initialized
  if (!serviceContainer.has(SERVICE_KEYS.ENGINE)) {
    initializeSliderServices();
  }

  // Return configured engine
  return serviceContainer.get<SliderEngine>(SERVICE_KEYS.ENGINE);
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

/**
 * @todo Phase 1.1 - Core Architecture (Week 1, Days 1-2)
 * - [x] Clean foundation established
 * - [ ] SliderEngine class - Core state management
 * - [ ] SliderPhysics class - GSAP physics calculations
 * - [ ] SliderRenderer class - PIXI.js + GSAP rendering
 * - [ ] SliderController class - Input handling
 *
 * @todo Phase 1.2 - GSAP Foundation Porting (Week 1, Days 3-5)
 * - [ ] Extract physics from main branch useSlides.ts
 * - [ ] Extract input handling from useMouseDrag.ts
 * - [ ] Extract animation coordination from AnimationCoordinator.ts
 * - [ ] Create comprehensive unit tests (90%+ coverage)
 *
 * @todo Phase 1.3 - PIXI.js + GSAP Integration (Week 2, Days 1-3)
 * - [ ] PixiRenderer class with modern patterns
 * - [ ] GSAPPixiAdapter for seamless integration
 * - [ ] DisplacementEffects from main branch (enhanced)
 * - [ ] Performance monitoring and optimization
 *
 * @todo Phase 1.4 - Core Slider Features (Week 2, Days 4-5)
 * - [ ] SliderCore class with intuitive API
 * - [ ] AutoPlayManager and LoopManager
 * - [ ] Developer experience and configuration
 * - [ ] Error handling and recovery
 *
 * @todo Phase 1.5 - Polish & Accessibility (Week 3)
 * - [ ] WCAG 2.1 AA accessibility compliance
 * - [ ] Performance optimization (60fps mobile)
 * - [ ] Cross-platform testing and validation
 *
 * @todo Phase 1.6 - Documentation & Release (Week 4)
 * - [ ] Comprehensive documentation and examples
 * - [ ] Interactive demos and CodeSandbox templates
 * - [ ] NPM package and community launch
 */
