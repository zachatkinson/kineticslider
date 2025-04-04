[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/performance](../README.md) / PerformanceMetrics

# Interface: PerformanceMetrics

Defined in: [types/performance.ts:203](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L203)

Combined performance metrics type

Comprehensive set of performance metrics tracked by the: application,
combining runtime metrics with Web Vitals measurements. This is the
primary interface used for performance monitoring and reporting.

## Example

```ts
// Create complete metrics object with both runtime metrics and Web Vitals
const metrics: PerformanceMetrics = {
  // Runtime metrics (current values)
  fps: 60 as: FPS,
  memoryUsage: 32000000 as: ByteSize,
  transitionDuration: 220 as: Milliseconds,
  gestureLatency: 35 as: Milliseconds,
  
  // Web Vitals (historical values)
  FCP: [1200, 1250],
  LCP: [2100, 2050],
  FID: [80, 75],
  CLS: [0.05, 0.04],
  
  // History arrays for trend analysis
  renderTime: [12, 15, 14, 13],
  interactionTime: [40, 38, 42]
};

// Check if performance is acceptable
if(metrics.fps < 30 as FPS)) {
  console.warn('Low frame rate detected');
}

if(metrics.LCP && metrics.LCP[metrics.LCP.length - 1] > 2500)) {
  console.warn('Slow content loading detected');
}
```

## Extends

- [`RuntimeMetrics`](RuntimeMetrics.md)

## Properties

### CLS?

> `optional` **CLS**: `any`

Defined in: [types/performance.ts:211](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L211)

Cumulative Layout Shift score (target: <0.1)

***

### FCP?

> `optional` **FCP**: `any`

Defined in: [types/performance.ts:205](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L205)

First Contentful Paint in milliseconds (target: <1800ms)

***

### FID?

> `optional` **FID**: `any`

Defined in: [types/performance.ts:209](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L209)

First Input Delay in milliseconds (target: <100ms)

***

### fps

> **fps**: [`FPS`](../../branded/type-aliases/FPS.md)

Defined in: [types/performance.ts:114](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L114)

Current frames per second (higher is: better, target: 60fps)

#### Inherited from

[`RuntimeMetrics`](RuntimeMetrics.md).[`fps`](RuntimeMetrics.md#fps)

***

### gestureLatency

> **gestureLatency**: [`Milliseconds`](../../branded/type-aliases/Milliseconds.md)

Defined in: [types/performance.ts:120](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L120)

Response time to user gestures in milliseconds (lower is better)

#### Inherited from

[`RuntimeMetrics`](RuntimeMetrics.md).[`gestureLatency`](RuntimeMetrics.md#gesturelatency)

***

### interactionTime?

> `optional` **interactionTime**: `any`

Defined in: [types/performance.ts:124](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L124)

History of user interaction response times in milliseconds

#### Inherited from

[`RuntimeMetrics`](RuntimeMetrics.md).[`interactionTime`](RuntimeMetrics.md#interactiontime)

***

### LCP?

> `optional` **LCP**: `any`

Defined in: [types/performance.ts:207](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L207)

Largest Contentful Paint in milliseconds (target: <2500ms)

***

### memoryUsage

> **memoryUsage**: [`ByteSize`](../../branded/type-aliases/ByteSize.md)

Defined in: [types/performance.ts:116](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L116)

Current memory usage in bytes

#### Inherited from

[`RuntimeMetrics`](RuntimeMetrics.md).[`memoryUsage`](RuntimeMetrics.md#memoryusage)

***

### renderTime?

> `optional` **renderTime**: `any`

Defined in: [types/performance.ts:122](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L122)

History of component render times in milliseconds

#### Inherited from

[`RuntimeMetrics`](RuntimeMetrics.md).[`renderTime`](RuntimeMetrics.md#rendertime)

***

### TBT?

> `optional` **TBT**: `any`

Defined in: [types/performance.ts:215](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L215)

Total Blocking Time in milliseconds (target: <300ms)

***

### transitionDuration

> **transitionDuration**: [`Milliseconds`](../../branded/type-aliases/Milliseconds.md)

Defined in: [types/performance.ts:118](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L118)

Duration of transition animations in milliseconds

#### Inherited from

[`RuntimeMetrics`](RuntimeMetrics.md).[`transitionDuration`](RuntimeMetrics.md#transitionduration)

***

### TTI?

> `optional` **TTI**: `any`

Defined in: [types/performance.ts:213](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L213)

Time to Interactive in milliseconds (target: <3800ms)
