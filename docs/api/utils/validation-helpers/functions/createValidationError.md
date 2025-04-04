[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/validation-helpers](../README.md) / createValidationError

# Function: createValidationError()

> **createValidationError**(`type`, `message`, `field`?, `details`?, `expected`?, `severity`?, `suggestion`?, `locale`?): [`ValidationError`](../../../types/validation/interfaces/ValidationError.md)

Defined in: [utils/validation-helpers.ts:29](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/validation-helpers.ts#L29)

Helper function to create a validation error with enhanced fields

## Parameters

### type

[`ValidationErrorType`](../../../types/validation/enumerations/ValidationErrorType.md)

### message

`string`

### field?

`string`

### details?

`Record`\<`string`, `unknown`\>

### expected?

`unknown`

### severity?

[`ValidationErrorSeverity`](../../../types/error/enumerations/ValidationErrorSeverity.md)

### suggestion?

`string`

### locale?

`string`

*

## Returns

[`ValidationError`](../../../types/validation/interfaces/ValidationError.md)

- The return value
