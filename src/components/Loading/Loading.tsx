import React from "react";

/**
 * Simple loading component with spinner and optional text
 *
 * @param root0
 *
 * @param root0.text
 *
 * @param root0.className
 *
 * @returns {JSX.Element} The Loading component
 *
 */
export const Loading: React.FC<{
  text?: string;
  className?: string;
}> = ({ text, className = "" }) => {
  return (
    <div className={`kinetic-slider-loading ${className}`}>
      <div
        className="kinetic-slider-loading-spinner"
        role="status"
        aria-busy="true"
      >
        <span className="sr-only">{text || "Loading..."}</span>
      </div>
      {text && <div className="kinetic-slider-loading-text">{text}</div>}
    </div>
  );
};
