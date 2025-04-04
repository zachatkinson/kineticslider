[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/validation-helpers](../README.md) / createDebouncedValidator

# Function: createDebouncedValidator()

> **createDebouncedValidator**\<`T`\>(`validateFn`, `debounceMs`): (`data`) => `void`

Defined in: [utils/validation-helpers.ts:413](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/validation-helpers.ts#L413)

Create a debounced validation function

## Type Parameters

### T

`T`

## Parameters

### validateFn

(`data`) => `Promise`\<`void`\>

Function to validate form data

### debounceMs

`number`

Debounce timeout in milliseconds

## Returns

`Function`

Debounced validation function

### Parameters

#### data

`T`

### Returns

`void`
