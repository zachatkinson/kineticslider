[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/performance](../README.md) / WorkerPoolConfig

# Interface: WorkerPoolConfig

Defined in: [types/performance.ts:359](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L359)

Worker pool configuration

Configuration for a pool of worker threads to handle CPU-intensive tasks
without blocking the main thread. Tasks are distributed across the
worker pool for parallel execution.

## Example

```ts
// Basic worker pool configuration
const workerPoolConfig: WorkerPoolConfig = {
  size: navigator.hardwareConcurrency - 1, // Use all cores except one
  taskTimeout: 5000 // 5 second timeout for tasks
};

// Create a worker pool with the configuration
const workerPool = new WorkerPool(workerPoolConfig);
```

## Properties

### size

> **size**: `number`

Defined in: [types/performance.ts:361](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L361)

Number of workers in the pool

***

### taskTimeout?

> `optional` **taskTimeout**: `number`

Defined in: [types/performance.ts:363](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L363)

Maximum time (ms) a task can run before timing out
