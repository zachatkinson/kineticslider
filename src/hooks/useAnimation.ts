import { gsap } from 'gsap';

import { useCallback } from 'react';

import { AnimationOptions, BasicAnimationReturn } from '@/types/animation';

export const useAnimation = (): BasicAnimationReturn => {
  const animate = useCallback((options: AnimationOptions) => {
    const animation = gsap.to(options.target, {
      x: 0,
      duration: options.config.duration,
      ease: options.config.ease,
      ...(options.onComplete && { onComplete: options.onComplete }),
    });

    return () => {
      animation.kill();
    };
  }, []);

  return { animate };
};
