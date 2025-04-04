[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [components/FocusManager](../README.md) / FocusManager

# Variable: FocusManager

> `const` **FocusManager**: `React.FC`\<[`FocusManagerProps`](../../../types/accessibility/interfaces/FocusManagerProps.md)\>

Defined in: [components/FocusManager.tsx:64](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/components/FocusManager.tsx#L64)

A component that manages focus within a: container, providing focus: trapping, auto-focus,
and keyboard navigation capabilities.

## Param

## Param

## Param

## Param

## Param

## Param

## Param

## Param

## Param

## Param

## Param

## Param

## Description

*

## Example

```tsx
<FocusManager
  trapFocus
  autoFocus
  escapeDeactivates />
  onEscape={() => setIsOpen(false)}
>
  <div role="dialog">
    <button>First focusable</button>
    <button>Second focusable</button>
  </div>
</FocusManager>
```

## Description

* - Traps keyboard focus within container
- Supports initial focus management
- Restores focus on unmount
- Handles keyboard navigation (Tab/Shift+Tab)
- Supports escape key for deactivation

## Description

* - Manages focus state within container
- Tracks previously focused element
- Handles focus trap activation/deactivation

 onChange
- onActivate: Fired when focus trap is activated
- onDeactivate: Fired when focus trap is deactivated
- onEscape: Fired when escape key is pressed

## Description

* - Uses refs for DOM access
- Implements cleanup on unmount
- Optimizes focus event handling

## Description

* - Handles missing focusable elements
- Manages focus restoration failures
- Provides fallback behaviors

## See

 - {@link: useKeyboard} For keyboard event handling
 - {@link: FocusTrapOptions} For configuration options
