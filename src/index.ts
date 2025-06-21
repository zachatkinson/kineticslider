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
export const KINETIC_SLIDER_VERSION = '1.0.0';

// Re-export core architecture components for public API
export type {
  // Domain Types
  SliderState,
  SliderError,
  SliderDomainEvent,
} from './domain/models.js';

// Export infrastructure components
export {
  Container,
  ContainerBuilder,
  createDefaultContainer,
  type ServiceDescriptor,
  type ContainerOptions,
} from './infrastructure/container.js';

export {
  createObservabilityManager,
  type ObservabilityConfig,
  type ObservabilityServices,
} from './infrastructure/observability/index.js';

/**
 * @todo Phase 2.0 - Core Slider Implementation
 * - Implement main KineticSlider class
 * - Add PIXI.js renderer integration
 * - Implement filter system
 * - Add animation engine
 * - Create input handling system
 * - Implement resource management
 *
 * @todo Phase 2.1 - Advanced Features
 * - Add advanced visual effects
 * - Implement touch/gesture support
 * - Add accessibility features
 * - Create responsive design system
 *
 * @todo Phase 2.2 - Performance Optimization
 * - Implement virtualization for large datasets
 * - Add progressive loading
 * - Optimize memory usage
 * - Add performance monitoring integration
 */
