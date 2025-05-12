/**
 * GSAP Animation Controller for KineticSlider
 * Based on GSAP cursor rules for optimized animations
 */
import gsap from "gsap";
import type { AnimationEase as _AnimationEase } from "../types/common";
import {
  AnimationConfig,
  TimelineConfig,
  TransitionType,
  ExtendedAnimationConfig,
} from "../types/animation";
import type { AnimationOptions } from "../types/animation";

export type { AnimationConfig, TimelineConfig };

/**
 * Animation Controller class that follows cursor rules for GSAP
 * - Timeline management
 * - Performance optimization
 * - Memory management
 * - Best practices
 *
 * @example Example usage
 */
export class AnimationController {
  private timelines: Map<string, gsap.core.Timeline>;
  private tweens: Map<string, gsap.core.Tween>;
  private defaultConfig: Partial<ExtendedAnimationConfig>;

  /**
   *
   */
  constructor(defaultConfig: Partial<ExtendedAnimationConfig> = {}) {
    this.timelines = new Map();
    this.tweens = new Map();
    this.defaultConfig = defaultConfig;

    // Performance optimizations
    gsap.config({
      force3D: true,
      autoSleep: 120,
      nullTargetWarn: false,
    });
  }

  /**
   * Create a timeline with the specified ID
   *
   * @param id
   *
   * @param config
   *
   * @returns {gsap.core.Timeline} A GSAP timeline instance
   *
   */
  createTimeline(id: string, config: TimelineConfig = {}): gsap.core.Timeline {
    this.killTimeline(id); // Clean up any existing timeline

    const timeline = gsap.timeline({
      paused: true,
      smoothChildTiming: true,
      autoRemoveChildren: false,
      ...config,
    });

    this.timelines.set(id, timeline);
    return timeline;
  }

  /**
   * Get an existing timeline by ID
   *
   * @param id - The ID of the timeline to retrieve
   *
   * @returns {gsap.core.Timeline | undefined} The timeline with the specified ID or undefined if not found
   *
   */
  getTimeline(id: string): gsap.core.Timeline | undefined {
    return this.timelines.get(id);
  }

  /**
   * Kill a timeline by ID and remove from the registry
   *
   * @param id
   *
   * @returns {void}
   *
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
   *
   * @param id
   *
   * @param config
   *
   * @returns {gsap.core.Tween} A GSAP tween instance
   *
   */
  createTween(id: string, config: ExtendedAnimationConfig): gsap.core.Tween {
    this.killTween(id); // Clean up any existing tween

    const { target, ...tweenConfig } = {
      ...this.defaultConfig,
      ...config,
    };

    const tween = gsap.to(target, tweenConfig);
    this.tweens.set(id, tween);

    return tween;
  }

  /**
   * Kill a tween by ID and remove from the registry
   *
   * @param id
   *
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
   *
   * @param animations
   *
   * @param staggerDelay
   *
   * @returns {void}
   *
   */
  batchAnimations(
    animations: Array<{ id: string; config: ExtendedAnimationConfig }>,
    staggerDelay = 0.05,
  ): void {
    // Create a timeline for batching
    const batchTimeline = gsap.timeline();

    animations.forEach((animation, index) => {
      const { id, config } = animation;
      const { target, ...tweenConfig } = {
        ...this.defaultConfig,
        ...config,
        delay: staggerDelay * index + (Number(config.delay) || 0),
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
 *
 * @param element
 *
 * @param direction
 *
 * @param type
 *
 * @param duration
 *
 * @returns A GSAP tween instance for the slide transition
 *
 */
export function createSlideTransition(
  element: Element | string,
  direction: "in" | "out",
  type: TransitionType = TransitionType.FADE,
  duration = 0.5,
): gsap.core.Tween {
  const id =
    typeof element === "string"
      ? element
      : (element as HTMLElement).id ||
        `transition-${Math.random().toString(36).substring(2, 9)}`;

  const config: ExtendedAnimationConfig = {
    target: element,
    duration,
    ease: "power2.out",
    autoKill: true,
    overwrite: "auto",
  };

  if (type === TransitionType.FADE) {
    config.opacity = direction === "in" ? 1 : 0;
    if (direction === "in") {
      gsap.set(element, { opacity: 0 });
    }
  } else if (type === TransitionType.SLIDE) {
    config.x = direction === "in" ? 0 : "100%";
    if (direction === "in") {
      gsap.set(element, { x: "-100%" });
    }
  } else if (type === TransitionType.ZOOM) {
    config.scale = direction === "in" ? 1 : 0.5;
    config.opacity = direction === "in" ? 1 : 0;
    if (direction === "in") {
      gsap.set(element, { scale: 1.5, opacity: 0 });
    }
  }

  return animationController.createTween(id, config);
}

/**
 * Animates a slide transition in the slider
 *
 * @param sliderRef
 *
 * @param currentSlide
 *
 * @param direction
 *
 * @param duration
 *
 * @param ease
 *
 * @param onComplete
 *
 * @returns {void}
 *
 */
export function animateSlide(
  sliderRef: React.RefObject<HTMLElement>,
  currentSlide: number,
  direction: "next" | "prev",
  duration: number,
  ease: string,
  onComplete?: () => void,
): void {
  if (!sliderRef.current) return;

  const slideElements = Array.from(sliderRef.current.children) as HTMLElement[];
  const currentSlideEl = slideElements[currentSlide];
  const nextIndex = (currentSlide + 1) % slideElements.length;
  const prevIndex =
    (currentSlide - 1 + slideElements.length) % slideElements.length;
  const targetSlide =
    direction === "next" ? slideElements[nextIndex] : slideElements[prevIndex];

  if (!currentSlideEl || !targetSlide) return;

  // Reset positions
  gsap.set(slideElements, {
    x: "100%",
    opacity: 0,
    scale: 0.8,
    zIndex: 1,
  });

  gsap.set(currentSlideEl, {
    x: "0%",
    opacity: 1,
    scale: 1,
    zIndex: 2,
  });

  // Animate to new slide
  gsap.fromTo(
    targetSlide,
    {
      x: direction === "next" ? "100%" : "-100%",
      opacity: 0,
      scale: 0.8,
      zIndex: 3,
    },
    {
      x: "0%",
      opacity: 1,
      scale: 1,
      ease: ease,
      duration: duration,
      onComplete: onComplete,
    },
  );

  // Animate current slide out
  gsap.to(currentSlideEl, {
    x: direction === "next" ? "-100%" : "100%",
    opacity: 0,
    scale: 0.8,
    ease: ease,
    duration: duration,
  });
}

/**
 * Utility function to create a basic animation
 *
 * @param options Animation options
 *
 * @returns Cleanup function to stop the animation
 *
 */
export function createBasicAnimation(options: AnimationOptions): () => void {
  const animation = gsap.to(options.target, {
    duration: options.config.duration || 0.3,
    ease: options.config.ease || "power2.out",
    ...(options.onComplete && { onComplete: options.onComplete }),
  });

  return () => {
    animation.kill();
  };
}

/**
 * Create a fade animation (in or out)
 *
 * @param target Element to animate
 *
 * @param duration Animation duration in seconds
 *
 * @param fadeIn Whether to fade in (true) or out (false)
 *
 * @returns Cleanup function to stop the animation
 *
 */
export function createFadeAnimation(
  target: gsap.TweenTarget,
  duration: number = 0.3,
  fadeIn: boolean = true,
): () => void {
  const animation = gsap.to(target, {
    opacity: fadeIn ? 1 : 0,
    duration,
    ease: "power2.inOut",
  });

  return () => {
    animation.kill();
  };
}

/**
 * Create a slide animation
 *
 * @param target Element to animate
 *
 * @param direction Direction to slide
 *
 * @param duration Animation duration in seconds
 *
 * @param distance Distance to slide in pixels
 *
 * @returns Cleanup function to stop the animation
 *
 */
export function createSlideAnimation(
  target: gsap.TweenTarget,
  direction: "left" | "right" | "up" | "down",
  duration: number = 0.3,
  distance: number = 100,
): () => void {
  const axis = direction === "left" || direction === "right" ? "x" : "y";
  const multiplier = direction === "right" || direction === "down" ? 1 : -1;

  const animation = gsap.to(target, {
    [axis]: multiplier * distance,
    duration,
    ease: "power2.inOut",
  });

  return () => {
    animation.kill();
  };
}

/**
 * Creates a tween animation using GSAP
 *
 * @param target - The target element or object to animate
 *
 * @param props - The animation properties
 *
 * @param options - Additional options for the animation
 *
 * @returns {gsap.core.Tween} The GSAP animation tween instance
 *
 */
export function createTween(
  target: gsap.TweenTarget,
  props: gsap.TweenVars,
  options?: AnimationOptions,
): gsap.core.Tween {
  return gsap.to(target, {
    ...props,
    duration: options?.config?.duration || 0.5,
    ease: options?.config?.ease || "power2.out",
  });
}

/**
 * Creates a timeline animation using GSAP
 *
 * @param options - Timeline options
 *
 * @returns {gsap.core.Timeline} The GSAP timeline instance
 *
 */
export function createTimeline(
  options?: gsap.TimelineVars,
): gsap.core.Timeline {
  return gsap.timeline(options);
}

/**
 * Registers a custom animation effect
 *
 * @param name - The name of the animation effect
 *
 * @param animationFn - The animation function
 *
 * @returns {void}
 *
 */
export function registerEffect(
  name: string,
  animationFn: (
    target: gsap.TweenTarget,
    options?: gsap.TweenVars,
  ) => gsap.core.Tween,
): void {
  gsap.registerEffect({ name, effect: animationFn });
}

/**
 * Applies a predefined animation effect
 *
 * @param name - The name of the effect to apply
 *
 * @param target - The target element or object
 *
 * @param options - Additional options for the effect
 *
 * @returns {gsap.core.Tween} The resulting animation tween
 *
 */
export function applyEffect(
  name: string,
  target: gsap.TweenTarget,
  options?: gsap.TweenVars,
): gsap.core.Tween {
  return gsap.effects[name](target, options);
}
