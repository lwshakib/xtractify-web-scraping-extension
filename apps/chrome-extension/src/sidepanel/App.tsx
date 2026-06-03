/**
 * sidepanel/App.tsx — Xtractify Side Panel (Main Application UI)
 *
 * Central control panel for the Xtractify scraping extension.
 * Renders in Chrome's Side Panel and orchestrates the scraping workflow:
 *
 * 1. SET ITEM CONTAINER — User picks a repeating element (e.g., product card).
 * 2. SELECT FIELDS — User clicks data points within a container (title, price, etc.).
 * 3. EXTRACT DATA — Scrapes all matching containers. Results shown in a table.
 * 4. EXPORT — Download as CSV or JSON.
 *
 * Communication with the content script (src/content/main.tsx) uses
 * Chrome's messaging API (ELEMENT_SELECTED, PARENT_SELECTED, EXTRACT_DATA, etc.).
 */

import { useState, useEffect } from "react"
import "./App.css"

// ─── Type Definitions ─────────────────────────────────────────────────────────

/** A single "column" in the scraping schema — one data point selected from the page. */
interface Field {
  id: string
  name: string
  selector: string
  relativeSelector?: string // Selector relative to parent container
  childIndex?: number // Ordinal index among same-selector siblings in parent
  preview: string
  matchCount: number
  elementType?: "image" | "link" | "text"
  extractMode?: "url" | "text" // What to extract: URL (href/src) or visible text
  previewUrl?: string
  previewText?: string
}

/** Extracted data for one field across all containers. values[i] = value in i-th row. */
interface ExtractionResult {
  id: string
  name: string
  values: string[]
}

export default function App() {
  // --- Selection State ---
  const [isSelecting, setIsSelecting] = useState(false)
  const [isSelectingParent, setIsSelectingParent] = useState(false)
  const [parentSelector, setParentSelector] = useState<string | null>(null)
  const [parentCount, setParentCount] = useState<number | null>(null)
  const [fields, setFields] = useState<Field[]>([])
  const [results, setResults] = useState<ExtractionResult[]>([])
  const [showExamples, setShowExamples] = useState(false)
  const [visibleCount, setVisibleCount] = useState(10)
  const [hoveredImage, setHoveredImage] = useState<{
    url: string
    x: number
    y: number
  } | null>(null)
  /** When true, duplicate rows are kept during multi-page extraction. */
  const [acceptDuplicates, setAcceptDuplicates] = useState(false)

  /**
   * Auto-generates a human-readable field name from the CSS selector or element text.
   * Strategy: class name → tag name → first two words of text → "Field N".
   */
  const generateFieldName = (selector: string, text: string): string => {
    const parts = selector.split(" > ")
    const lastPart = parts[parts.length - 1]
    const classMatch = lastPart.match(/\.([\w-]+)/)
    if (classMatch) {
      return classMatch[1]
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    }
    const tagMatch = lastPart.match(/^(\w+)/)
    if (tagMatch && !["div", "span", "p"].includes(tagMatch[1])) {
      return tagMatch[1].charAt(0).toUpperCase() + tagMatch[1].slice(1)
    }
    const words = text.split(/\s+/).slice(0, 2).join(" ")
    return words || `Field ${fields.length + 1}`
  }

  /**
   * Listens for ELEMENT_SELECTED and PARENT_SELECTED messages from the content script.
   * fields.length dep ensures generateFieldName always has the latest count.
   */
  useEffect(() => {
    const listener = (message: any) => {
      if (message.type === "ELEMENT_SELECTED") {
        const {
          selector,
          relativeSelector,
          childIndex,
          text,
          matchCount,
          elementType,
          previewUrl,
          previewText,
        } = message.payload
        const newField: Field = {
          id: crypto.randomUUID(),
          name: generateFieldName(selector, text),
          selector,
          relativeSelector,
          childIndex,
          preview: text,
          matchCount: matchCount || 0,
          elementType,
          extractMode: "text" as const,
          previewUrl,
          previewText,
        }
        setFields((prev) => [...prev, newField])
      } else if (message.type === "PARENT_SELECTED") {
        const { selector, matchCount } = message.payload
        setParentSelector(selector)
        setParentCount(matchCount)
        setIsSelectingParent(false)
      }
    }
    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [fields.length])

  /**
   * Sends a message to the content script in the active tab.
   * Strategy: PING to check if script is alive → inject if not → retry message.
   * Blocks restricted URLs (chrome://, edge://, etc.).
   */
  const sendMessageToTab = async (tabId: number, message: any) => {
    try {
      const tab = await chrome.tabs.get(tabId)
      if (!tab.url) throw new Error("No URL found")
      const restrictedPrefixes = [
        "chrome://",
        "chrome-extension://",
        "edge://",
        "about:",
        "https://chrome.google.com/webstore",
      ]
      if (restrictedPrefixes.some((prefix) => tab.url?.startsWith(prefix))) {
        throw new Error("RESTRICTED_URL")
      }
      try {
        const pingResponse = await chrome.tabs.sendMessage(tabId, {
          type: "PING",
        })
        if (pingResponse?.status === "PONG") {
          return await chrome.tabs.sendMessage(tabId, message)
        }
      } catch (e) {
        /* Ping failed — inject below */
      }
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["assets/main.tsx-CuUtcrbC.js"],
      })
      return await chrome.tabs.sendMessage(tabId, message)
    } catch (err: any) {
      if (err.message === "RESTRICTED_URL") {
        alert(
          "Browser security prevents scraping on this page (Settings, Extensions, or Web Store). Please try a different website."
        )
        throw err
      }
      throw err
    }
  }

  /** Toggles field selection mode. Mutual exclusion: stops parent selection. */
  const toggleSelection = async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      })
      if (!tab?.id) return
      if (isSelecting) {
        await sendMessageToTab(tab.id, { type: "STOP_SELECTION" })
      } else {
        setIsSelectingParent(false)
        await sendMessageToTab(tab.id, {
          type: "START_SELECTION",
          payload: { parentSelector },
        })
      }
      setIsSelecting(!isSelecting)
    } catch (err) {
      if ((err as Error).message === "RESTRICTED_URL") {
        setIsSelecting(false)
        return
      }
      console.error("Xtractify: Connection failed", err)
      alert(
        "Could not connect to the page. Please refresh the page being scraped and try again."
      )
      setIsSelecting(false)
    }
  }

  /** Toggles parent container selection mode. Mutual exclusion: stops field selection. */
  const toggleParentSelection = async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      })
      if (!tab?.id) return
      if (isSelectingParent) {
        await sendMessageToTab(tab.id, { type: "STOP_SELECTION" })
      } else {
        setIsSelecting(false)
        await sendMessageToTab(tab.id, { type: "START_PARENT_SELECTION" })
      }
      setIsSelectingParent(!isSelectingParent)
    } catch (err) {
      if ((err as Error).message === "RESTRICTED_URL") {
        setIsSelectingParent(false)
        return
      }
      console.error("Xtractify: Connection failed", err)
      alert(
        "Could not connect to the page. Please refresh the page being scraped and try again."
      )
      setIsSelectingParent(false)
    }
  }

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id))
  }

  /**
   * Triggers extraction. Supports multi-page accumulation with deduplication:
   * - First run: stores results directly.
   * - Subsequent runs: appends only unique rows (unless acceptDuplicates is true).
   * Deduplication uses JSON hash of each row's field values.
   */
  const extractData = async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      })
      if (!tab?.id) return
      const response = await sendMessageToTab(tab.id, {
        type: "EXTRACT_DATA",
        payload: { fields, parentSelector },
      })
      if (!response) {
        alert(
          "Could not communicate with the page. Please wait for it to load completely or refresh it."
        )
        return
      }
      if (response.results) {
        const newMaxLength = Math.max(
          0,
          ...response.results.map((r: any) => r.values?.length || 0)
        )
        if (newMaxLength === 0) {
          alert("Zero records found on this page matching your selections.")
          return
        }
        let addedCount = 0
        setResults((prev: ExtractionResult[]) => {
          if (prev.length === 0) {
            addedCount = newMaxLength
            return response.results
          }
          // Build hash set of existing rows for O(1) dedup lookup
          const maxLength = Math.max(...prev.map((r) => r.values.length))
          const existingHashes = new Set<string>()
          for (let i = 0; i < maxLength; i++) {
            existingHashes.add(
              JSON.stringify(prev.map((r) => r.values[i] || ""))
            )
          }
          const validIndices: number[] = []
          for (let i = 0; i < newMaxLength; i++) {
            if (acceptDuplicates) {
              validIndices.push(i)
            } else {
              const hash = JSON.stringify(
                prev.map((p) => {
                  const newRes = response.results.find(
                    (r: any) => r.id === p.id
                  )
                  return newRes ? newRes.values[i] || "" : ""
                })
              )
              if (!existingHashes.has(hash)) {
                validIndices.push(i)
                existingHashes.add(hash)
              }
            }
          }
          if (validIndices.length === 0) return prev
          addedCount = validIndices.length
          return prev.map((p) => {
            const newRes = response.results.find(
              (r: ExtractionResult) => r.id === p.id
            )
            if (newRes) {
              return {
                ...p,
                values: [
                  ...p.values,
                  ...validIndices.map((i) => newRes.values[i] ?? ""),
                ],
              }
            }
            return p
          })
        })
        if (addedCount > 0) setShowExamples(true)
      }
    } catch (err) {
      console.error("Xtractify: Extraction failed", err)
      alert("Extraction failed. Please refresh the page and try again.")
    }
  }

  /** Downloads results as CSV. Uses Blob + temporary <a> for client-side download. */
  const downloadCSV = () => {
    if (results.length === 0) return
    const maxLength = Math.max(...results.map((r) => r.values.length))
    const headers = results
      .map((r) => `"${r.name.replace(/"/g, '""')}"`)
      .join(",")
    const rows = []
    for (let i = 0; i < maxLength; i++) {
      rows.push(
        results
          .map((r) => `"${(r.values[i] || "").replace(/"/g, '""')}"`)
          .join(",")
      )
    }
    const blob = new Blob([[headers, ...rows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `xtractify_csv_data_${new Date().getTime()}.csv`
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /** Downloads results as JSON. Each object = one row, keyed by field name. */
  const downloadJSON = () => {
    if (results.length === 0) return
    const docs = getDocuments()
    const blob = new Blob([JSON.stringify(docs, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `xtractify_json_data_${new Date().getTime()}.json`
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /** Transforms column-oriented results into row-oriented documents for export/display. */
  const getDocuments = () => {
    if (results.length === 0) return []
    const maxLength = Math.max(...results.map((r) => r.values.length))
    const docs = []
    for (let i = 0; i < maxLength; i++) {
      const doc: Record<string, string> = {}
      results.forEach((r) => {
        doc[r.name] = r.values[i] || ""
      })
      docs.push(doc)
    }
    return docs
  }

  const totalRecords =
    results.length > 0 ? Math.max(...results.map((r) => r.values.length)) : 0

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="app-container">
      <main className="main">
        {/* === Action Buttons: Set Item Container & Select Fields === */}
        <section className="actions">
          <div className="action-grid">
            <button
              className={`btn-primary ${isSelectingParent ? "active" : ""}`}
              onClick={toggleParentSelection}
            >
              {isSelectingParent
                ? "Stop Selecting Container"
                : "Set Item Container"}
            </button>
            <button
              className={`btn-primary ${isSelecting ? "active" : ""}`}
              onClick={toggleSelection}
              disabled={!parentSelector}
              title={
                !parentSelector
                  ? "Set an Item Container first to select fields"
                  : ""
              }
            >
              {isSelecting ? "Stop Selecting Fields" : "Select Fields"}
            </button>
          </div>
          {/* Parent container info card */}
          {parentSelector && (
            <div className="parent-info-card">
              <div className="parent-meta-row">
                <span className="parent-label">Item Container:</span>
                {parentCount !== null && (
                  <span className="parent-count-badge">
                    {parentCount} containers found
                  </span>
                )}
              </div>
              <span className="parent-selector">{parentSelector}</span>
              <button
                className="btn-clear"
                onClick={() => {
                  setParentSelector(null)
                  setParentCount(null)
                  setFields([])
                }}
              >
                ×
              </button>
            </div>
          )}
        </section>

        {/* === Selected Fields List === */}
        <section className="fields-section">
          <h3>Selected Fields ({fields.length})</h3>
          <div className="fields-list">
            {fields.map((field) => (
              <div key={field.id} className="field-card">
                <div className="field-info">
                  <div className="field-header">
                    <input
                      type="text"
                      className="field-name-edit"
                      value={field.name}
                      onChange={(e) => {
                        setFields(
                          fields.map((f) =>
                            f.id === field.id
                              ? { ...f, name: e.target.value }
                              : f
                          )
                        )
                      }}
                    />
                    <div className="field-actions">
                      {/* Add companion field with opposite extract mode */}
                      {(field.elementType === "image" ||
                        field.elementType === "link") && (
                        <button
                          className="btn-icon"
                          title="Extract Other Mode"
                          onClick={() => {
                            const otherMode: "url" | "text" =
                              field.extractMode === "url" ? "text" : "url"
                            setFields((prev) => [
                              ...prev,
                              {
                                ...field,
                                id: crypto.randomUUID(),
                                name: `${field.name} ${otherMode === "url" ? "URL" : "Text"}`,
                                extractMode: otherMode,
                                preview:
                                  otherMode === "url"
                                    ? field.previewUrl || ""
                                    : field.previewText || "",
                              },
                            ])
                          }}
                        >
                          ⇋
                        </button>
                      )}
                      <button
                        className="btn-delete"
                        onClick={() => removeField(field.id)}
                        title="Delete Field"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="field-meta">
                    <span
                      className={`match-badge ${field.matchCount > 200 ? "warning" : ""}`}
                    >
                      {field.matchCount} matched
                    </span>
                    {(field.elementType === "image" ||
                      field.elementType === "link") && (
                      <div className="mode-toggle">
                        <button
                          className={`mode-btn ${field.extractMode === "text" ? "active" : ""}`}
                          onClick={() => {
                            setFields(
                              fields.map((f) =>
                                f.id === field.id
                                  ? { ...f, extractMode: "text" as const }
                                  : f
                              )
                            )
                          }}
                        >
                          Text
                        </button>
                        <button
                          className={`mode-btn ${field.extractMode === "url" ? "active" : ""}`}
                          onClick={() => {
                            setFields(
                              fields.map((f) =>
                                f.id === field.id
                                  ? { ...f, extractMode: "url" as const }
                                  : f
                              )
                            )
                          }}
                        >
                          URL
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="selector-text">
                    {field.relativeSelector || field.selector}
                  </span>
                  <p className="field-preview-value">
                    Sample:{" "}
                    <span>
                      {field.elementType === "image" ||
                      field.elementType === "link"
                        ? field.extractMode === "text"
                          ? field.previewText
                          : field.previewUrl
                        : field.preview}
                    </span>
                  </p>
                </div>
              </div>
            ))}
            {fields.length === 0 && (
              <div className="empty-state">
                Select item container first, then fields.
              </div>
            )}
          </div>
        </section>

        {/* === Extraction Controls & Results === */}
        {fields.length > 0 && (
          <section className="extraction-section">
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={acceptDuplicates}
                  onChange={(e) => setAcceptDuplicates(e.target.checked)}
                  style={{
                    accentColor: "var(--accent-color)",
                    width: "14px",
                    height: "14px",
                    cursor: "pointer",
                  }}
                />
                Accept duplicate data
              </label>
              <button className="btn-secondary" onClick={extractData}>
                Extract Data
              </button>
            </div>
            {/* Results dashboard with preview table */}
            {results.length > 0 && (
              <div className="results-container fade-in">
                <div className="results-header-summary">
                  <div className="summary-info">
                    <span className="summary-label">Extracted</span>
                    <span className="summary-value">
                      {totalRecords} records
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="btn-download-small"
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to clear all extracted data?"
                          )
                        )
                          setResults([])
                      }}
                      style={{
                        background: "var(--input-bg)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      Clear
                    </button>
                    <button
                      className="btn-download-small"
                      onClick={downloadCSV}
                    >
                      Download CSV
                    </button>
                    <button
                      className="btn-download-small"
                      onClick={downloadJSON}
                      style={{
                        background: "var(--text-primary)",
                        color: "var(--bg-color)",
                      }}
                    >
                      Download JSON
                    </button>
                  </div>
                </div>
                <div className="examples-accordion">
                  <button
                    className="btn-toggle-examples"
                    onClick={() => setShowExamples(!showExamples)}
                  >
                    {showExamples ? "Hide Examples ↑" : "See Examples ↓"}
                  </button>
                  {showExamples && (
                    <div className="table-container fade-in">
                      <table className="results-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            {results.map((r) => (
                              <th key={r.id}>{r.name}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {getDocuments()
                            .slice(0, visibleCount)
                            .map((doc, idx) => (
                              <tr key={idx}>
                                <td>{idx + 1}</td>
                                {results.map((r) => (
                                  <td
                                    key={r.id}
                                    onMouseEnter={(e) => {
                                      const val = doc[r.name]
                                      if (typeof val === "string") {
                                        try {
                                          const url = new URL(val)
                                          if (
                                            url.protocol === "http:" ||
                                            url.protocol === "https:" ||
                                            url.protocol === "data:"
                                          ) {
                                            const rect = (
                                              e.target as HTMLElement
                                            ).getBoundingClientRect()
                                            setHoveredImage({
                                              url: val,
                                              x: rect.left + rect.width / 2,
                                              y: rect.top,
                                            })
                                          }
                                        } catch {
                                          // Invalid URL, do nothing
                                        }
                                      }
                                    }}
                                    onMouseLeave={() => setHoveredImage(null)}
                                  >
                                    {doc[r.name]}
                                  </td>
                                ))}
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      <div className="table-footer">
                        <span>
                          Showing {Math.min(visibleCount, totalRecords)} of{" "}
                          {totalRecords} items
                        </span>
                        {visibleCount < totalRecords && (
                          <button
                            className="btn-load-more"
                            onClick={() => setVisibleCount((prev) => prev + 10)}
                          >
                            Load More
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Floating image preview tooltip — shown when hovering URL cells in the results table */}
      {hoveredImage && (
        <div
          style={{
            position: "fixed",
            left: hoveredImage.x,
            top: hoveredImage.y - 10,
            transform: "translate(-50%, -100%)",
            backgroundColor: "var(--card-bg)",
            padding: "4px",
            border: "1px solid var(--border-color)",
            borderRadius: "4px",
            zIndex: 9999,
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            pointerEvents: "none",
            maxWidth: "200px",
          }}
        >
          <img
            src={hoveredImage.url}
            alt="Preview"
            style={{
              maxWidth: "100%",
              height: "auto",
              display: "block",
              borderRadius: "2px",
              objectFit: "contain",
            }}
            onError={(e) => {
              const parent = e.currentTarget.parentElement
              if (parent) parent.style.display = "none"
            }}
          />
        </div>
      )}
    </div>
  )
}
