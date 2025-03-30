import React from 'react';
import ReactDOM from 'react-dom/client';

import BasicExample from './examples/BasicExample';
import './index.css';

// Replace non-null assertion with a safer approach
const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BasicExample />
    </React.StrictMode>
  );
} else {
  console.error('Root element not found');
}
