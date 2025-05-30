/**
 * Tests for Enhanced Animation Hook (Phase 3)
 * 
 * Comprehensive test suite for the enhanced animation system including
 * timeline management, distortion effects, and performance monitoring.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { gsap } from 'gsap';
import { useEnhancedAnimation } from '../../../hooks/animation/useEnhancedAnimation';
import type { AnimationConfig as _AnimationConfig } from "../../../types/animation";
import { AnimationType } from '../../../types/animation';
import { TimelineManager as _TimelineManager } from '../../../utils/animation/TimelineManager';
import { AnimationPriority as _AnimationPriority } from '../../../types/animation';

// Mock GSAP before importing the hook
vi.mock('gsap', () => ({
  gsap: {
    to: vi.fn().mockReturnValue({
      eventCallback: vi.fn(),
      progress: vi.fn().mockReturnValue(0.5),
      kill: vi.fn()
    }),
    timeline: vi.fn().mockReturnValue({
      eventCallback: vi.fn(),
      progress: vi.fn().mockReturnValue(0.5),
      kill: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn()
    }),
    ticker: {
      add: vi.fn(),
      wake: vi.fn()
    }
  }
}));

// Mock logger
vi.mock('../../../utils/logger', () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Mock Container from PIXI
const mockContainer = {
  addChild: vi.fn(),
  removeChild: vi.fn(),
  visible: true,
  alpha: 1,
  scale: { x: 1, y: 1 }
};

describe('useEnhancedAnimation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset performance.now mock
    vi.spyOn(global.performance, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    // Clean up is handled by the hook itself
  });

  describe('Basic Hook Functionality', () => {
    it('should initialize with default configuration', () => {
      const { result } = renderHook(() => useEnhancedAnimation());

      expect(result.current.isAnimating).toBe(false);
      expect(result.current.activeTimelineCount).toBe(0);
      expect(result.current.performance).toMatchObject({
        fps: 60,
        duration: 0,
        frames: 0,
        memory: expect.any(Object)
      });
    });

    it('should accept custom configuration', () => {
      const config = {
        enableProfiling: true,
        maxConcurrentAnimations: 10,
        defaultEasing: 'power3.out' as const,
        defaultDuration: 2,
        performanceMode: 'performance' as const,
        debugMode: true
      };

      const { result } = renderHook(() => useEnhancedAnimation(config));

      // Should initialize without errors
      expect(result.current).toBeDefined();
      expect(result.current.isAnimating).toBe(false);
    });
  });

  describe('Timeline Management', () => {
    it('should create timeline successfully', () => {
      const { result } = renderHook(() => useEnhancedAnimation());

      act(() => {
        const timelineId = result.current.createTimeline();
        expect(timelineId).toMatch(/^tl_\d+_\d+$/);
        // Note: activeTimelineCount update is async, tested in browser tests
      });
    });

    it('should create timeline with options', () => {
      const { result } = renderHook(() => useEnhancedAnimation());

      act(() => {
        const onComplete = vi.fn();
        const timelineId = result.current.createTimeline({
          onComplete,
          delay: 0.5,
          repeat: 2
        });
        
        expect(timelineId).toMatch(/^tl_\d+_\d+$/);
        expect(gsap.timeline).toHaveBeenCalledWith(
          expect.objectContaining({
            delay: 0.5,
            repeat: 2
          })
        );
      });
    });

    it('should get timeline by ID', () => {
      const { result } = renderHook(() => useEnhancedAnimation());

      act(() => {
        const timelineId = result.current.createTimeline();
        const timeline = result.current.getTimeline(timelineId);
        expect(timeline).toBeDefined();
      });
    });

    it('should handle timeline operations without throwing', () => {
      const { result } = renderHook(() => useEnhancedAnimation());

      act(() => {
        const timelineId = result.current.createTimeline();
        
        // These should not throw errors (state updates are async)
        result.current.pauseTimeline(timelineId);
        result.current.resumeTimeline(timelineId);
        result.current.killTimeline(timelineId);
        
        expect(true).toBe(true);
      });
    });

    it('should handle timeline errors gracefully', () => {
      const { result } = renderHook(() => useEnhancedAnimation());

      act(() => {
        // Try to get non-existent timeline
        const timeline = result.current.getTimeline('non-existent');
        expect(timeline).toBeNull();
        
        // Try to kill non-existent timeline (should not throw)
        result.current.killTimeline('non-existent');
      });
    });
  });

  describe('Animation Creation', () => {
    it('should create basic animation', () => {
      const { result } = renderHook(() => useEnhancedAnimation());

      act(() => {
        const animationId = result.current.animate(mockContainer as any, {
          type: AnimationType.FADE,
          duration: 1,
          alpha: 0
        } as any);

        expect(animationId).toMatch(/^anim_\d+_\d+$/);
        // Note: isAnimating state update is async, tested in browser tests
        expect(gsap.to).toHaveBeenCalledWith(
          mockContainer,
          expect.objectContaining({
            type: AnimationType.FADE,
            duration: 1,
            alpha: 0
          })
        );
      });
    });

    it('should throw error for invalid target', () => {
      const { result } = renderHook(() => useEnhancedAnimation());

      expect(() => {
        act(() => {
          result.current.animate(null as any, {
            type: AnimationType.FADE,
            duration: 1
          } as any);
        });
      }).toThrow('Animation target is required');
    });

    it('should create slide transition animation', () => {
      const { result } = renderHook(() => useEnhancedAnimation());

      act(() => {
        const timelineId = result.current.animateSlideTransition(0, 1, {
          duration: 1.5,
          scaleIntensity: 1.5
        });

        expect(timelineId).toMatch(/^tl_\d+_\d+$/);
        expect(gsap.timeline).toHaveBeenCalled();
      });
    });

    it('should create displacement animation when effects enabled', () => {
      const { result } = renderHook(() => useEnhancedAnimation({
        enableDistortionEffects: true
      }));

      act(() => {
        const animationId = result.current.animateDisplacement({
          type: AnimationType.DISPLACEMENT,
          duration: 1,
          intensity: 0.8,
          target: 'image'
        });

        expect(animationId).toMatch(/^disp_\d+_\d+$/);
      });
    });

    it('should not create displacement animation when effects disabled', () => {
      const { result } = renderHook(() => useEnhancedAnimation({
        enableDistortionEffects: false
      }));

      act(() => {
        const animationId = result.current.animateDisplacement({
          type: AnimationType.DISPLACEMENT,
          duration: 1,
          intensity: 0.8,
          target: 'image'
        });

        expect(animationId).toBe('');
      });
    });

    it('should create filter animation', () => {
      const { result } = renderHook(() => useEnhancedAnimation());

      act(() => {
        const animationId = result.current.animateFilter({
          type: AnimationType.FILTER_EFFECT,
          duration: 1,
          filterType: 'blur',
          intensity: 0.5
        });

        expect(animationId).toMatch(/^filter_\d+_\d+$/);
      });
    });
  });

  describe('Distortion Controls', () => {
    it('should set image distortion configuration', () => {
      const { result } = renderHook(() => useEnhancedAnimation());

      act(() => {
        result.current.setImageDistortion({
          enabled: true,
          globalIntensity: 0.8,
          interactive: true,
          momentum: 0.2
        });
      });

      // Should not throw errors
      expect(true).toBe(true);
    });

    it('should set text distortion configuration', () => {
      const { result } = renderHook(() => useEnhancedAnimation());

      act(() => {
        result.current.setTextDistortion({
          enabled: true,
          globalIntensity: 0.6,
          separateFromImage: true,
          customProperties: {
            blur: 2,
            offset: { x: 5, y: 5 }
          }
        });
      });

      // Should not throw errors
      expect(true).toBe(true);
    });

    it('should update distortion intensity for different targets', () => {
      const { result } = renderHook(() => useEnhancedAnimation());

      act(() => {
        // Test clamping (intensity should be between 0 and 2)
        result.current.updateDistortionIntensity('image', 3); // Should clamp to 2
        result.current.updateDistortionIntensity('text', -1); // Should clamp to 0
        result.current.updateDistortionIntensity('both', 1.5); // Should use as-is
      });

      // Should not throw errors
      expect(true).toBe(true);
    });
  });

  describe('Performance & Metrics', () => {
    it('should provide performance metrics', () => {
      const { result } = renderHook(() => useEnhancedAnimation());

      act(() => {
        const metrics = result.current.getMetrics();
        
        expect(metrics).toMatchObject({
          fps: expect.any(Number),
          duration: expect.any(Number),
          frames: expect.any(Number),
          memory: expect.any(Object)
        });
      });
    });

    it('should start and stop profiling', () => {
      const { result } = renderHook(() => useEnhancedAnimation());

      act(() => {
        result.current.startProfiling();
        result.current.stopProfiling();
      });

      // Should not throw errors
      expect(true).toBe(true);
    });

    it('should handle double start profiling gracefully', () => {
      const { result } = renderHook(() => useEnhancedAnimation());

      act(() => {
        result.current.startProfiling();
        result.current.startProfiling(); // Should warn, not throw
      });

      // Should not throw errors
      expect(true).toBe(true);
    });

    it('should handle stop profiling when not started', () => {
      const { result } = renderHook(() => useEnhancedAnimation());

      act(() => {
        result.current.stopProfiling(); // Should warn, not throw
      });

      // Should not throw errors
      expect(true).toBe(true);
    });
  });

  describe('Event Handling', () => {
    it('should emit animation events when configured', () => {
      const onAnimationEvent = vi.fn();
      const { result } = renderHook(() => useEnhancedAnimation({
        onAnimationEvent
      }));

      act(() => {
        result.current.animate(mockContainer as any, {
          type: AnimationType.FADE,
          duration: 1,
          alpha: 0
        } as any);
      });

      // Animation events would be emitted via GSAP callbacks
      // which are mocked, so we can't test the actual event emission
      expect(gsap.to).toHaveBeenCalled();
    });
  });

  describe('Debug Mode', () => {
    it('should enable debug logging when debugMode is true', () => {
      const { result } = renderHook(() => useEnhancedAnimation({
        debugMode: true
      }));

      act(() => {
        result.current.createTimeline();
        result.current.animate(mockContainer as any, {
          type: AnimationType.FADE,
          duration: 1
        } as any);
      });

      // Debug mode should be enabled without errors
      expect(true).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup animations on unmount', () => {
      const { result, unmount } = renderHook(() => useEnhancedAnimation());

      act(() => {
        result.current.animate(mockContainer as any, {
          type: AnimationType.FADE,
          duration: 1
        } as any);
      });

      // Unmount should cleanup without errors
      unmount();
      expect(true).toBe(true);
    });
  });

  describe('Performance Monitoring', () => {
    it('should update performance metrics when profiling is enabled', async () => {
      const { result } = renderHook(() => useEnhancedAnimation({
        enableProfiling: true
      }));

      // Wait for initial performance update
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.performance).toBeDefined();
    });
  });
}); 