/**
 * Storybook type definitions and interfaces
 */
import type { Meta as ComponentMeta, StoryObj } from '@storybook/react';

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
 */
export interface StoryArgs {
  [key: string]: any;
}

/**
 * Story context interface
 */
export interface StoryContext<T = any> {
  args: T;
  argTypes: Record<string, any>;
  parameters: Record<string, any>;
  globals: Record<string, any>;
  viewMode: 'story' | 'docs';
} 