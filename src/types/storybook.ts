/**
 * Storybook-related type definitions
 *
 * @module Storybook
 * @version 1.0.0
 */

import type { Meta as ComponentMeta, StoryObj } from "@storybook/react";
import type { KineticSlider } from "../components/KineticSlider/KineticSlider";

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

/**
 * Story type for KineticSlider component
 */
export type KineticSliderStory = StoryObj<typeof KineticSlider>;
