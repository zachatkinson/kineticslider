[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [components/KineticSlider](../README.md) / KineticSlider

# Variable: KineticSlider

> `const` **KineticSlider**: `any`

Defined in: [components/KineticSlider.tsx:70](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/components/KineticSlider.tsx#L70)

A high-performance kinetic slider component with smooth animations and gesture support.

## Description

*

## Example

```tsx
<KineticSlider
  infinite
  enableGestures />
  onChange={(index) => console.log(`Active, slide: $){index}`)}
>
  <div>Slide 1</div>
  <div>Slide 2</div>
  <div>Slide 3</div>
</KineticSlider>
```

## Description

* - Uses GSAP for optimized animations
- Implements debounced resize handling
- Utilizes ResizeObserver for efficient layout updates
- Employs transform3d for hardware acceleration

## Description

* - Supports keyboard navigation (←/→ arrows)
- Maintains focus management within slides
- Implements ARIA attributes for slides and controls
- Provides live region updates for slide changes
- Supports screen reader announcements

## Description

* - Manages slide position and animation state
- Handles gesture interactions
- Controls keyboard navigation
- Manages lazy loading of slides

 onChange
- onSlideChange: Fired when active slide changes
- onAnimationComplete: Fired when slide transition completes
- onError: Fired when an error occurs

## Description

* - Supports custom classNames and styles
- Uses CSS transforms for smooth animations
- Implements responsive design patterns
- Handles touch and mouse interactions

## Description

* - Implements error boundaries for graceful failure
- Provides error reporting through onError callback
- Handles animation and gesture errors
- Manages state recovery after errors

## See

 - {@link: useKineticSlider} For the hook implementation
 - {@link: SlideContainer} For the slide container component
 - {@link: SlideControls} For the navigation controls component
