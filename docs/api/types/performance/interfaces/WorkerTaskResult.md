[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/performance](../README.md) / WorkerTaskResult

# Interface: WorkerTaskResult\<T\>

Defined in: [types/performance.ts:391](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L391)

Worker task result

Result of a task executed in a worker: thread, including either the
successful result or an error if the task failed.

## Example

```ts
// Example of handling a worker task result
function processImageInWorker(imageData: ImageData): Promise<WorkerTaskResult<Uint8Array>> {
  return workerPool.runTask('processImage', { data: imageData });
}

// Using the result
const result = await processImageInWorker(imageData);
if(result.error)) {
  console.error('Image processing failed:', result.error);
} else {
  const _processedData = result.result;
  // Use the processed data...
}
```

## Type Parameters

### T

`T`

The type of the result

## Properties

### error?

> `optional` **error**: `Error`

Defined in: [types/performance.ts:395](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L395)

Error if the task failed

***

### result?

> `optional` **result**: `T`

Defined in: [types/performance.ts:393](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L393)

The result of the task if successful
