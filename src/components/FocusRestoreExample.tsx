import React, { useState } from 'react';

import FocusManager from './FocusManager';

/**
 * Example component demonstrating focus management in a modal dialog
 */
export const FocusRestoreExample: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (): void => setIsModalOpen(true);
  const closeModal = (): void => setIsModalOpen(false);

  return (
    <div className="focus-example">
      <h2>Focus Management Example</h2>
      <p>
        This example demonstrates how to manage focus in a modal dialog using
        the FocusManager component. When you open the modal, focus will be
        trapped within it, and when you close it, focus will be restored to the
        button that opened it.
      </p>

      <button id="open-modal-button" onClick={openModal} aria-haspopup="dialog">
        Open Modal
      </button>

      {isModalOpen && (
        <div className="modal-backdrop">
          <FocusManager
            trapFocus={true}
            autoFocus={true}
            escapeDeactivates={true}
            initialFocus="#first-button"
            restoreFocus={true}
            returnFocusTo="#open-modal-button"
            onEscape={closeModal}
          >
            <div className="modal" role="dialog" aria-labelledby="modal-title">
              <div className="modal-content">
                <h3 id="modal-title">Focus Trapped Modal</h3>
                <p>
                  Focus is now trapped inside this modal dialog. You can tab
                  through the focusable elements, but you cannot tab out of the
                  modal. Press ESC to close the modal and restore focus to the
                  button that opened it.
                </p>

                <div className="button-group">
                  <button id="first-button">First Button</button>
                  <button>Middle Button</button>
                  <button>Last Button</button>
                </div>

                <form>
                  <div className="form-field">
                    <label htmlFor="name">Name:</label>
                    <input type="text" id="name" />
                  </div>

                  <div className="form-field">
                    <label htmlFor="email">Email:</label>
                    <input type="email" id="email" />
                  </div>
                </form>

                <button onClick={closeModal}>Close Modal</button>
              </div>
            </div>
          </FocusManager>
        </div>
      )}

      <div className="other-content">
        <h3>Other Content</h3>
        <p>
          This content is outside the modal. When the modal is open, you should
          not be able to focus elements here.
        </p>
        <button>Outside Button 1</button>
        <button>Outside Button 2</button>
        <a href="https://example.com">Outside Link</a>
      </div>
    </div>
  );
};

export default FocusRestoreExample;
