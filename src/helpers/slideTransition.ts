import { Sprite, Container } from "pixi.js";
import { gsap } from "gsap";

/**
 * Performs a slide transition animation.
 *
 * @param slides - Array of image sprites.
 * @param textContainers - Array of text container sprites.
 * @param currentIndex - Index of the currently visible slide.
 * @param nextIndex - Index of the slide to transition to.
 * @param transitionScaleIntensity - Scaling intensity for the transition (percentage).
 * @returns The GSAP timeline for the transition.
 */
export function slideTransition(
    slides: Sprite[],
    textContainers: Container[],
    currentIndex: number,
    nextIndex: number,
    transitionScaleIntensity: number
) {
    const tl = gsap.timeline();
    const currentSlide = slides[currentIndex];
    const currentTextContainer = textContainers[currentIndex];
    const nextSlide = slides[nextIndex];
    const nextTextContainer = textContainers[nextIndex];

    // Ensure the next slide and text start hidden.
    nextSlide.alpha = 0;
    nextTextContainer.alpha = 0;

    // Retrieve the base scales stored on each sprite.
    const currentBaseScale = (currentSlide as any).baseScale;
    const nextBaseScale = (nextSlide as any).baseScale;

    tl.to(currentSlide.scale, {
        x: currentBaseScale * (1 + transitionScaleIntensity / 100),
        y: currentBaseScale * (1 + transitionScaleIntensity / 100),
        duration: 1,
        ease: "power2.out",
    }, 0)
        .set(nextSlide.scale, {
            x: nextBaseScale * (1 + transitionScaleIntensity / 100),
            y: nextBaseScale * (1 + transitionScaleIntensity / 100),
        }, 0)
        .to(nextSlide.scale, {
            x: nextBaseScale,
            y: nextBaseScale,
            duration: 1,
            ease: "power2.out",
        }, 0)
        .to([currentSlide, currentTextContainer], {
            alpha: 0,
            duration: 1,
            ease: "power2.out",
        }, 0)
        .to([nextSlide, nextTextContainer], {
            alpha: 1,
            duration: 1,
            ease: "power2.out",
        }, 0);

    return tl;
}

export default slideTransition;