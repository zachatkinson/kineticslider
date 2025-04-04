[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/validation-helpers](../README.md) / validateAgainstSchemaField

# Function: validateAgainstSchemaField()

> **validateAgainstSchemaField**(`value`, `field`, `propertyPath`, `context`?): [`ValidationResult`](../../../types/validation/interfaces/ValidationResult.md) \| `Promise`\<[`ValidationResult`](../../../types/validation/interfaces/ValidationResult.md)\>

Defined in: [utils/validation-helpers.ts:206](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/validation-helpers.ts#L206)

Validates a value against a schema field definition

## Parameters

### value

`unknown`

Value to validate

### field

[`SchemaField`](../../../types/validation/interfaces/SchemaField.md)

Schema field definition

### propertyPath

`string`

### context?

[`ValidationContext`](../../../types/validation/interfaces/ValidationContext.md)

Validation context

## Returns

[`ValidationResult`](../../../types/validation/interfaces/ValidationResult.md) \| `Promise`\<[`ValidationResult`](../../../types/validation/interfaces/ValidationResult.md)\>

Validation result
