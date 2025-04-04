[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/error-handling](../README.md) / handleAsyncError

# Function: handleAsyncError()

> **handleAsyncError**\<`T`\>(`operation`, `Promise`, ``, `T`): `any`

Defined in: [utils/error-handling.ts:125](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/error-handling.ts#L125)

Handles asynchronous operation errors with retry logic.

## Type Parameters

### T

`T`

## Parameters

### operation

() => `unknown`

The async operation to perform

### Promise

`any`

### 

`any`

### T

`any`

## Returns

`any`

The operation result or throws after retries

## Example

```ts
const result = await handleAsyncError(
  () => unknown fetchData(),
  3,
  1000
);
```

## Description

* - Implements retry logic
- Tracks retry attempts
- Supports delay between retries
- Reports final errors
