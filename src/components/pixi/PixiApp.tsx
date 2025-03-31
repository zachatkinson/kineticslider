import * as PIXI from 'pixi.js';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useSliderAccessibility } from '../../hooks/pixi/useSliderAccessibility';
import { PixiErrorBoundary } from './PixiErrorBoundary';
import type { PixiAppProps, PixiSlide } from '../../types/pixi';
import { SliderError } from '../../utils/errors';

export class PixiSliderApp {
  private app: PIXI.Application;
  private slides: Map<string, PixiSlide> = new Map();
  private currentIndex: number = 0;
  private isAnimating: boolean = false;
  private container: PIXI.Container;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly options: Omit<PixiAppProps, 'onSlideChange' | 'onError'> & {
      onSlideChange?: ((index: number) => void) | undefined;
    }
  ) {
    if (options.slides.length === 0) {
      throw new SliderError('At least one slide is required', 'INIT_ERROR');
    }

    // Initialize Pixi Application with WebGL
    this.app = new PIXI.Application({
      view: canvas,
      width: options.width,
      height: options.height,
      backgroundColor: 0x000000,
      resolution: window.devicePixelRatio || 1,
      antialias: true,
      autoDensity: true,
    });

    // Create main container
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);

    // Initialize
    this.init();
  }

  private async init() {
    try {
      await this.loadAssets();
      this.setupSlides();
      this.startRendering();
    } catch (error) {
      console.error('Failed to initialize slider:', error);
      throw new SliderError('Failed to initialize slider', 'INIT_ERROR');
    }
  }

  private async loadAssets() {
    const assets = this.options.slides.map(slide => ({
      name: slide.id,
      url: slide.image,
    }));

    try {
      await Promise.all(
        assets.map(async asset => {
          const texture = await PIXI.Assets.load(asset.url);
          if (!texture) {
            throw new SliderError(`Failed to load texture for slide: ${asset.name}`, 'TEXTURE_ERROR');
          }

          const container = new PIXI.Container();
          const sprite = new PIXI.Sprite(texture);

          // Center sprite
          sprite.anchor.set(0.5);
          sprite.position.set(this.options.width / 2, this.options.height / 2);

          // Scale to cover
          this.scaleToFit(sprite, this.options.width, this.options.height);

          container.addChild(sprite);
          this.container.addChild(container);

          this.slides.set(asset.name, {
            sprite,
            container,
            texture,
          });

          // Set initial visibility
          container.visible = false;
        })
      );

      const firstSlideId = this.options.slides[0]?.id;
      if (!firstSlideId) {
        throw new SliderError('No slides available', 'INIT_ERROR');
      }

      const firstSlide = this.slides.get(firstSlideId);
      if (!firstSlide?.container) {
        throw new SliderError('Failed to load first slide', 'INIT_ERROR');
      }

      firstSlide.container.visible = true;
      firstSlide.container.alpha = 1;
    } catch (error) {
      console.error('Failed to load assets:', error);
      throw new SliderError('Failed to load slider assets', 'INIT_ERROR');
    }
  }

  private scaleToFit(sprite: PIXI.Sprite, width: number, height: number) {
    if (!sprite.texture) {
      throw new SliderError('Sprite texture is undefined', 'SPRITE_ERROR');
    }
    const scale = Math.max(
      width / sprite.texture.width,
      height / sprite.texture.height
    );
    sprite.scale.set(scale);
  }

  private setupSlides() {
    // Set initial positions and states
    this.options.slides.forEach((slide, index) => {
      const pixiSlide = this.slides.get(slide.id);
      if (!pixiSlide || !pixiSlide.container) {
        throw new SliderError(`Failed to find slide with id: ${slide.id}`, 'INIT_ERROR');
      }
      pixiSlide.container.visible = index === 0;
      pixiSlide.container.alpha = index === 0 ? 1 : 0;
    });
  }

  public next() {
    if (this.isAnimating) return;
    const nextIndex = (this.currentIndex + 1) % this.options.slides.length;
    this.animateToSlide(nextIndex);
  }

  public prev() {
    if (this.isAnimating) return;
    const prevIndex =
      (this.currentIndex - 1 + this.options.slides.length) %
      this.options.slides.length;
    this.animateToSlide(prevIndex);
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  public getIsAnimating(): boolean {
    return this.isAnimating;
  }

  private animateToSlide(targetIndex: number) {
    if (this.isAnimating || targetIndex === this.currentIndex) return;

    const currentSlideId = this.options.slides[this.currentIndex]?.id;
    const nextSlideId = this.options.slides[targetIndex]?.id;

    if (!currentSlideId || !nextSlideId) {
      throw new SliderError('Invalid slide index', 'INIT_ERROR');
    }

    const currentSlide = this.slides.get(currentSlideId);
    const nextSlide = this.slides.get(nextSlideId);

    if (!currentSlide?.container || !nextSlide?.container) {
      throw new SliderError('Failed to find slides for animation', 'INIT_ERROR');
    }

    this.isAnimating = true;

    // Make next slide visible but transparent
    nextSlide.container.visible = true;
    nextSlide.container.alpha = 0;

    // Create GSAP timeline for smooth animation
    const timeline = gsap.timeline({
      onComplete: () => {
        this.isAnimating = false;
        currentSlide.container.visible = false;
        this.currentIndex = targetIndex;
        this.options.onSlideChange?.(targetIndex);
      },
    });

    // Fade out current slide and fade in next slide
    timeline
      .to(currentSlide.container, {
        alpha: 0,
        duration: 0.5,
        ease: 'power2.inOut',
      })
      .to(
        nextSlide.container,
        {
          alpha: 1,
          duration: 0.5,
          ease: 'power2.inOut',
        },
        '-=0.5'
      );
  }

  private startRendering() {
    this.app.ticker.add(() => {
      // Add any per-frame updates here if needed
    });
  }

  public destroy() {
    // Destroy textures and sprites
    this.slides.forEach(slide => {
      slide.sprite.destroy();
      slide.container.destroy();
      slide.texture.destroy();
    });

    // Clear the map
    this.slides.clear();

    // Destroy the Pixi application
    this.app.destroy(true);

    throw new SliderError('Failed to destroy application', 'DESTROY_ERROR');
  }

  public resize(width: number, height: number) {
    // Update renderer size
    this.app.renderer.resize(width, height);

    // Update all slides
    this.slides.forEach(slide => {
      slide.sprite.position.set(width / 2, height / 2);
      this.scaleToFit(slide.sprite, width, height);
    });
  }
}

// React component wrapper
const PixiSliderComponent: React.FC<PixiAppProps> = ({
  width,
  height,
  slides,
  onSlideChange,
  onError,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<PixiSliderApp | null>(null);

  // Initialize accessibility hook
  const { announceSlide } = useSliderAccessibility({
    totalSlides: slides.length,
    currentIndex: appRef.current?.getCurrentIndex() ?? 0,
    onNext: () => appRef.current?.next(),
    onPrev: () => appRef.current?.prev(),
    isAnimating: appRef.current?.getIsAnimating() ?? false,
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      // Initialize Pixi application
      appRef.current = new PixiSliderApp(canvasRef.current, {
        width,
        height,
        slides,
        onSlideChange: (index) => {
          onSlideChange?.(index);
          const currentSlide = slides[index];
          if (currentSlide) {
            announceSlide(`Showing slide ${index + 1} of ${slides.length}: ${currentSlide.alt}`);
          }
        },
      });
    } catch (error) {
      console.error('Failed to initialize PixiSlider:', error);
      if (error instanceof Error) {
        onError?.(error);
      }
    }

    // Cleanup
    return () => {
      appRef.current?.destroy();
      appRef.current = null;
    };
  }, [width, height, slides, onSlideChange, announceSlide, onError]);

  // Handle resize
  useEffect(() => {
    if (!appRef.current) return;
    appRef.current.resize(width, height);
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
      }}
      aria-label={`Image Slider with ${slides.length} slides`}
      role="img"
      tabIndex={0}
    />
  );
};

// Export wrapped component with error boundary
export const PixiSlider: React.FC<PixiAppProps> = (props) => (
  <PixiErrorBoundary
    onError={(error) => props.onError?.(error)}
  >
    <PixiSliderComponent {...props} />
  </PixiErrorBoundary>
); 