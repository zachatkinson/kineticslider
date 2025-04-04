[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/performance](../README.md) / measurePerformance

# Function: measurePerformance()

> **measurePerformance**\<`T`\>(`fn`, `name`): `any`

Defined in: [utils/performance.ts:44](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/performance.ts#L44)

Measures the execution time of a function

## Type Parameters

### T

`T` *extends* (...`args`) => `any`

## Parameters

### fn

`T`

The function to measure

### name

`string` = `'Function'`

Name to identify the measurement in logs

## Returns

`any`

A wrapped function that logs performance
