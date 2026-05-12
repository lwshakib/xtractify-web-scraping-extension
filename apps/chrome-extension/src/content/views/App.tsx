/**
 * content/views/App.tsx
 *
 * This component provides an optional in-page UI for the content script.
 * Currently, it renders a small floating button in the bottom-right corner
 * of the page that toggles a simple "HELLO CRXJS" greeting.
 *
 * Future use cases: This could be expanded to show extraction status or
 * quick-access tools directly on the target website without opening the sidepanel.
 */

import Logo from "@/assets/crx.svg"
import { useState } from "react"
import "./App.css"

function App() {
  const [show, setShow] = useState(false)
  const toggle = () => setShow(!show)

  return (
    <div className="popup-container">
      {/* Container for the greeting message, shown only when 'show' is true */}
      {show && (
        <div className={`popup-content ${show ? "opacity-100" : "opacity-0"}`}>
          <h1>HELLO CRXJS</h1>
        </div>
      )}
      {/* Floating action button to toggle the UI */}
      <button className="toggle-button" onClick={toggle}>
        <img src={Logo} alt="CRXJS logo" className="button-icon" />
      </button>
    </div>
  )
}

export default App
