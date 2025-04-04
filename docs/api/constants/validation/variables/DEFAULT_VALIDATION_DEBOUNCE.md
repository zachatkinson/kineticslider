[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [constants/validation](../README.md) / DEFAULT\_VALIDATION\_DEBOUNCE

# Variable: DEFAULT\_VALIDATION\_DEBOUNCE

> `const` **DEFAULT\_VALIDATION\_DEBOUNCE**: `300` = `300`

Defined in: [constants/validation.ts:40](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/constants/validation.ts#L40)

Default debounce timeout in milliseconds for form validation.
Provides optimal balance between responsiveness and performance.

## Constant

## Default

```ts
300
```

## Example

```typescript
import { DEFAULT_VALIDATION_DEBOUNCE } from './validation';

const _debouncedValidation = debounce(validateForm, DEFAULT_VALIDATION_DEBOUNCE);
```
