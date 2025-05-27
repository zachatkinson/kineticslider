import React from "react";

import { KineticSlider } from "../components/KineticSlider/KineticSlider";
import type { Slide } from "../types";
import { createSlideId } from "../utils/id-helpers";

const slides: Slide[] = [
  {
    id: createSlideId("slide-1"),
    title: "First Slide",
    description: "This is the first slide of the gallery",
    image: "/images/slide1.jpg",
    alt: "Description of the first slide",
  },
  {
    id: createSlideId("slide-2"),
    title: "Second Slide",
    description: "This is the second slide of the gallery",
    image: "/images/slide2.jpg",
    alt: "Description of the second slide",
  },
  {
    id: createSlideId("slide-3"),
    title: "Third Slide",
    description: "This is the third slide of the gallery",
    image: "/images/slide3.jpg",
    alt: "Description of the third slide",
  },
];

const BasicExample: React.FC = () => {
  const handleSlideChange = (index: number): void => {
    if (process.env["NODE_ENV"] !== "production") {
      document.dispatchEvent(
        new CustomEvent("slide-change", { detail: { index } }),
      );
    }
  };

  const handleAnimationComplete = (): void => {
    if (process.env["NODE_ENV"] !== "production") {
      document.dispatchEvent(new CustomEvent("animation-complete"));
    }
  };

  const props = {
    slides,
    onSlideChange: handleSlideChange,
    onAnimationComplete: handleAnimationComplete,
    initialIndex: 0,
    animationConfig: {
      duration: 0.5,
      ease: "power2.inOut",
    },
  };

  return <KineticSlider {...props} />;
};

export default BasicExample;
