/**
 * Storybook type definitions and interfaces
 */
import type { Meta as ComponentMeta, StoryObj } from "@storybook/react";

/**
 * Story type helper
 */
export type Story<T> = StoryObj<T>;

/**
 * Meta type helper
 */
export type Meta<T> = ComponentMeta<T>;

/**
 * Story arguments interface
 *
 * @example Example usage
 */
export interface StoryArgs {
  [key: string]: unknown;
}

/**
 * Story context interface
 *
 * @example Example usage
 */
export interface StoryContext<T = Record<string, unknown>> {
  args: T;
  argTypes: Record<string, unknown>;
  parameters: Record<string, unknown>;
  globals: Record<string, unknown>;
  viewMode: "story" | "docs";
}
