import { useCallback } from "react";
import { AnimationOptions, BasicAnimationReturn } from "../types/animation";
import { createBasicAnimation } from "../utils/animation";

export const useAnimation = (): BasicAnimationReturn => {
  const animate = useCallback((options: AnimationOptions) => {
    return createBasicAnimation(options);
  }, []);

  return { animate };
};
