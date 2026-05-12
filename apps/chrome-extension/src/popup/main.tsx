/**
 * popup/main.tsx
 *
 * Entry point for the Extension Popup.
 * This script initializes the React application within the popup context.
 */

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.tsx"
import "./index.css"

// Initialize the React root into the 'root' element defined in index.html
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
