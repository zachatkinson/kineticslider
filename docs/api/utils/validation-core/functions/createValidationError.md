[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/validation-core](../README.md) / \_createValidationError

# Function: \_createValidationError()

> **\_createValidationError**(`type`, `code`, `message`, `path`, `value`, `expected`): [`ValidationError`](../../../types/validation/interfaces/ValidationError.md)

Defined in: utils/validation-core.ts:69

Creates a validation error object

## Parameters

### type

[`ValidationErrorType`](../../../types/validation/enumerations/ValidationErrorType.md)

The type of validation error

### code

[`ValidationErrorCode`](../../../types/validation/enumerations/ValidationErrorCode.md)

The error code

### message

`string`

The error message

### path

`string`

The path to the invalid value

### value

`unknown`

The invalid value

### expected

`string`

The expected value or type

## Returns

[`ValidationError`](../../../types/validation/interfaces/ValidationError.md)

A validation error object
