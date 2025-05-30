/**
 * Common utility types
 */

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Required<T> = NonNullable<T>;
export type ReadOnly<T> = Readonly<T>;
export type DeepReadOnly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadOnly<T[P]> : T[P];
};

/**
 * Result type for operations that can fail
 *
 * @example Example usage
 */
export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

/**
 * Common application states and enums
 */
export type Status = "idle" | "loading" | "success" | "error";
export type Direction = "horizontal" | "vertical";
export type SlideTransition = "fade" | "slide" | "zoom" | "flip" | "custom";
export type AnimationEase =
  | "linear"
  | "ease"
  | "ease-in"
  | "ease-out"
  | "ease-in-out";
