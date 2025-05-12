import type { Meta, StoryObj } from "@storybook/react";
import { KineticSlider } from "./KineticSlider";
import { createSlideId } from "../../utils/test-utils";
import type { Slide } from "@/types/slider";
import { createBrandedNumber } from "@/types/branded";
import type { SlideIndex } from "../../types/branded";

const _mockSlides: Slide[] = [
  {
    id: createSlideId("slide-1"),
    title: "Slide 1",
    image: "/images/slide1.jpg",
    alt: "First slide description",
  },
  {
    id: createSlideId("slide-2"),
    title: "Slide 2",
    image: "/images/slide2.jpg",
    alt: "Second slide description",
  },
  {
    id: createSlideId("slide-3"),
    title: "Slide 3",
    image: "/images/slide3.jpg",
    alt: "Third slide description",
  },
];

/**
 * KineticSlider component stories showcasing various configurations and states.
 */

const meta = {
  title: "Components/KineticSlider",
  component: KineticSlider,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "High-performance kinetic slider with touch and keyboard support.",
      },
    },
  },
  argTypes: {
    slides: {
      control: "object",
      description: "Array of slides to display",
    },
    initialSlide: {
      control: { type: "number", min: 0 },
      description: "Initial slide index",
    },
    enableKeyboard: {
      control: "boolean",
      description: "Enable keyboard navigation",
    },
    infiniteLoop: {
      control: "boolean",
      description: "Enable infinite loop",
    },
    onSlideChange: {
      action: "slideChanged",
      description: "Callback when slide changes",
    },
  },
} satisfies Meta<typeof KineticSlider>;

export default meta;
type Story = StoryObj<typeof KineticSlider>;

// Default story with minimum configuration
export const Default: Story = {
  args: {
    slides: [
      {
        id: createSlideId("1"),
        title: "Slide 1",
        image: "/images/slide1.jpg",
        alt: "Slide 1 description",
        content: <div>Slide 1</div>,
      },
      {
        id: createSlideId("2"),
        title: "Slide 2",
        image: "/images/slide2.jpg",
        alt: "Slide 2 description",
        content: <div>Slide 2</div>,
      },
      {
        id: createSlideId("3"),
        title: "Slide 3",
        image: "/images/slide3.jpg",
        alt: "Slide 3 description",
        content: <div>Slide 3</div>,
      },
    ],
  },
};

// Story with keyboard navigation enabled
export const WithKeyboardNavigation: Story = {
  args: {
    slides: Default.args?.slides,
    enableKeyboard: true,
  },
};

// Story with infinite loop enabled
export const WithInfiniteLoop: Story = {
  args: {
    slides: Default.args?.slides,
    infiniteLoop: true,
  },
};

// Story with custom initial slide
export const CustomInitialSlide: Story = {
  args: {
    slides: Default.args?.slides,
    initialSlide: createBrandedNumber(1, "SlideIndex") as SlideIndex,
  },
};
