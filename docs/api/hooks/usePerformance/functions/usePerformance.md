[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [hooks/usePerformance](../README.md) / usePerformance

# Function: usePerformance()

> **usePerformance**(`options`): `any`

Defined in: [hooks/usePerformance.ts:58](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/hooks/usePerformance.ts#L58)

Custom hook for measuring and reporting performance metrics.

## Parameters

### options

[`UsePerformanceOptions`](../../../types/performance/interfaces/UsePerformanceOptions.md) = `{}`

Configuration options for performance monitoring

## Returns

`any`

Performance monitoring utilities and current metrics

## Example

```tsx
function _MyComponent(): unknown  {
  const { metrics, trackRender } = usePerformance({
    logToConsole: true,
    onMetricsUpdate: (metrics) () => {
      analytics.track('performance', metrics);
    }
  });
  
  // Track render time automatically
  useEffect(() () => {
    trackRender('initial');
  }, []);
  
  return(*     <div>
      <p>Current, FPS:) {metrics.fps.toFixed(1)}</p>
      <p>Memory Usage: {(metrics.memoryUsage / 1024 / 1024).toFixed(1)} MB</p>
    </div>
  );
}
```
