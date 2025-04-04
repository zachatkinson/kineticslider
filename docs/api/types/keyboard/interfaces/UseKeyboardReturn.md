[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/keyboard](../README.md) / UseKeyboardReturn

# Interface: UseKeyboardReturn

Defined in: [types/keyboard.ts:84](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/keyboard.ts#L84)

Return type for useKeyboard hook

## Example

```ts
Example usage
```

## Properties

### isFocusTrapped

> **isFocusTrapped**: `boolean`

Defined in: [types/keyboard.ts:90](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/keyboard.ts#L90)

Whether focus is currently trapped

***

### releaseFocus()

> **releaseFocus**: () => `void`

Defined in: [types/keyboard.ts:88](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/keyboard.ts#L88)

Release focus trap

#### Returns

`void`

***

### trapFocus()

> **trapFocus**: (`container`, `options`?) => `void`

Defined in: [types/keyboard.ts:86](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/keyboard.ts#L86)

Trap focus within a container

#### Parameters

##### container

`null` | `HTMLElement`

##### options?

[`FocusTrapOptions`](FocusTrapOptions.md)

#### Returns

`void`
