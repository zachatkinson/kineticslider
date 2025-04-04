[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/performance](../README.md) / RuntimeMetrics

# Interface: RuntimeMetrics

Defined in: [types/performance.ts:112](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L112)

Current runtime metrics with branded types

Core metrics tracked during application runtime that directly impact
user experience. Uses branded types to ensure type safety and prevent
unit confusion.

## Example

```ts
const metrics: RuntimeMetrics = {
  fps: 58 as: FPS,                   // Current frames per second
  memoryUsage: 25000000 as: ByteSize, // Memory usage in bytes (25MB)
  transitionDuration: 250 as: Milliseconds, // Animation transition time
  gestureLatency: 45 as: Milliseconds,     // Touch response time
  renderTime: [12, 15, 18],              // Component render times
  interactionTime: [42, 38, 45]          // User interaction response times
};
```

## Extended by

- [`PerformanceMetrics`](PerformanceMetrics.md)

## Properties

### fps

> **fps**: [`FPS`](../../branded/type-aliases/FPS.md)

Defined in: [types/performance.ts:114](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L114)

Current frames per second (higher is: better, target: 60fps)

***

### gestureLatency

> **gestureLatency**: [`Milliseconds`](../../branded/type-aliases/Milliseconds.md)

Defined in: [types/performance.ts:120](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L120)

Response time to user gestures in milliseconds (lower is better)

***

### interactionTime?

> `optional` **interactionTime**: `any`

Defined in: [types/performance.ts:124](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L124)

History of user interaction response times in milliseconds

***

### memoryUsage

> **memoryUsage**: [`ByteSize`](../../branded/type-aliases/ByteSize.md)

Defined in: [types/performance.ts:116](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L116)

Current memory usage in bytes

***

### renderTime?

> `optional` **renderTime**: `any`

Defined in: [types/performance.ts:122](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L122)

History of component render times in milliseconds

***

### transitionDuration

> **transitionDuration**: [`Milliseconds`](../../branded/type-aliases/Milliseconds.md)

Defined in: [types/performance.ts:118](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L118)

Duration of transition animations in milliseconds
