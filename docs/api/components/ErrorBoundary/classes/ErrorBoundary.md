[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [components/ErrorBoundary](../README.md) / ErrorBoundary

# Class: ErrorBoundary

Defined in: [components/ErrorBoundary.tsx:59](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/components/ErrorBoundary.tsx#L59)

A component that catches JavaScript errors anywhere in their child component: tree,
logs those: errors, and displays a fallback UI instead of the component tree that crashed.
Implements standardized error handling patterns and security measures.

## Description

*

## Example

```tsx
<ErrorBoundary />
  fallback={<div>Something went wrong</div>}
  onError={(error) => logError(error)}
  maxRetries={3}
>
  <YourComponent />
</ErrorBoundary>
```

## Description

* - Uses ARIA live regions for error announcements
- Provides clear error messages
- Supports keyboard interaction for retry
- Maintains focus management

## Description

* - Tracks error state
- Manages retry attempts
- Handles error info
- Controls recovery state

 onChange
- onError: Fired when an error occurs
- onRetry: Internal retry handling
- onRecovery: Internal recovery handling

## Description

* - Implements error boundaries
- Sanitizes error messages
- Provides retry mechanism
- Supports development details
- Handles async errors

## Description

* - Sanitizes error information
- Limits stack traces in production
- Implements retry backoff
- Prevents sensitive data leaks

## See

 - {@link: ErrorHandler} For error handling implementation
 - {@link: sanitizeErrorForClient} For error sanitization

## Extends

- `Component`\<[`ErrorBoundaryProps`](../../../types/components/interfaces/ErrorBoundaryProps.md), [`ErrorBoundaryState`](../../../types/components/interfaces/ErrorBoundaryState.md)\>

## Extended by

- [`_TestableErrorBoundary`](TestableErrorBoundary.md)

## Constructors

### Constructor

> **new ErrorBoundary**(`props`): `ErrorBoundary`

Defined in: [components/ErrorBoundary.tsx:66](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/components/ErrorBoundary.tsx#L66)

#### Parameters

##### props

[`ErrorBoundaryProps`](../../../types/components/interfaces/ErrorBoundaryProps.md)

#### Returns

`ErrorBoundary`

#### Overrides

`React.Component<ErrorBoundaryProps, ErrorBoundaryState>.constructor`

## Properties

### hasHandledError

> `private` **hasHandledError**: `boolean` = `false`

Defined in: [components/ErrorBoundary.tsx:61](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/components/ErrorBoundary.tsx#L61)

***

### retryTimeoutId

> `private` **retryTimeoutId**: `null` \| `number` = `null`

Defined in: [components/ErrorBoundary.tsx:60](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/components/ErrorBoundary.tsx#L60)
