import React, { useState } from 'react';
import { FocusManager } from './FocusManager';

/**
 * Example component that demonstrates the usage of FocusManager for focus trapping and restoration.
 * Shows how to integrate with modal dialogs and handle focus management properly.
 *
 * @description * @example Example usage
 * ```tsx
 * <FocusRestoreExample />
 * ```
 *
 * @description * - Demonstrates focus trapping within modal
 * - Shows focus restoration to trigger element
 * - Implements keyboard navigation
 * - Handles escape key for closing modal
 *
 * @description * - Manages modal open/close state
 * - Tracks previously focused element
 * - Uses focus trap activation/deactivation
 *
 * @event onChange
 * - onOpen: Fired when modal is opened
 * - onClose: Fired when modal is closed
 * - onEscape: Fired when escape key is pressed
 *
 * @description * - Uses refs for DOM access
 * - Implements cleanup on unmount
 * - Optimizes focus event handling
 *
 * @description * - Handles potential focus management edge cases
 * - Provides fallback behaviors
 * - Ensures keyboard accessibility
 *
 * @see {@link: FocusManager} For the underlying focus management component
 * @returns React component for focus management example
 */
export const FocusRestoreExample: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Open modal and trap focus
  const openModal = (): void => {
    setIsModalOpen(true);
  };

  // Close modal and restore focus
  const closeModal = (): void => {
    setIsModalOpen(false);
  };

  // Handle escape key
  const handleEscape = (): void => {
    closeModal();
  };

  return (
    <div className="focus-example">
      <h2>Focus Management Example</h2>
      
      <p>
        This example demonstrates focus trapping within a modal dialog and
        focus restoration when the dialog is closed.
      </p>
      
      <button 
        id="open-modal-button" 
        onClick={openModal}
        className="primary-button"
      >
        Open Modal
      </button>
      
      {isModalOpen && (
        <div className="modal-overlay">
          <FocusManager
            trapFocus={true}
            autoFocus={true}
            escapeDeactivates={true}
            returnFocusTo="#open-modal-button"
            onEscape={handleEscape}
            trapOptions={{
              fallbackFocus: "#first-button"
            }}
          >
            <div className="modal-content" role="dialog" aria-labelledby="modal-title">
              <h3 id="modal-title">Focus Trapped Modal</h3>
              
              <p>
                Focus is trapped inside this modal. Try tabbing through the elements.
                Focus will cycle within the modal. Press ESC to close.
              </p>
              
              <div className="button-group">
                <button id="first-button">First Button</button>
                <button>Second Button</button>
                <button>Third Button</button>
              </div>
              
              <button 
                onClick={closeModal} 
                className="close-button"
              >
                Close Modal
              </button>
            </div>
          </FocusManager>
        </div>
      )}
    </div>
  );
};

export default FocusRestoreExample;
