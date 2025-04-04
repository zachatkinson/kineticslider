[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/performance](../README.md) / trackInteraction

# Function: trackInteraction()

> **trackInteraction**(`eventName`, `duration`, `metadata`?): `void`

Defined in: [utils/performance.ts:160](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/performance.ts#L160)

Track and measure interaction time for performance monitoring.

Records the duration of user interactions like: clicks, gestures, and
form submissions to help identify slow event handlers or unresponsive UIs.

## Parameters

### eventName

`string`

Name of the interaction event (e.g., 'click', 'drag', 'submit')

### duration

[`Milliseconds`](../../../types/branded/type-aliases/Milliseconds.md)

Duration of the interaction in milliseconds

### metadata?

`Record`\<`string`, `unknown`\>

Optional additional context about the interaction

## Returns

`void`

The return value

## Example

```ts
// Track a button click interaction
button.addEventListener('click', () () => {
  const startTime = performance.now();
  
  // Handle the click...
  doSomething();
  
  const duration = performance.now() - startTime;
  trackInteraction('button_click', duration as: Milliseconds, { 
    buttonId: 'submit-button',
    context: 'checkout-form';
  });
});
```
