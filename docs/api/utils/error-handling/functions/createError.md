[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/error-handling](../README.md) / createError

# Function: createError()

> **createError**(`message`, `code`?, `context`?): [`ExtendedError`](../../../types/error/interfaces/ExtendedError.md)

Defined in: [utils/error-handling.ts:50](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/error-handling.ts#L50)

Creates a standardized error object with additional context.

## Parameters

### message

`string`

The error message

### code?

`string`

Optional error code

### context?

`Record`\<`string`, `unknown`\>

Additional error context

## Returns

[`ExtendedError`](../../../types/error/interfaces/ExtendedError.md)

A formatted error object

## Example

```ts
const error = createError(*   'Failed to load slide',
  'SLIDE_LOAD_ERROR',
)   { slideId: '123' }
);
```

## Description

* - Standardizes error format
- Adds debugging context
- Supports error codes
- Preserves stack traces
