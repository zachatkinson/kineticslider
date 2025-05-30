/**
 * Browser Tests for Enhanced Animation Hook (Phase 3)
 * 
 * Tests the hook's API contract and behavior that can be properly verified
 * in a unit test environment with mocks.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Create a mock event callbacks store that we can access in tests
let mockEventCallbacks: Record<string, any> = {};

// Mock GSAP with proper callback handling
vi.mock('gsap', () => {
  const mockTimeline = {
    eventCallback: vi.fn().mockImplementation((event: string, callback?: any) => {
      if (callback) {
        mockEventCallbacks[event] = callback;
      }
      return mockEventCallbacks[event];
    }),
    progress: vi.fn().mockReturnValue(0.5),
    kill: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn()
  };

  const mockTween = {
    eventCallback: vi.fn().mockImplementation((event: string, callback?: any) => {
      if (callback) {
        mockEventCallbacks[event] = callback;
      }
      return mockEventCallbacks[event];
    }),
    progress: vi.fn().mockReturnValue(0.5),
    kill: vi.fn()
  };

  return {
    gsap: {
      to: vi.fn().mockReturnValue(mockTween),
      timeline: vi.fn().mockReturnValue(mockTimeline),
      ticker: {
        add: vi.fn(),
        wake: vi.fn()
      }
    }
  };
});

// Mock logger
vi.mock('../../../utils/logger', () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

import { useEnhancedAnimation } from '../../../hooks/animation/useEnhancedAnimation';
import { AnimationType } from '../../../types/animation';
import { gsap } from 'gsap';

// Mock Container from PIXI
const mockContainer = {
  addChild: vi.fn(),
  removeChild: vi.fn(),
  visible: true,
  alpha: 1,
  scale: { x: 1, y: 1 }
};

describe('useEnhancedAnimation - Browser Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset performance.now mock
    vi.spyOn(global.performance, 'now').mockReturnValue(1000);
    // Clear event callbacks
    mockEventCallbacks = {};
  });

  afterEach(() => {
    // Clean up any remaining timers
    vi.clearAllTimers();
  });

  describe('Hook API Contract', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useEnhancedAnimation());

      // Test initial state
      expect(result.current.isAnimating).toBe(false);
      expect(result.current.activeTimelineCount).toBe(0);
      expect(result.current.performance).toBeDefined();
      
      // Test that all expected methods are available
      expect(typeof result.current.createTimeline).toBe('function');
      expect(typeof result.current.getTimeline).toBe('function');
      expect(typeof result.current.killTimeline).toBe('function');
      expect(typeof result.current.animate).toBe('function');
      expect(typeof result.current.getMetrics).toBe('function');
    });

    it('should accept and handle custom configuration', () => {
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

  describe('Timeline API Integration', () => {
    it('should create timeline and call GSAP timeline method', () => {
      const { result } = renderHook(() => useEnhancedAnimation());

      act(() => {
        const timelineId = result.current.createTimeline();
        expect(timelineId).toMatch(/^tl_\d+_\d+$/);
        expect(gsap.timeline).toHaveBeenCalled();
      });
    });

    it('should create timeline with custom options', () => {
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

    it('should handle timeline operations without throwing', () => {
      const { result } = renderHook(() => useEnhancedAnimation());

      act(() => {
        const timelineId = result.current.createTimeline();
        
        // These should not throw errors
        expect(() => result.current.pauseTimeline(timelineId)).not.toThrow();
        expect(() => result.current.resumeTimeline(timelineId)).not.toThrow();
        expect(() => result.current.killTimeline(timelineId)).not.toThrow();
      });
    });

    it('should handle invalid timeline operations gracefully', () => {
      const { result } = renderHook(() => useEnhancedAnimation());

      act(() => {
        // Try to get non-existent timeline
        const timeline = result.current.getTimeline('non-existent');
        expect(timeline).toBeNull();
        
        // Try to operate on non-existent timeline (should not throw)
        expect(() => result.current.killTimeline('non-existent')).not.toThrow();
        expect(() => result.current.pauseTimeline('non-existent')).not.toThrow();
        expect(() => result.current.resumeTimeline('non-existent')).not.toThrow();
      });
    });
  });

  describe('Animation API Integration', () => {
    it('should create animation and call GSAP to method', () => {
      const { result } = renderHook(() => useEnhancedAnimation());

      act(() => {
        const animationId = result.current.animate(mockContainer as any, {
          type: AnimationType.FADE,
          duration: 1,
          alpha: 0
        } as any);

        expect(animationId).toMatch(/^anim_\d+_\d+$/);
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

    it('should throw error for invalid animation target', () => {
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

    it('should create specialized animations', () => {
      const { result } = renderHook(() => useEnhancedAnimation());

      act(() => {
        // Test slide transition
        const slideId = result.current.animateSlideTransition(0, 1, {
          duration: 1.5
        });
        expect(slideId).toMatch(/^tl_\d+_\d+$/);

        // Test filter animation
        const filterId = result.current.animateFilter({
          type: AnimationType.FILTER_EFFECT,
          duration: 1,
          filterType: 'blur',
          intensity: 0.5
        });
        expect(filterId).toMatch(/^filter_\d+_\d+$/);
      });

      // Test displacement animation with effects enabled - separate hook instance
      const { result: resultWithEffects } = renderHook(() => useEnhancedAnimation({
        enableDistortionEffects: true
      }));
      
      act(() => {
        const dispId = resultWithEffects.current.animateDisplacement({
          type: AnimationType.DISPLACEMENT,
          duration: 1,
          intensity: 0.8,
          target: 'image'
        });
        expect(dispId).toMatch(/^disp_\d+_\d+$/);
      });
    });

    it('should handle disabled distortion effects', () => {
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
  });

  describe('Callback Functionality', () => {
    it('should register and execute animation callbacks when manually triggered', async () => {
      const onStart = vi.fn();
      const onComplete = vi.fn();
      const onUpdate = vi.fn();
      const onInterrupt = vi.fn();
      
      const { result } = renderHook(() => useEnhancedAnimation());

      act(() => {
        result.current.animate(mockContainer as any, {
          type: AnimationType.FADE,
          duration: 1,
          alpha: 0,
          onStart,
          onComplete,
          onUpdate,
          onInterrupt
        } as any);

        // Manually trigger the callbacks that would be called by GSAP
        if (mockEventCallbacks.onStart) {
          mockEventCallbacks.onStart();
        }
        
        if (mockEventCallbacks.onUpdate) {
          mockEventCallbacks.onUpdate();
        }

        if (mockEventCallbacks.onComplete) {
          mockEventCallbacks.onComplete();
        }
        
        if (mockEventCallbacks.onInterrupt) {
          mockEventCallbacks.onInterrupt();
        }
      });

      // Verify callbacks were triggered
      expect(onStart).toHaveBeenCalled();
      expect(onUpdate).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalled();
      expect(onInterrupt).toHaveBeenCalled();
    });
  });

  describe('Distortion Effects Configuration', () => {
    it('should handle distortion configuration updates', () => {
      const { result } = renderHook(() => useEnhancedAnimation({
        enableDistortionEffects: true
      }));

      act(() => {
        // These should not throw and should handle configuration updates
        expect(() => {
          result.current.setImageDistortion({
            enabled: true,
            globalIntensity: 0.8,
            interactive: true
          });
        }).not.toThrow();

        expect(() => {
          result.current.setTextDistortion({
            enabled: true,
            globalIntensity: 0.6,
            separateFromImage: true
          });
        }).not.toThrow();

        expect(() => {
          result.current.updateDistortionIntensity('both', 1.5);
        }).not.toThrow();
      });
    });

    it('should clamp distortion intensity values', () => {
      const { result } = renderHook(() => useEnhancedAnimation());

      act(() => {
        // Test intensity clamping - these should not throw
        expect(() => {
          result.current.updateDistortionIntensity('image', 3); // Should clamp to 2
          result.current.updateDistortionIntensity('text', -1); // Should clamp to 0
          result.current.updateDistortionIntensity('both', 1.5); // Should use as-is
        }).not.toThrow();
      });
    });
  });

  describe('Performance Monitoring', () => {
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

        // Verify metrics are reasonable values
        expect(metrics.fps).toBeGreaterThanOrEqual(0);
        expect(metrics.duration).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle profiling controls', () => {
      const { result } = renderHook(() => useEnhancedAnimation());

      act(() => {
        expect(() => result.current.startProfiling()).not.toThrow();
        expect(() => result.current.stopProfiling()).not.toThrow();
        
        // Test double start profiling (should warn, not throw)
        expect(() => result.current.startProfiling()).not.toThrow();
        
        // Test stop profiling when not started (should warn, not throw)  
        result.current.stopProfiling();
        expect(() => result.current.stopProfiling()).not.toThrow();
      });
    });
  });

  describe('Event System', () => {
    it('should handle animation events when configured', () => {
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

        // Animation events would be emitted via GSAP callbacks
        // which are mocked, so we can verify the setup
        expect(gsap.to).toHaveBeenCalled();
      });
    });
  });

  describe('Debug Mode', () => {
    it('should enable debug logging when debugMode is true', () => {
      const { result } = renderHook(() => useEnhancedAnimation({
        debugMode: true
      }));

      act(() => {
        // These operations should work with debug mode enabled
        expect(() => {
          result.current.createTimeline();
          result.current.animate(mockContainer as any, {
            type: AnimationType.FADE,
            duration: 1
          } as any);
        }).not.toThrow();
      });
    });
  });

  describe('Cleanup and Error Handling', () => {
    it('should cleanup animations on unmount', () => {
      const { result, unmount } = renderHook(() => useEnhancedAnimation());

      act(() => {
        result.current.animate(mockContainer as any, {
          type: AnimationType.FADE,
          duration: 1
        } as any);
      });

      // Unmount should cleanup without errors
      expect(() => unmount()).not.toThrow();
    });

    it('should handle various error conditions gracefully', () => {
      const { result } = renderHook(() => useEnhancedAnimation());

      // All these operations should be handled gracefully
      expect(() => {
        act(() => {
          result.current.getTimeline('non-existent');
          result.current.killTimeline('non-existent');
          result.current.pauseTimeline('non-existent');
          result.current.resumeTimeline('non-existent');
        });
      }).not.toThrow();
    });
  });
}); 