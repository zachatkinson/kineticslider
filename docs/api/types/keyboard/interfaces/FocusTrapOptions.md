[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/keyboard](../README.md) / FocusTrapOptions

# Interface: FocusTrapOptions

Defined in: [types/keyboard.ts:31](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/keyboard.ts#L31)

Options for focus trap behavior

## Example

```ts
Example usage
```

## Properties

### active?

> `optional` **active**: `boolean`

Defined in: [types/keyboard.ts:37](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/keyboard.ts#L37)

Whether the focus trap is currently active

***

### autoFocus?

> `optional` **autoFocus**: `boolean`

Defined in: [types/keyboard.ts:39](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/keyboard.ts#L39)

Whether to automatically focus the first focusable element when activated

***

### escapeDeactivates?

> `optional` **escapeDeactivates**: `boolean`

Defined in: [types/keyboard.ts:35](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/keyboard.ts#L35)

Whether the Escape key should deactivate the focus trap

***

### fallbackFocus?

> `optional` **fallbackFocus**: `string` \| `HTMLElement` \| () => `null` \| `HTMLElement`

Defined in: [types/keyboard.ts:45](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/keyboard.ts#L45)

Element or selector to focus if no focusable elements are found

***

### initialFocus?

> `optional` **initialFocus**: `string` \| `HTMLElement` \| () => `null` \| `HTMLElement`

Defined in: [types/keyboard.ts:47](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/keyboard.ts#L47)

Element or selector to focus when trap is activated

***

### onActivate()?

> `optional` **onActivate**: () => `void`

Defined in: [types/keyboard.ts:41](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/keyboard.ts#L41)

Callback when focus trap is activated

#### Returns

`void`

***

### onDeactivate()?

> `optional` **onDeactivate**: () => `void`

Defined in: [types/keyboard.ts:43](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/keyboard.ts#L43)

Callback when focus trap is deactivated

#### Returns

`void`

***

### returnFocusOnDeactivate?

> `optional` **returnFocusOnDeactivate**: `boolean`

Defined in: [types/keyboard.ts:33](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/keyboard.ts#L33)

Whether to return focus to the previously focused element when deactivating
