import logo from "@/../public/logo.svg"
import "./App.css"

export default function App() {
  return (
    <div className="popup-shell">
      <div className="brand-row">
        <img src={logo} className="brand-logo" alt="Xtractify logo" />
        <div>
          <p className="brand-title">Xtractify</p>
          <p className="brand-subtitle">Web scraping extension</p>
        </div>
      </div>

      <h1 className="heading">Theme follows device mode</h1>
      <p className="description">
        This popup and side panel automatically match your system light/dark
        theme and use the same Xtractify colors as the website.
      </p>

      <div className="status-chip">Ready to extract</div>
    </div>
  )
}
