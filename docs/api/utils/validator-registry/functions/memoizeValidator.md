[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/validator-registry](../README.md) / memoizeValidator

# Function: memoizeValidator()

> **memoizeValidator**\<`T`\>(`validator`, `keyGenerator`?): [`ValidationFunction`](../../../types/validation/type-aliases/ValidationFunction.md)\<`T`\>

Defined in: utils/validator-registry.ts:59

Creates a memoized version of a validator function

## Type Parameters

### T

`T`

## Parameters

### validator

[`ValidationFunction`](../../../types/validation/type-aliases/ValidationFunction.md)\<`T`\>

### keyGenerator?

[`KeyGenerator`](../../../types/validation/type-aliases/KeyGenerator.md)\<`T`\>

## Returns

[`ValidationFunction`](../../../types/validation/type-aliases/ValidationFunction.md)\<`T`\>

The return value
