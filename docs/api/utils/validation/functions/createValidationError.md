[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/validation](../README.md) / createValidationError

# Function: createValidationError()

> **createValidationError**(`type`, `message`, `property`?, `value`?, `expected`?, `severity`?, `suggestion`?, `locale`?): [`ValidationError`](../../../types/validation/interfaces/ValidationError.md)

Defined in: [utils/validation.ts:114](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/validation.ts#L114)

## Parameters

### type

[`ValidationErrorType`](../../../types/validation/enumerations/ValidationErrorType.md)

### message

`string`

### property?

`string`

### value?

`unknown`

### expected?

`unknown`

### severity?

[`ValidationErrorSeverity`](../../../types/error/enumerations/ValidationErrorSeverity.md) = `ValidationErrorSeverity.ERROR`

### suggestion?

`string`

### locale?

`string`

## Returns

[`ValidationError`](../../../types/validation/interfaces/ValidationError.md)

The return value
