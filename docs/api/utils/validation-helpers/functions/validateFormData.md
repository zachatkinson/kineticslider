[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/validation-helpers](../README.md) / validateFormData

# Function: validateFormData()

> **validateFormData**\<`T`\>(`formData`, `validationFn`, `setValidating`, `setValidationResult`): `Promise`\<`void`\>

Defined in: [utils/validation-helpers.ts:379](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/validation-helpers.ts#L379)

Validate form data with debounce handling

## Type Parameters

### T

`T`

## Parameters

### formData

`T`

Data to validate

### validationFn

(`data`) => `Promise`\<[`ValidationResult`](../../../types/validation/interfaces/ValidationResult.md)\>

Validation function

### setValidating

(`validating`) => `void`

Function to set validating state

### setValidationResult

(`result`) => `void`

Function to set validation result
 *

## Returns

`Promise`\<`void`\>

- The return value
