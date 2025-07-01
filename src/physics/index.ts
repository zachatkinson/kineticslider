/**
 * @fileoverview Physics Module Index - GSAP Physics Engine Integration
 *
 * World-class GSAP physics engine providing smooth, natural motion.
 * Includes kinetic physics, spring physics, velocity tracking, and timeline factory.
 *
 * @version 1.0.0
 */

export { KineticPhysics } from './kinetic-physics';
export { PixiSliderRenderer } from './renderer';
export { SpringPhysics } from './spring-physics';
export { VelocityTracker } from './velocity-tracker';
export { GSAPTimelineFactory } from './gsap-timeline-factory';
export { SliderPhysicsEngine } from './engine';

// Export the main facade - this is what tests expect
export { SliderPhysics } from './facade';

export type {
  MomentumResult,
  SnapResult,
  KineticPhysicsConfig,
} from './kinetic-physics';

export type {
  VelocitySample,
  VelocityConfig,
  VelocityResult,
} from './velocity-tracker';

export type {
  SpringConfig,
  DisplacementConfig,
  SpringResult,
} from './spring-physics';

export type {
  TransitionConfig,
  MomentumConfig,
  SnapConfig,
  ScaleConfig,
} from './gsap-timeline-factory';

export type {
  RenderConfig,
  SlideData,
} from '../core/types';

// Main physics controller facade
export type { SliderPhysicsConfig } from './facade';

/**
 * Core physics components overview:
 *
 * ## KineticPhysics
 * - **Kinetic calculations** with momentum and snap
 * - **Advanced GSAP integration** with timeline coordination
 * - **Enhanced boundaries** with spring feedback
 * - **Real-time momentum** calculation and prediction
 *
 * ## SpringPhysics  
 * - **Spring-based animations** for natural feel
 * - **Displacement correction** for smooth interactions
 * - **Configurable spring parameters** for different behaviors
 * - **GSAP timeline integration** for complex spring sequences
 *
 * ## VelocityTracker
 * - **High-precision velocity** calculation for gesture recognition
 * - **Momentum prediction** for smooth transitions  
 * - **Optimized sampling** for best performance and accuracy
 * - **Memory-efficient** sample management with automatic cleanup
 *
 * ## GSAPTimelineFactory
 * - **Timeline coordination** for complex animation sequences
 * - **Performance optimization** through timeline reuse and batching
 * - **GSAP best practices** with proper cleanup and memory management
 * - **Advanced timeline features** including callbacks and progress tracking
 *
 * ## PixiSliderRenderer
 * - **GPU-accelerated PIXI.js rendering** for maximum performance  
 * - **GSAP timeline integration** for smooth sprite animations
 * - **Optimized sprite management** with efficient positioning
 * - **Memory-efficient resource** management with proper cleanup
 */
