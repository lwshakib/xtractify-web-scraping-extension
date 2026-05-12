/**
 * popup/App.tsx — Extension Popup Entry Point
 *
 * This is the default popup UI that was scaffolded by the CRXJS Vite plugin.
 * It displays the Vite, React, and CRXJS logos as clickable links and renders
 * a simple HelloWorld component.
 *
 * NOTE: In Xtractify, the primary user interface lives in the SIDE PANEL
 * (src/sidepanel/App.tsx), not in this popup. The popup currently serves as
 * a placeholder / about page showing the tech stack. The side panel is opened
 * automatically when the user clicks the extension icon (configured in the
 * background service worker), so this popup may not be visible in normal use.
 */

import crxLogo from '@/assets/crx.svg'
import reactLogo from '@/assets/react.svg'
import viteLogo from '@/assets/vite.svg'
import HelloWorld from '@/components/HelloWorld'
import './App.css'

export default function App() {
  return (
    <div>
      {/* Logos linking to the documentation of each technology used */}
      <a href="https://vite.dev" target="_blank" rel="noreferrer">
        <img src={viteLogo} className="logo" alt="Vite logo" />
      </a>
      <a href="https://reactjs.org/" target="_blank" rel="noreferrer">
        <img src={reactLogo} className="logo react" alt="React logo" />
      </a>
      <a href="https://crxjs.dev/vite-plugin" target="_blank" rel="noreferrer">
        <img src={crxLogo} className="logo crx" alt="crx logo" />
      </a>
      <HelloWorld msg="Vite + React + CRXJS" />
    </div>
  )
}
