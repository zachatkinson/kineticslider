/**
 * GSAP Animation Controller for KineticSlider
 * Based on GSAP cursor rules for optimized animations
 */
import gsap from 'gsap';
import type { AnimationEase } from '../types/common';
import { AnimationConfig, TimelineConfig, TransitionType, ExtendedAnimationConfig } from '../types/animation';
import type { AnimationOptions } from '../types/animation';

export type { AnimationConfig, TimelineConfig };

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
  private defaultConfig: Partial<ExtendedAnimationConfig>;
  
  constructor(defaultConfig: Partial<ExtendedAnimationConfig> = {}) {
    this.timelines = new Map();
    this.tweens = new Map();
    this.defaultConfig = defaultConfig;
    
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
    config: ExtendedAnimationConfig
  ): gsap.core.Tween {
    this.killTween(id); // Clean up any existing tween
    
    const { target, ...tweenConfig } = {
      ...this.defaultConfig,
      ...config
    };
    
    const tween = gsap.to(target, tweenConfig);
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
    animations: Array<{ id: string; config: ExtendedAnimationConfig }>,
    staggerDelay = 0.05
  ): void {
    // Create a timeline for batching
    const batchTimeline = gsap.timeline();
    
    animations.forEach((animation, index) => {
      const { id, config } = animation;
      const { target, ...tweenConfig } = {
        ...this.defaultConfig,
        ...config,
        delay: (staggerDelay * index) + (Number(config.delay) || 0)
      };
      
      const tween = gsap.to(target, tweenConfig);
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
  type: TransitionType = TransitionType.FADE,
  duration = 0.5
): gsap.core.Tween {
  const id = typeof element === 'string' 
    ? element 
    : (element as HTMLElement).id || `transition-${Math.random().toString(36).substring(2, 9)}`;
  
  const config: ExtendedAnimationConfig = {
    target: element,
    duration,
    ease: 'power2.out',
    autoKill: true,
    overwrite: 'auto'
  };
  
  if (type === TransitionType.FADE) {
    config.opacity = direction === 'in' ? 1 : 0;
    if (direction === 'in') {
      gsap.set(element, { opacity: 0 });
    }
  } else if (type === TransitionType.SLIDE) {
    config.x = direction === 'in' ? 0 : '100%';
    if (direction === 'in') {
      gsap.set(element, { x: '-100%' });
    }
  } else if (type === TransitionType.ZOOM) {
    config.scale = direction === 'in' ? 1 : 0.5;
    config.opacity = direction === 'in' ? 1 : 0;
    if (direction === 'in') {
      gsap.set(element, { scale: 1.5, opacity: 0 });
    }
  }
  
  return animationController.createTween(id, config);
}

/**
 * Animates a slide transition in the slider
 */
export function animateSlide(
  sliderRef: React.RefObject<HTMLElement>,
  currentSlide: number,
  direction: 'next' | 'prev',
  duration: number,
  ease: string,
  onComplete?: () => void
): void {
  if (!sliderRef.current) return;
  
  const slideElements = Array.from(sliderRef.current.children) as HTMLElement[];
  const currentSlideEl = slideElements[currentSlide];
  const nextIndex = (currentSlide + 1) % slideElements.length;
  const prevIndex = (currentSlide - 1 + slideElements.length) % slideElements.length;
  const targetSlide = direction === 'next' 
    ? slideElements[nextIndex]
    : slideElements[prevIndex];

  if (!currentSlideEl || !targetSlide) return;

  // Reset positions
  gsap.set(slideElements, { 
    x: '100%',
    opacity: 0,
    scale: 0.8,
    zIndex: 1
  });

  gsap.set(currentSlideEl, { 
    x: '0%',
    opacity: 1,
    scale: 1,
    zIndex: 2
  });

  // Animate current slide out
  gsap.to(currentSlideEl, {
    x: direction === 'next' ? '-100%' : '100%',
    opacity: 0,
    scale: 0.8,
    duration,
    ease,
  });

  // Animate target slide in
  gsap.fromTo(targetSlide,
    {
      x: direction === 'next' ? '100%' : '-100%',
      opacity: 0,
      scale: 0.8,
      zIndex: 3
    },
    {
      x: '0%',
      opacity: 1,
      scale: 1,
      duration,
      ease,
      onComplete
    }
  );
}

/**
 * Create a basic GSAP animation with default configuration
 * @param options Animation configuration options
 * @returns Cleanup function to kill the animation
 */
export function createBasicAnimation(options: AnimationOptions): () => void {
  const animation = gsap.to(options.target, {
    x: 0,
    duration: options.config.duration,
    ease: options.config.ease,
    ...(options.onComplete && { onComplete: options.onComplete }),
  });

  return () => {
    animation.kill();
  };
}

/**
 * Create a fade animation
 * @param target Element to animate
 * @param duration Animation duration in seconds
 * @param fadeIn Whether to fade in or out
 * @returns Cleanup function to kill the animation
 */
export function createFadeAnimation(
  target: gsap.TweenTarget,
  duration: number = 0.3,
  fadeIn: boolean = true
): () => void {
  const animation = gsap.to(target, {
    opacity: fadeIn ? 1 : 0,
    duration,
    ease: 'power2.inOut',
  });

  return () => {
    animation.kill();
  };
}

/**
 * Create a slide animation
 * @param target Element to animate
 * @param direction Direction to slide ('left' | 'right' | 'up' | 'down')
 * @param duration Animation duration in seconds
 * @param distance Distance to slide in pixels
 * @returns Cleanup function to kill the animation
 */
export function createSlideAnimation(
  target: gsap.TweenTarget,
  direction: 'left' | 'right' | 'up' | 'down',
  duration: number = 0.3,
  distance: number = 100
): () => void {
  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y';
  const multiplier = direction === 'right' || direction === 'down' ? 1 : -1;

  const animation = gsap.to(target, {
    [axis]: distance * multiplier,
    duration,
    ease: 'power2.inOut',
  });

  return () => {
    animation.kill();
  };
} 