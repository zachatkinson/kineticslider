[**KineticSlider Documentation v0.1.0**](../../../../README.md)

***

[KineticSlider Documentation](../../../../modules.md) / [components/pixi/PixiApp](../README.md) / PixiSlider

# Variable: PixiSlider

> `const` **PixiSlider**: `React.FC`\<[`PixiAppProps`](../../../../types/pixi/interfaces/PixiAppProps.md)\>

Defined in: [components/pixi/PixiApp.tsx:544](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/components/pixi/PixiApp.tsx#L544)

Error boundary wrapped PixiSlider component.
Provides error handling and recovery for the slider.

## Param

## Description

*

## Version

1.0.0

## Example

```tsx
<PixiSlider
  width={800}
  height={600}
  slides={slides}
  onSlideChange={handleSlideChange}
  onError={handleError} />
/>
```

## See

 - PixiSliderComponent - Core slider component
 - PixiErrorBoundary - Error handling wrapper
