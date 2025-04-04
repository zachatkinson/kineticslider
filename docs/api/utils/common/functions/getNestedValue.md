[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/common](../README.md) / getNestedValue

# Function: getNestedValue()

> **getNestedValue**\<`T`, `D`\>(`obj`, `path`, `defaultValue`?): `T` \| `D`

Defined in: [utils/common.ts:153](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/common.ts#L153)

Gets a value from a nested object safely without throwing errors

## Type Parameters

### T

`T`

### D

`D` = `undefined`

## Parameters

### obj

`any`

The object to get the value from

### path

`string`

The path to the value (e.g. 'user.address.city')

### defaultValue?

`D`

The default value to return if the path doesn't exist

## Returns

`T` \| `D`

The value at the path or the default value
