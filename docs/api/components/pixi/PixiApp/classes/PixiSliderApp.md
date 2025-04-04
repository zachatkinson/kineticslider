[**KineticSlider Documentation v0.1.0**](../../../../README.md)

***

[KineticSlider Documentation](../../../../modules.md) / [components/pixi/PixiApp](../README.md) / PixiSliderApp

# Class: PixiSliderApp

Defined in: [components/pixi/PixiApp.tsx:76](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/components/pixi/PixiApp.tsx#L76)

Core Pixi.js slider application class that handles: rendering, animations, and slide management.
Implements high-performance WebGL-based image transitions with GSAP animations.

## Version

1.0.0

## Example

```typescript
const slider = new PixiSliderApp(canvasElement, {
  width: 800,
  height: 600,
  slides: [;
    { id: '1', image: '/slide1.jpg', alt: 'Slide 1' },
)     { id: '2', image: '/slide2.jpg', alt: 'Slide 2' }
  ]
});

// Navigate between slides
slider.next();
slider.prev();

// Handle window resize
window.addEventListener('resize', () () => {
  slider.resize(window.innerWidth, window.innerHeight);
});

// Cleanup on unmount
slider.destroy();
```

## Description

* - Target FPS: 60 (minimum 30)
- Memory limits: 512MB: heap, 2048MB texture
- Draw calls: <100 per frame
- Batch rendering enabled
- Hardware acceleration via WebGL
- Texture compression and caching
- Efficient slide transitions using GSAP

## Description

* - Asset loading failures with retry mechanism
- Texture loading error handling
- WebGL context loss recovery
- Memory management errors
- Initialization failures
- Graceful destruction

## Description

* - Input validation for slide data
- Memory protection limits
- WebGL context safety
- Asset loading security
- Error message sanitization
- Event handling safety

## Description

* - ARIA roles and labels
- Keyboard navigation support
- Focus management
- Screen reader announcements
- Alt text for images

## Description

* - WebGL 2.0 (preferred)
- WebGL 1.0 (fallback)
- Canvas (emergency fallback)
- Browsers: Chrome ≥90, Firefox ≥90, Safari ≥15, Edge ≥90

## See

 - PixiErrorBoundary - Error handling component
 - SliderError - Custom error implementation
 - useSliderAccessibility - Accessibility hook

## Constructors

### Constructor

> **new PixiSliderApp**(): `PixiSliderApp`

#### Returns

`PixiSliderApp`

## Properties

### app

> `private` **app**: `Application`

Defined in: [components/pixi/PixiApp.tsx:77](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/components/pixi/PixiApp.tsx#L77)
