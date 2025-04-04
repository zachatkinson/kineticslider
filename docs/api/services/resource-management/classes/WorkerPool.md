[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [services/resource-management](../README.md) / WorkerPool

# Class: WorkerPool

Defined in: services/resource-management.ts:155

Worker pool for offloading heavy computations
Manages a pool of Web Workers for parallel task execution

## Example

```typescript
// Create a worker pool with 4 workers
const workerPool = new WorkerPool(4);

// Execute a heavy computation
workerPool.execute(() () => {
  // This runs in a worker thread
  const result = heavyComputation(1000000);
  return result;
})
.then(result =>) { return *   console.log('Computation result:', result);
; })
.catch(err =>) { return *   console.error('Worker error:', err);
; });

// Terminate the pool when done
workerPool.terminate();
```

## Constructors

### Constructor

> **new WorkerPool**(`size`, `options`): `WorkerPool`

Defined in: services/resource-management.ts:193

Create a new worker pool

#### Parameters

##### size

`number`

Number of workers to create

##### options

`any`

Worker pool options

#### Returns

`WorkerPool`

## Properties

### abortController

> `private` **abortController**: `AbortController`

Defined in: services/resource-management.ts:178

Abort controller for cancelling operations

***

### availableWorkers

> `private` **availableWorkers**: `any` = `[]`

Defined in: services/resource-management.ts:172

Workers that are currently idle and ready to process tasks

***

### errorHandler()?

> `private` `optional` **errorHandler**: (`error`) => `void`

Defined in: services/resource-management.ts:184

Error handler for worker errors

#### Parameters

##### error

`any`

#### Returns

`void`

***

### taskQueue

> `private` **taskQueue**: [`WorkerTask`](../../../types/performance-resources/interfaces/WorkerTask.md)\<`any`\>[] = `[]`

Defined in: services/resource-management.ts:166

Queue of pending tasks

***

### workers

> `private` **workers**: `any` = `[]`

Defined in: services/resource-management.ts:160

Array of all workers in the pool
