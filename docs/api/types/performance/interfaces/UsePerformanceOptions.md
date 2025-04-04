[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/performance](../README.md) / UsePerformanceOptions

# Interface: UsePerformanceOptions

Defined in: [types/performance.ts:526](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L526)

Performance monitoring options

Configuration options for the usePerformance hook which controls
what metrics are tracked and how they're reported.

## Example

```tsx
// Example usage in a React component
function _Dashboard(): unknown  {
  const { metrics, trackRender, trackInteraction } = usePerformance({
    debug: process.env.NODE_ENV === 'development',
    logToConsole: true,
    trackMemory: true,
    includeWebVitals: true,
    updateInterval: 1000, />
    onMetricsUpdate: (metrics) () => {
      if(metrics.fps < 30)) {
        console.warn('Performance issue detected');
      }
    }
  });
  
  // Component implementation...
}
```

## Properties

### debug?

> `optional` **debug**: `boolean`

Defined in: [types/performance.ts:528](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L528)

Enable debug mode with verbose logging

***

### includeWebVitals?

> `optional` **includeWebVitals**: `boolean`

Defined in: [types/performance.ts:534](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L534)

Include Web Vitals metrics

***

### logToConsole?

> `optional` **logToConsole**: `boolean`

Defined in: [types/performance.ts:530](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L530)

Log performance metrics to console

***

### onMetricsUpdate()?

> `optional` **onMetricsUpdate**: (`metrics`) => `void`

Defined in: [types/performance.ts:538](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L538)

Callback for when metrics are updated

#### Parameters

##### metrics

`Partial`\<[`PerformanceMetrics`](PerformanceMetrics.md)\>

#### Returns

`void`

***

### trackMemory?

> `optional` **trackMemory**: `boolean`

Defined in: [types/performance.ts:532](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L532)

Track memory usage (if available in browser)

***

### updateInterval?

> `optional` **updateInterval**: `number`

Defined in: [types/performance.ts:536](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L536)

Interval (in ms) for updating metrics
