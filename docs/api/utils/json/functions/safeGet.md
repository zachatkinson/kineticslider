[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/json](../README.md) / safeGet

# Function: safeGet()

> **safeGet**\<`T`\>(`obj`, `path`, `defaultValue`): `T`

Defined in: [utils/json.ts:48](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/json.ts#L48)

Safely gets a nested property from an object using a path string

## Type Parameters

### T

`T`

## Parameters

### obj

`Record`\<`string`, `unknown`\>

The object to get the property from

### path

`string`

The path to the property (e.g. 'user.address.city')

### defaultValue

`T`

Optional default value if property doesn't exist

## Returns

`T`

The property value or default value
