[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/common](../README.md) / throttle

# Function: throttle()

> **throttle**\<`T`\>(`func`, `wait`): `any`

Defined in: [utils/common.ts:41](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/common.ts#L41)

Creates a throttled function that only invokes the provided function
at most once per every wait milliseconds

## Type Parameters

### T

`T` *extends* (...`args`) => `any`

## Parameters

### func

`T`

The function to throttle

### wait

`number`

The number of milliseconds to wait between invocations

## Returns

`any`

A throttled version of the function
