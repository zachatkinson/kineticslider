[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/validation](../README.md) / getErrorForField

# Function: getErrorForField()

> **getErrorForField**(`errors`, `fieldName`): `null` \| [`ValidationError`](../../../types/validation/interfaces/ValidationError.md)

Defined in: [utils/validation.ts:735](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/validation.ts#L735)

Gets an error for a specific field from a collection of validation errors

## Parameters

### errors

`any`

Array of validation errors

### fieldName

`string`

Name of the field to get errors for

## Returns

`null` \| [`ValidationError`](../../../types/validation/interfaces/ValidationError.md)

The first error for the field or null if no errors exist
