[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/performance](../README.md) / PerformanceThresholds

# Interface: PerformanceThresholds

Defined in: [types/performance.ts:434](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L434)

Performance thresholds configuration

Defines acceptable ranges for each performance metric. Thresholds are used
to determine when performance is degraded and requires attention or
optimization.

## Example

```ts
// Define custom performance thresholds
const thresholds: PerformanceThresholds = {
  // Web Vitals thresholds
  FCP: 1800,      // First Contentful Paint (ms)
  LCP: 2500,      // Largest Contentful Paint (ms)
  FID: 100,       // First Input Delay (ms)
  CLS: 0.1,       // Cumulative Layout Shift (unitless)
  TTI: 3800,      // Time to Interactive (ms)
  TBT: 300,       // Total Blocking Time (ms)
  
  // Runtime thresholds
  fps: 30,                // Minimum acceptable FPS
  memoryUsage: 100000000, // 100MB maximum memory usage
  cpuUsage: 80,           // 80% maximum CPU usage
  renderTime: 50,         // 50ms maximum render time
  transitionTime: 300,    // 300ms maximum transition time
  
  // Additional thresholds
  resizeTime: 50,              // 50ms maximum resize time
  cleanupMemory: 1048576,      // 1MB maximum cleanup memory
  interactionTime: 100,        // 100ms maximum interaction time
  averageFrameTime: 16,        // 16ms max frame time (60fps)
  droppedFrames: 5,            // Max 5 dropped frames per second
  gestureProcessingTime: 50    // 50ms maximum gesture processing time
};
```

## Properties

### averageFrameTime

> `readonly` **averageFrameTime**: `number`

Defined in: [types/performance.ts:464](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L464)

Maximum acceptable average frame time in milliseconds

***

### cleanupMemory

> `readonly` **cleanupMemory**: `number`

Defined in: [types/performance.ts:460](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L460)

Maximum acceptable memory usage during cleanup in bytes

***

### CLS

> `readonly` **CLS**: `number`

Defined in: [types/performance.ts:442](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L442)

Cumulative Layout Shift threshold score (good: <0.1)

***

### cpuUsage

> `readonly` **cpuUsage**: `number`

Defined in: [types/performance.ts:452](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L452)

Maximum acceptable CPU usage percentage (0-100)

***

### droppedFrames

> `readonly` **droppedFrames**: `number`

Defined in: [types/performance.ts:466](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L466)

Maximum acceptable number of dropped frames per second

***

### FCP

> `readonly` **FCP**: `number`

Defined in: [types/performance.ts:436](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L436)

First Contentful Paint threshold in milliseconds (good: <1800ms)

***

### FID

> `readonly` **FID**: `number`

Defined in: [types/performance.ts:440](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L440)

First Input Delay threshold in milliseconds (good: <100ms)

***

### fps

> `readonly` **fps**: `number`

Defined in: [types/performance.ts:448](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L448)

Minimum acceptable frames per second (typically 30-60fps)

***

### gestureProcessingTime

> `readonly` **gestureProcessingTime**: `number`

Defined in: [types/performance.ts:468](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L468)

Maximum acceptable gesture processing time in milliseconds

***

### interactionTime

> `readonly` **interactionTime**: `number`

Defined in: [types/performance.ts:462](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L462)

Maximum acceptable user interaction response time in milliseconds

***

### LCP

> `readonly` **LCP**: `number`

Defined in: [types/performance.ts:438](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L438)

Largest Contentful Paint threshold in milliseconds (good: <2500ms)

***

### memoryUsage

> `readonly` **memoryUsage**: `number`

Defined in: [types/performance.ts:450](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L450)

Maximum acceptable memory usage in bytes

***

### renderTime

> `readonly` **renderTime**: `number`

Defined in: [types/performance.ts:454](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L454)

Maximum acceptable component render time in milliseconds

***

### resizeTime

> `readonly` **resizeTime**: `number`

Defined in: [types/performance.ts:458](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L458)

Maximum acceptable resize event handling time in milliseconds

***

### TBT

> `readonly` **TBT**: `number`

Defined in: [types/performance.ts:446](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L446)

Total Blocking Time threshold in milliseconds (good: <300ms)

***

### transitionTime

> `readonly` **transitionTime**: `number`

Defined in: [types/performance.ts:456](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L456)

Maximum acceptable transition animation time in milliseconds

***

### TTI

> `readonly` **TTI**: `number`

Defined in: [types/performance.ts:444](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L444)

Time to Interactive threshold in milliseconds (good: <3800ms)
