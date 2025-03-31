import type { Meta as ComponentMeta, StoryObj } from '@storybook/react';

/**
 * Base Story type for all stories
 */
export type Story<T> = StoryObj<T>;

/**
 * Base Meta type for all stories
 */
export type Meta<T> = ComponentMeta<T>;

/**
 * Common story args interface
 */
export interface StoryArgs {
  [key: string]: any;
}

/**
 * Story context for template binding
 */
export interface StoryContext<T = any> {
  args: T;
  argTypes: Record<string, any>;
  parameters: Record<string, any>;
  globals: Record<string, any>;
  viewMode: 'story' | 'docs';
} 