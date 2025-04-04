[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/validation-core](../README.md) / safeGet

# Function: safeGet()

> **safeGet**\<`T`\>(`obj`, `key`, `defaultValue`): `any`

Defined in: utils/validation-core.ts:32

Helper function to safely get a value from an object

## Type Parameters

### T

`T`

## Parameters

### obj

The object to get the value from

`undefined` | `null` | `Record`\<`string`, `unknown`\>

### key

`string`

The key to get the value for

### defaultValue

`T`

The default value to return if the key doesn't exist

## Returns

`any`

The value from the object or the default value
