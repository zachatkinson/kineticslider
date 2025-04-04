[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/error-handling](../README.md) / withErrorHandling

# Function: withErrorHandling()

> **withErrorHandling**\<`T`, `any`\>(`fn`, `errorType`): `any`

Defined in: [utils/error-handling.ts:85](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/error-handling.ts#L85)

Wraps a function with error handling and analytics tracking.

## Type Parameters

### T

`T` *extends* (...`args`) => `unknown`

### any

`any`

## Parameters

### fn

`T`

The function to wrap

### errorType

[`ErrorType`](../../../types/error/enumerations/ErrorType.md)

The type of error to track

## Returns

`any`

A wrapped function with error handling

## Example

```ts
const _safeFunction = withErrorHandling(
  () => unknown riskyOperation(),
  ErrorType.OPERATION
);
```

## Description

* - Catches synchronous errors
- Tracks error metrics
- Preserves function context
- Maintains type safety
