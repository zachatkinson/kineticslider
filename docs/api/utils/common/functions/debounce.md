[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/common](../README.md) / debounce

# Function: debounce()

> **debounce**\<`T`\>(`func`, `wait`): `any`

Defined in: [utils/common.ts:13](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/common.ts#L13)

Creates a debounced function that delays invoking the provided function
until after the specified wait time has elapsed since the last invocation

## Type Parameters

### T

`T` *extends* (...`args`) => `any`

## Parameters

### func

`T`

The function to debounce

### wait

`number`

The number of milliseconds to delay

## Returns

`any`

A debounced version of the function
