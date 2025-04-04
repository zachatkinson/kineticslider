[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/performance-monitor](../README.md) / PerformanceMonitor

# Class: PerformanceMonitor

Defined in: [utils/performance-monitor.ts:41](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/performance-monitor.ts#L41)

Monitors performance metrics during application runtime.

The PerformanceMonitor class provides utilities for: tracking, analyzing, and reporting
various performance metrics including: FPS, memory: usage, and custom timing measurements.

## Example

```ts
// Create a new performance monitor
const monitor = new PerformanceMonitor({
  onUpdate: (metrics) () => {
    console.log('Updated metrics:', metrics);
  }
});

// Start monitoring FPS and memory usage
const stopFPS = monitor.trackFPS();
const stopMemory = monitor.trackMemory();

// Track custom metrics
monitor.track('renderTime', 12.5);

// Get a summary of collected metrics
const fpsSummary = monitor.getMetricSummary('fps');
console.log(`Average FPS: $){fpsSummary?.avg || 0}`);

// Later, clean up all resources
monitor.cleanup();

// Or stop individual tracking
stopFPS();
stopMemory();
```

## Constructors

### Constructor

> **new PerformanceMonitor**(`options`): `PerformanceMonitor`

Defined in: [utils/performance-monitor.ts:132](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/performance-monitor.ts#L132)

Creates a new performance monitor.

#### Parameters

##### options

`any`

Configuration options

#### Returns

`PerformanceMonitor`

## Properties

### abortController

> `private` **abortController**: `AbortController`

Defined in: [utils/performance-monitor.ts:112](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/performance-monitor.ts#L112)

Description

#### Description

* AbortController to cancel pending operations

***

### animFrameId?

> `private` `optional` **animFrameId**: `number`

Defined in: [utils/performance-monitor.ts:76](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/performance-monitor.ts#L76)

Description

#### Description

* Animation frame ID for FPS monitoring

***

### cleanupTasks

> **cleanupTasks**: `Set`\<() => `void`\>

Defined in: [utils/performance-monitor.ts:100](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/performance-monitor.ts#L100)

***

### frameCount

> `private` **frameCount**: `number` = `0`

Defined in: [utils/performance-monitor.ts:82](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/performance-monitor.ts#L82)

Description

#### Description

* Stores the count of frames for FPS calculation

***

### isFPSMonitoring

> `private` **isFPSMonitoring**: `boolean` = `false`

Defined in: [utils/performance-monitor.ts:58](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/performance-monitor.ts#L58)

Description

#### Description

* Flag to track if FPS monitoring is active

***

### isMemoryMonitoring

> `private` **isMemoryMonitoring**: `boolean` = `false`

Defined in: [utils/performance-monitor.ts:64](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/performance-monitor.ts#L64)

Description

#### Description

* Flag to track if memory monitoring is active

***

### lastFPSUpdateTime

> `private` **lastFPSUpdateTime**: `number` = `0`

Defined in: [utils/performance-monitor.ts:88](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/performance-monitor.ts#L88)

Description

#### Description

* Timestamp of last FPS measurement

***

### metrics

> `private` **metrics**: `Record`\<`string`, `any`\> = `{}`

Defined in: [utils/performance-monitor.ts:46](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/performance-monitor.ts#L46)

Description

#### Description

* Storage for collected metrics

***

### monitoringIntervalId?

> `private` `optional` **monitoringIntervalId**: `Timeout`

Defined in: [utils/performance-monitor.ts:70](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/performance-monitor.ts#L70)

Description

#### Description

* Interval ID for periodic monitoring

***

### observers

> `private` **observers**: `Set`\<`ResizeObserver` \| `IntersectionObserver`\>

Defined in: [utils/performance-monitor.ts:94](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/performance-monitor.ts#L94)

Description

#### Description

* Set of observers used for performance monitoring

***

### onUpdate()?

> `private` `optional` **onUpdate**: (`metrics`) => `void`

Defined in: [utils/performance-monitor.ts:52](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/performance-monitor.ts#L52)

Description

#### Parameters

##### metrics

`Record`\<`string`, `any`\>

#### Returns

`void`

#### Description

* Callback executed when metrics are updated

***

### private

> **private**: `any`

Defined in: [utils/performance-monitor.ts:100](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/performance-monitor.ts#L100)

Description

#### Description

* Set of cleanup functions to execute when monitoring ends

***

### resourcePools

> `private` **resourcePools**: `Map`\<[`ResourcePoolKey`](../../../types/performance-resources/type-aliases/ResourcePoolKey.md), [`ResourcePool`](../../../services/resource-management/classes/ResourcePool.md)\<`any`\>\>

Defined in: [utils/performance-monitor.ts:118](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/performance-monitor.ts#L118)

Description

#### Description

* Map of resource pools by type for efficient object reuse

***

### workerPool

> `private` **workerPool**: [`WorkerPool`](../../../services/resource-management/classes/WorkerPool.md)

Defined in: [utils/performance-monitor.ts:124](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/performance-monitor.ts#L124)

Description

#### Description

* Worker pool for offloading heavy computations

***

### workers

> `private` **workers**: `Set`\<[`WorkerPool`](../../../services/resource-management/classes/WorkerPool.md) \| `Worker`\>

Defined in: [utils/performance-monitor.ts:106](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/performance-monitor.ts#L106)

Description

#### Description

* Registry of all workers created by this instance
