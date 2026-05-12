/**
 * sidepanel/main.tsx
 *
 * Entry point for the Extension Sidepanel.
 * This script initializes the React application within the sidepanel context,
 * which is the primary UI for Xtractify.
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
