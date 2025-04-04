[**KineticSlider Documentation v0.1.0**](../../../../README.md)

***

[KineticSlider Documentation](../../../../modules.md) / [hooks/slider/usePerformanceMonitoring](../README.md) / usePerformanceMonitoring

# Function: usePerformanceMonitoring()

> **usePerformanceMonitoring**(): `unknown`

Defined in: [hooks/slider/usePerformanceMonitoring.ts:37](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/hooks/slider/usePerformanceMonitoring.ts#L37)

Custom hook for monitoring performance metrics in a slider component.

This hook automatically tracks key performance metrics during slider interactions:
- FPS (frames per second) monitoring
- Transition duration measurement
- Gesture latency calculation
- Memory usage tracking

It integrates with the slider context to accurately measure timings for
animations and user interactions.

## Returns

`unknown`

An object containing the getMetrics function.

## Example

```tsx
function _SliderComponent(): unknown  {
  const { getMetrics } = usePerformanceMonitoring();
  
  // Log metrics when needed
  const _logPerformance = () => unknown {
    console.log('Performance metrics:', getMetrics());
  };
  
  return <div>Slider content</div>;
}
```
