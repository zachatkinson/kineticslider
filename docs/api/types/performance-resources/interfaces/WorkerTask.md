[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/performance-resources](../README.md) / WorkerTask

# Interface: WorkerTask\<T\>

Defined in: [types/performance-resources.ts:23](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-resources.ts#L23)

Represents a task in the worker pool queue
Contains the task function and resolve/reject callbacks for the Promise

## Example

```typescript
// Example of creating a worker task manually
const _workerTask: WorkerTask<number> = {
  task: () => unknown calculatePrimes(10000),
  resolve: (result) => unknown console.log(`Found $){result} primes`),
  reject: (_error) => unknown console._error('Calculation failed:', _error)
};
```

## Type Parameters

### T

`T`

The return type of the task function

## Properties

### reject()

> **reject**: (`_error`) => `unknown`

Defined in: [types/performance-resources.ts:38](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-resources.ts#L38)

Function to call when the task fails with an _error

#### Parameters

##### \_error

`any`

#### Returns

`unknown`

***

### resolve()

> **resolve**: (`_value`) => `unknown`

Defined in: [types/performance-resources.ts:33](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-resources.ts#L33)

Function to call when the task is completed successfully

#### Parameters

##### \_value

`T`

#### Returns

`unknown`

***

### T

> **T**: `any`

Defined in: [types/performance-resources.ts:23](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-resources.ts#L23)

***

### task()

> **task**: () => `unknown`

Defined in: [types/performance-resources.ts:28](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-resources.ts#L28)

The task function to be executed in a worker thread
Should be serializable to be sent to a Web Worker

#### Returns

`unknown`

***

### void

> **void**: `any`

Defined in: [types/performance-resources.ts:33](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-resources.ts#L33)
