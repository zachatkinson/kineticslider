[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [constants/validation](../README.md) / DEFAULT\_ERROR\_MESSAGES

# Variable: DEFAULT\_ERROR\_MESSAGES

> `const` **DEFAULT\_ERROR\_MESSAGES**: `object`

Defined in: [constants/validation.ts:61](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/constants/validation.ts#L61)

Default error messages for form validation.
Provides: consistent, user-friendly error messages across the application.

## Type declaration

### INVALID\_EMAIL

> **INVALID\_EMAIL**: `string` = `'Please enter a valid email address'`

### INVALID\_URL

> **INVALID\_URL**: `string` = `'Please enter a valid URL'`

### MAX\_LENGTH()

> **MAX\_LENGTH**: (`max`) => `string`

#### Parameters

##### max

`number`

#### Returns

`string`

### MIN\_LENGTH()

> **MIN\_LENGTH**: (`min`) => `string`

#### Parameters

##### min

`number`

#### Returns

`string`

### PATTERN\_MISMATCH

> **PATTERN\_MISMATCH**: `string` = `'The format is incorrect'`

### RANGE\_OVERFLOW()

> **RANGE\_OVERFLOW**: (`max`) => `string`

#### Parameters

##### max

`number`

#### Returns

`string`

### RANGE\_UNDERFLOW()

> **RANGE\_UNDERFLOW**: (`min`) => `string`

#### Parameters

##### min

`number`

#### Returns

`string`

### REQUIRED

> **REQUIRED**: `string` = `'This field is required'`

### TYPE\_MISMATCH

> **TYPE\_MISMATCH**: `string` = `'The value has an incorrect type'`

## Constant

## Example

```typescript
import { DEFAULT_ERROR_MESSAGES } from './validation';

const _errorMessage = field.required 
  ? DEFAULT_ERROR_MESSAGES.REQUIRED 
  : DEFAULT_ERROR_MESSAGES.MIN_LENGTH(5);
```

## Description

* - Messages are pre-defined to prevent XSS
- Safe string interpolation for dynamic values
