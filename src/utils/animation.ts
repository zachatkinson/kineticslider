/**
 * GSAP Animation Controller for KineticSlider
 * Based on GSAP cursor rules for optimized animations
 */
import gsap from 'gsap';
import type { AnimationEase } from '../types/common';

// Animation Configuration Type
export interface AnimationConfig {
  target: string | Element | Element[];
  duration?: number;
  ease?: AnimationEase;
  delay?: number;
  clearProps?: boolean | string;
  autoKill?: boolean;
  overwrite?: boolean | 'auto';
  [key: string]: string | number | boolean | Element | Element[] | undefined;
}

// Timeline Configuration Type
export interface TimelineConfig {
  paused?: boolean;
  repeat?: number;
  yoyo?: boolean;
  smoothChildTiming?: boolean;
  autoRemoveChildren?: boolean;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Animation Controller class that follows cursor rules for GSAP
 * - Timeline management
 * - Performance optimization
 * - Memory management
 * - Best practices
 */
export class AnimationController {
  private timelines: Map<string, gsap.core.Timeline>;
  private tweens: Map<string, gsap.core.Tween>;
  private defaultConfig: Partial<AnimationConfig>;
  
  constructor(defaultConfig: Partial<AnimationConfig> = {}) {
    this.timelines = new Map();
    this.tweens = new Map();
    this.defaultConfig = {
      ease: 'power2.out',
      duration: 0.5,
      overwrite: 'auto',
      clearProps: true,
      ...defaultConfig
    };
    
    // Performance optimizations
    gsap.config({
      force3D: true,
      autoSleep: 120,
      nullTargetWarn: false
    });
  }
  
  /**
   * Create a timeline with the specified ID
   */
  createTimeline(id: string, config: TimelineConfig = {}): gsap.core.Timeline {
    this.killTimeline(id); // Clean up any existing timeline
    
    const timeline = gsap.timeline({
      paused: true,
      smoothChildTiming: true,
      autoRemoveChildren: false,
      ...config
    });
    
    this.timelines.set(id, timeline);
    return timeline;
  }
  
  /**
   * Get an existing timeline by ID
   */
  getTimeline(id: string): gsap.core.Timeline | undefined {
    return this.timelines.get(id);
  }
  
  /**
   * Kill a timeline by ID and remove from the registry
   */
  killTimeline(id: string): void {
    const timeline = this.timelines.get(id);
    if (timeline) {
      timeline.kill();
      this.timelines.delete(id);
    }
  }
  
  /**
   * Create an animation tween
   */
  createTween(
    id: string,
    config: AnimationConfig
  ): gsap.core.Tween {
    this.killTween(id); // Clean up any existing tween
    
    const mergedConfig = {
      ...this.defaultConfig,
      ...config
    };
    
    const tween = gsap.to(mergedConfig.target, mergedConfig as gsap.TweenVars);
    this.tweens.set(id, tween);
    
    return tween;
  }
  
  /**
   * Kill a tween by ID and remove from the registry
   */
  killTween(id: string): void {
    const tween = this.tweens.get(id);
    if (tween) {
      tween.kill();
      this.tweens.delete(id);
    }
  }
  
  /**
   * Kill all animations (timelines and tweens)
   */
  killAll(): void {
    // Kill all timelines
    this.timelines.forEach((timeline, id) => {
      timeline.kill();
      this.timelines.delete(id);
    });
    
    // Kill all tweens
    this.tweens.forEach((tween, id) => {
      tween.kill();
      this.tweens.delete(id);
    });
  }
  
  /**
   * Batch animations for performance
   */
  batchAnimations(
    animations: Array<{ id: string; config: AnimationConfig }>,
    staggerDelay = 0.05
  ): void {
    // Create a timeline for batching
    const batchTimeline = gsap.timeline();
    
    animations.forEach((animation, index) => {
      const { id, config } = animation;
      const mergedConfig = {
        ...this.defaultConfig,
        ...config,
        delay: staggerDelay * index + (config.delay || 0)
      };
      
      const tween = gsap.to(mergedConfig.target, mergedConfig as gsap.TweenVars);
      this.tweens.set(id, tween);
      
      // Add to batch timeline
      batchTimeline.add(tween, index === 0 ? 0 : `>-${staggerDelay}`);
    });
  }
}

// Export a singleton instance for shared animations
export const animationController = new AnimationController();

/**
 * Utility function to create a slide transition
 */
export function createSlideTransition(
  element: Element | string,
  direction: 'in' | 'out',
  type: 'fade' | 'slide' | 'zoom' = 'fade',
  duration = 0.5
): gsap.core.Tween {
  const id = typeof element === 'string' 
    ? element 
    : (element as HTMLElement).id || `transition-${Math.random().toString(36).substring(2, 9)}`;
  
  const config: Partial<gsap.TweenVars> = {
    target: element,
    duration,
    ease: 'power2.out',
    autoKill: true,
    overwrite: 'auto'
  };
  
  if (type === 'fade') {
    config['opacity'] = direction === 'in' ? 1 : 0;
    if (direction === 'in') {
      gsap.set(element, { opacity: 0 });
    }
  } else if (type === 'slide') {
    config['x'] = direction === 'in' ? 0 : '100%';
    if (direction === 'in') {
      gsap.set(element, { x: '-100%' });
    }
  } else if (type === 'zoom') {
    config['scale'] = direction === 'in' ? 1 : 0.5;
    config['opacity'] = direction === 'in' ? 1 : 0;
    if (direction === 'in') {
      gsap.set(element, { scale: 1.5, opacity: 0 });
    }
  }
  
  return animationController.createTween(id, config as AnimationConfig);
} 