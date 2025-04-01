import type { Meta, Story } from '../../types/storybook';
import { KineticSlider } from '../KineticSlider';
import { createSlideId } from '../../__tests__/helpers/testHelpers';

const mockSlides = [
  {
    id: createSlideId('slide-1'),
    src: '/images/slide1.jpg',
    alt: 'First slide description',
  },
  {
    id: createSlideId('slide-2'),
    src: '/images/slide2.jpg',
    alt: 'Second slide description',
  },
  {
    id: createSlideId('slide-3'),
    src: '/images/slide3.jpg',
    alt: 'Third slide description',
  },
];

const meta = {
  title: 'Components/KineticSlider',
  component: KineticSlider,
  parameters: {
    layout: 'fullscreen',
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

export const Default: Story<typeof meta> = {
  args: {
    slides: mockSlides,
    initialSlideIndex: 0,
    enableKeyboardNavigation: true,
    enableInfiniteLoop: true,
  },
};

export const WithoutKeyboardNavigation: Story<typeof meta> = {
  args: {
    ...Default.args,
    enableKeyboardNavigation: false,
  },
};

export const WithoutInfiniteLoop: Story<typeof meta> = {
  args: {
    ...Default.args,
    enableInfiniteLoop: false,
  },
};

export const SingleSlide: Story<typeof meta> = {
  args: {
    ...Default.args,
    slides: [mockSlides[0]],
  },
}; 