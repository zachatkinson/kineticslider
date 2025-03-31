import type { Meta, StoryObj } from '@storybook/react';
import { KineticSlider } from './KineticSlider';
import { createSlideId } from '../../__tests__/helpers/testHelpers';

const meta = {
  title: 'Components/KineticSlider',
  component: KineticSlider,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A modern, accessible slider component with kinetic scrolling and touch support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    slides: {
      control: 'object',
      description: 'Array of slides to display',
    },
    initialSlideIndex: {
      control: { type: 'number', min: 0 },
      description: 'Initial slide index to display',
    },
    enableKeyboardNavigation: {
      control: 'boolean',
      description: 'Enable keyboard navigation',
    },
    enableInfiniteLoop: {
      control: 'boolean',
      description: 'Enable infinite loop',
    },
    onSlideChange: {
      action: 'slideChanged',
      description: 'Callback when slide changes',
    },
  },
} satisfies Meta<typeof KineticSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockSlides = [
  {
    id: createSlideId('slide-1'),
    title: 'First Slide',
    image: '/images/slide1.jpg',
    alt: 'First slide description',
  },
  {
    id: createSlideId('slide-2'),
    title: 'Second Slide',
    image: '/images/slide2.jpg',
    alt: 'Second slide description',
  },
  {
    id: createSlideId('slide-3'),
    title: 'Third Slide',
    image: '/images/slide3.jpg',
    alt: 'Third slide description',
  },
];

export const Default: Story = {
  args: {
    slides: mockSlides,
    initialSlideIndex: 0,
    enableKeyboardNavigation: true,
    enableInfiniteLoop: true,
  },
};

export const WithoutKeyboardNavigation: Story = {
  args: {
    ...Default.args,
    enableKeyboardNavigation: false,
  },
};

export const WithoutInfiniteLoop: Story = {
  args: {
    ...Default.args,
    enableInfiniteLoop: false,
  },
};

export const SingleSlide: Story = {
  args: {
    ...Default.args,
    slides: [mockSlides[0]],
  },
}; 