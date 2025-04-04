[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/errors](../README.md) / withRetry

# Function: withRetry()

> **withRetry**\<`T`\>(`operation`, `options`, `maxAttempts`?, `backoffMs`?, `timeout`?, `__namedParameters`?): `Promise`\<`T`\>

Defined in: [utils/errors.ts:193](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/errors.ts#L193)

Retry operation with exponential backoff

## Type Parameters

### T

`T`

## Parameters

### operation

() => `Promise`\<`T`\>

### options

### maxAttempts?

`number`

### backoffMs?

`number`

### timeout?

`number`

### \_\_namedParameters?

## Returns

`Promise`\<`T`\>

- The return value
