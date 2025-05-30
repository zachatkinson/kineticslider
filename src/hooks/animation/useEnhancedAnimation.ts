/**
 * Enhanced Animation Hook for Phase 3
 * 
 * Provides a comprehensive, type-safe API for creating and managing GSAP animations
 * with distortion effects, timeline management, and performance monitoring.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { gsap } from 'gsap';
import type { Container } from 'pixi.js';
import type {
  AnimationHookConfig as _AnimationHookConfig,
  AnimationHookReturn,
  EnhancedAnimationConfig,
  SlideTransitionConfig,
  DisplacementConfig,
  FilterEffectConfig,
  ImageDistortionConfig,
  TextDistortionConfig,
  AnimationMetrics,
  TimelineOptions,
  AnimationInstance,
  AnimationEvent,
  AnimationEventHandler as _AnimationEventHandler,
  EnhancedAnimationHookConfig
} from '../../types/animation';
import {
  AnimationType,
  AnimationPriority as _AnimationPriority,
  TimelineState,
  AnimationError,
  AnimationErrorCode
} from '../../types/animation';
import { TimelineManager } from '../../utils/animation/TimelineManager';
import { log } from '../../utils/logger';

/**
 * Enhanced animation hook with timeline management and performance monitoring
 * 
 * @param config - Animation configuration options
 * 
 * @returns Animation control interface with timeline management
 *
 */
export function useEnhancedAnimation(config: EnhancedAnimationHookConfig = {}): AnimationHookReturn {
  const {
    enableProfiling = false,
    maxConcurrentAnimations: _maxConcurrentAnimations = 20,
    defaultEasing = 'power3.out',
    defaultDuration = 1,
    performanceMode = 'balanced',
    debugMode = false,
    enableDistortionEffects = true,
    onAnimationEvent
  } = config;

  // Timeline and Animation Management
  const timelineManagerRef = useRef<TimelineManager>(TimelineManager.getInstance());
  const activeAnimationsRef = useRef<Map<string, AnimationInstance>>(new Map());
  const animationCounterRef = useRef(0);
  const isProfilingRef = useRef(false);
  const activeTimelineCountRef = useRef(0);

  // State
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTimelineCount, setActiveTimelineCount] = useState(0);
  const [performanceMetrics, setPerformanceMetrics] = useState<AnimationMetrics>(() => 
    timelineManagerRef.current.getMetrics()
  );

  // Distortion Configuration
  const distortionConfigRef = useRef({
    image: {
      enabled: enableDistortionEffects,
      effects: [],
      globalIntensity: 1,
      interactive: true,
      momentum: 0.14,
      scaleIntensity: 0.65
    } as ImageDistortionConfig,
    text: {
      enabled: enableDistortionEffects,
      effects: [],
      globalIntensity: 1,
      interactive: true,
      separateFromImage: true
    } as TextDistortionConfig
  });

  // Helper Functions
  const emitAnimationEvent = useCallback((
    type: AnimationEvent['type'], 
    animationId: string, 
    target?: Container | Container[], 
    progress?: number
  ): void => {
    if (onAnimationEvent) {
      const event: AnimationEvent = {
        type,
        animationId,
        target,
        progress,
        timestamp: Date.now()
      };
      onAnimationEvent(event);
    }
  }, [onAnimationEvent]);

  // Timeline Management
  const createTimeline = useCallback((options: TimelineOptions = {}): string => {
    try {
      const timelineId = timelineManagerRef.current.createTimeline(options);
      
      // Update count immediately
      activeTimelineCountRef.current += 1;
      setActiveTimelineCount(activeTimelineCountRef.current);
      
      if (debugMode) {
        log.debug(`Created timeline: ${timelineId}`);
      }
      
      return timelineId;
    } catch (error) {
      log.error('Failed to create timeline:', error as Error);
      throw error;
    }
  }, [debugMode]);

  const getTimeline = useCallback((id: string): gsap.core.Timeline | null => {
    return timelineManagerRef.current.getTimeline(id);
  }, []);

  const killTimeline = useCallback((id: string): void => {
    try {
      timelineManagerRef.current.killTimeline(id);
      
      // Update count immediately
      activeTimelineCountRef.current = Math.max(0, activeTimelineCountRef.current - 1);
      setActiveTimelineCount(activeTimelineCountRef.current);
      
      if (debugMode) {
        log.debug(`Killed timeline: ${id}`);
      }
    } catch (error) {
      log.error(`Failed to kill timeline ${id}:`, error as Error);
    }
  }, [debugMode]);

  const pauseTimeline = useCallback((id: string): void => {
    try {
      timelineManagerRef.current.pauseTimeline(id);
      
      if (debugMode) {
        log.debug(`Paused timeline: ${id}`);
      }
    } catch (error) {
      log.error(`Failed to pause timeline ${id}:`, error as Error);
    }
  }, [debugMode]);

  const resumeTimeline = useCallback((id: string): void => {
    try {
      timelineManagerRef.current.resumeTimeline(id);
      
      if (debugMode) {
        log.debug(`Resumed timeline: ${id}`);
      }
    } catch (error) {
      log.error(`Failed to resume timeline ${id}:`, error as Error);
    }
  }, [debugMode]);

  // Animation Creation
  const animate = useCallback((
    target: Container | Container[], 
    config: EnhancedAnimationConfig
  ): string => {
    if (!target) {
      throw new AnimationError(
        'Animation target is required',
        AnimationErrorCode.INVALID_TARGET
      );
    }

    const animationId = `anim_${++animationCounterRef.current}_${Date.now()}`;
    
    try {
      // Apply defaults only for properties not specified in config
      const animConfig = {
        ...config,
        ease: config.ease || defaultEasing,
        duration: config.duration || defaultDuration,
      };

      // Create the GSAP tween
      const tween = gsap.to(target, animConfig);
      
      // Create animation instance
      const animationInstance: AnimationInstance = {
        id: animationId,
        type: config.type,
        config: animConfig as EnhancedAnimationConfig,
        tween,
        target,
        state: TimelineState.PLAYING,
        progress: 0,
        startTime: Date.now(),
        duration: animConfig.duration * 1000 // Convert to milliseconds
      };

      // Track the animation - set isAnimating to true immediately
      activeAnimationsRef.current.set(animationId, animationInstance);
      setIsAnimating(true);

      // Set up callbacks
      tween.eventCallback('onStart', () => {
        animationInstance.state = TimelineState.PLAYING;
        // isAnimating should already be true, but ensure it
        setIsAnimating(true);
        emitAnimationEvent('start', animationId);
        animConfig.onStart?.();
      });

      tween.eventCallback('onUpdate', () => {
        animationInstance.progress = tween.progress();
        emitAnimationEvent('update', animationId, target, animationInstance.progress);
        animConfig.onUpdate?.(animationInstance.progress);
      });

      tween.eventCallback('onComplete', () => {
        animationInstance.state = TimelineState.COMPLETED;
        activeAnimationsRef.current.delete(animationId);
        
        // Update isAnimating state
        if (activeAnimationsRef.current.size === 0) {
          setIsAnimating(false);
        }
        
        emitAnimationEvent('complete', animationId);
        animConfig.onComplete?.();
      });

      tween.eventCallback('onInterrupt', () => {
        animationInstance.state = TimelineState.KILLED;
        activeAnimationsRef.current.delete(animationId);
        
        if (activeAnimationsRef.current.size === 0) {
          setIsAnimating(false);
        }
        
        emitAnimationEvent('interrupt', animationId);
        animConfig.onInterrupt?.();
      });

      if (debugMode) {
        log.debug(`Created animation: ${animationId}`, { config: animConfig, target });
      }

      return animationId;
    } catch (error) {
      log.error(`Failed to create animation ${animationId}:`, error as Error);
      throw new AnimationError(
        `Failed to create animation: ${error}`,
        AnimationErrorCode.INVALID_CONFIG,
        animationId
      );
    }
  }, [defaultDuration, defaultEasing, debugMode, emitAnimationEvent]);

  // Specialized Animation Methods
  const animateSlideTransition = useCallback((
    fromIndex: number, 
    toIndex: number, 
    config: Partial<SlideTransitionConfig> = {}
  ): string => {
    const timelineId = createTimeline({
      onComplete: config.onComplete
    });

    const _slideConfig: SlideTransitionConfig = {
      type: AnimationType.SLIDE_TRANSITION,
      duration: config.duration || defaultDuration,
      ease: config.ease || defaultEasing,
      scaleIntensity: config.scaleIntensity || 1.2,
      direction: toIndex > fromIndex ? 'forward' : 'backward',
      stagger: config.stagger || 0.1,
      onStart: config.onStart,
      onUpdate: config.onUpdate,
      onComplete: config.onComplete,
      onInterrupt: config.onInterrupt,
      delay: config.delay,
      repeat: config.repeat,
      repeatDelay: config.repeatDelay,
      yoyo: config.yoyo
    };

    if (debugMode) {
      log.debug(`Creating slide transition: ${fromIndex} → ${toIndex}`);
    }

    // Implementation would depend on specific slide elements
    // This is a placeholder for the actual slide transition logic
    
    return timelineId;
  }, [createTimeline, defaultDuration, defaultEasing, debugMode]);

  const animateDisplacement = useCallback((_config: DisplacementConfig): string => {
    if (!enableDistortionEffects) {
      log.warn('Distortion effects are disabled');
      return '';
    }

    const animationId = `disp_${++animationCounterRef.current}_${Date.now()}`;
    
    // Implementation would depend on displacement filter setup
    // This is a placeholder for displacement animation logic
    
    if (debugMode) {
      log.debug(`Creating displacement animation: ${animationId}`);
    }

    return animationId;
  }, [enableDistortionEffects, debugMode]);

  const animateFilter = useCallback((_config: FilterEffectConfig): string => {
    const animationId = `filter_${++animationCounterRef.current}_${Date.now()}`;
    
    // Implementation would depend on filter system setup
    // This is a placeholder for filter animation logic
    
    if (debugMode) {
      log.debug(`Creating filter animation: ${animationId}`);
    }

    return animationId;
  }, [debugMode]);

  // Distortion Controls
  const setImageDistortion = useCallback((config: Partial<ImageDistortionConfig>): void => {
    distortionConfigRef.current.image = {
      ...distortionConfigRef.current.image,
      ...config
    };
    
    if (debugMode) {
      log.debug('Updated image distortion config');
    }
  }, [debugMode]);

  const setTextDistortion = useCallback((config: Partial<TextDistortionConfig>): void => {
    distortionConfigRef.current.text = {
      ...distortionConfigRef.current.text,
      ...config
    };
    
    if (debugMode) {
      log.debug('Updated text distortion config');
    }
  }, [debugMode]);

  const updateDistortionIntensity = useCallback((
    target: 'image' | 'text' | 'both', 
    intensity: number
  ): void => {
    const clampedIntensity = Math.max(0, Math.min(2, intensity));
    
    if (target === 'image' || target === 'both') {
      distortionConfigRef.current.image.globalIntensity = clampedIntensity;
    }
    
    if (target === 'text' || target === 'both') {
      distortionConfigRef.current.text.globalIntensity = clampedIntensity;
    }
    
    if (debugMode) {
      log.debug(`Updated ${target} distortion intensity: ${clampedIntensity}`);
    }
  }, [debugMode]);

  // Performance & Metrics
  const getMetrics = useCallback((): AnimationMetrics => {
    return timelineManagerRef.current.getMetrics();
  }, []);

  const startProfiling = useCallback((): void => {
    if (isProfilingRef.current) {
      log.warn('Profiling is already active');
      return;
    }
    
    isProfilingRef.current = true;
    
    if (debugMode) {
      log.debug('Started animation profiling');
    }
  }, [debugMode]);

  const stopProfiling = useCallback((): void => {
    if (!isProfilingRef.current) {
      log.warn('Profiling is not active');
      return;
    }
    
    isProfilingRef.current = false;
    
    if (debugMode) {
      log.debug('Stopped animation profiling');
    }
  }, [debugMode]);

  // Performance monitoring effect
  useEffect(() => {
    if (!enableProfiling) return;

    const updatePerformance = (): void => {
      const metrics = getMetrics();
      setPerformanceMetrics(metrics);
    };

    const interval = setInterval(updatePerformance, 1000); // Update every second
    
    return () => clearInterval(interval);
  }, [enableProfiling, getMetrics]);

  // Set performance mode on timeline manager
  useEffect(() => {
    timelineManagerRef.current.setPerformanceMode(performanceMode);
  }, [performanceMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Copy ref value to avoid stale closure
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const activeAnimations = activeAnimationsRef.current;
      
      // Kill all active animations
      activeAnimations.forEach((animation, id) => {
        try {
          animation.tween.kill();
        } catch (error) {
          log.error(`Error killing animation ${id} during cleanup:`, error as Error);
        }
      });
      
      activeAnimations.clear();
    };
  }, []);

  return {
    // Timeline Management
    createTimeline,
    getTimeline,
    killTimeline,
    pauseTimeline,
    resumeTimeline,
    
    // Animation Creation
    animate,
    animateSlideTransition,
    animateDisplacement,
    animateFilter,
    
    // Distortion Controls
    setImageDistortion,
    setTextDistortion,
    updateDistortionIntensity,
    
    // Performance & Metrics
    getMetrics,
    startProfiling,
    stopProfiling,
    
    // State
    isAnimating,
    activeTimelineCount,
    performance: performanceMetrics
  };
} 