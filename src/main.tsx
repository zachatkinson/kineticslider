import React from "react";
import ReactDOM from "react-dom/client";
import { log } from "./utils/logger";

import BasicExample from "./examples/BasicExample";
import "./index.css";

// Replace non-null assertion with a safer approach
const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BasicExample />
    </React.StrictMode>,
  );
} else {
  log.error("Root element not found - cannot initialize React application");
}
