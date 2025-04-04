[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/performance](../README.md) / MetricsHistory

# Interface: MetricsHistory

Defined in: [types/performance.ts:144](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L144)

Additional performance metrics history

Detailed performance metrics captured over time for more comprehensive
analysis and monitoring. Each property contains an array of historical 
measurements for trend analysis.

## Example

```ts
const history: MetricsHistory = {
  cpuUsage: [25, 30, 28, 32],      // CPU usage percentage (0-100)
  resizeTime: [12, 15, 10],        // Resize event handling times in ms
  averageFrameTime: [16.5, 16.7],  // Average frame render time in ms
  droppedFrames: [0, 1, 0, 2]      // Count of dropped frames per second
};
```

## Properties

### averageFrameTime?

> `optional` **averageFrameTime**: `any`

Defined in: [types/performance.ts:154](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L154)

Average time to render a frame in milliseconds

***

### cleanupMemory?

> `optional` **cleanupMemory**: `any`

Defined in: [types/performance.ts:150](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L150)

Memory freed during cleanup operations in bytes

***

### cpuUsage?

> `optional` **cpuUsage**: `any`

Defined in: [types/performance.ts:146](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L146)

CPU usage percentage history (0-100)

***

### droppedFrames?

> `optional` **droppedFrames**: `any`

Defined in: [types/performance.ts:156](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L156)

Count of frames that failed to render in time

***

### gestureProcessingTime?

> `optional` **gestureProcessingTime**: `any`

Defined in: [types/performance.ts:158](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L158)

Time to process gesture events in milliseconds

***

### interactionTime?

> `optional` **interactionTime**: `any`

Defined in: [types/performance.ts:152](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L152)

Response times for user interactions in milliseconds

***

### renderTimeHistory?

> `optional` **renderTimeHistory**: `any`

Defined in: [types/performance.ts:160](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L160)

History of render times in milliseconds

***

### resizeTime?

> `optional` **resizeTime**: `any`

Defined in: [types/performance.ts:148](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L148)

Time taken to handle resize events in milliseconds

***

### transitionTimeHistory?

> `optional` **transitionTimeHistory**: `any`

Defined in: [types/performance.ts:162](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L162)

History of transition animation times in milliseconds
