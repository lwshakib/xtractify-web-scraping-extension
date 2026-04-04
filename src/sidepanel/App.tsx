import { useState, useEffect } from 'react'
import './App.css'

interface Field {
  id: string
  name: string
  selector: string
  preview: string
  matchCount: number
}

interface ExtractionResult {
  id: string
  name: string
  values: string[]
}

export default function App() {
  const [isSelecting, setIsSelecting] = useState(false)
  const [fields, setFields] = useState<Field[]>([])
  const [results, setResults] = useState<ExtractionResult[]>([])
  const [showExamples, setShowExamples] = useState(false)
  const [visibleCount, setVisibleCount] = useState(10)

  const generateFieldName = (selector: string, text: string): string => {
    // Try to extract name from classes at the end of the selector
    const parts = selector.split(' > ')
    const lastPart = parts[parts.length - 1]
    const classMatch = lastPart.match(/\.([\w-]+)/)
    
    if (classMatch) {
      return classMatch[1]
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
    }

    // Fallback to tag name
    const tagMatch = lastPart.match(/^(\w+)/)
    if (tagMatch && !['div', 'span', 'p'].includes(tagMatch[1])) {
      return tagMatch[1].charAt(0).toUpperCase() + tagMatch[1].slice(1)
    }

    // Final fallback to text snippet
    const words = text.split(/\s+/).slice(0, 2).join(' ')
    return words || `Field ${fields.length + 1}`
  }

  useEffect(() => {
    const listener = (message: any) => {
      if (message.type === 'ELEMENT_SELECTED') {
        const { selector, text, matchCount } = message.payload
        const newField: Field = {
          id: crypto.randomUUID(),
          name: generateFieldName(selector, text),
          selector,
          preview: text,
          matchCount: matchCount || 0
        }
        setFields(prev => [...prev, newField])
      }
    }

    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [fields.length])

  const toggleSelection = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) return

    if (isSelecting) {
      await chrome.tabs.sendMessage(tab.id, { type: 'STOP_SELECTION' })
    } else {
      await chrome.tabs.sendMessage(tab.id, { type: 'START_SELECTION' })
    }
    setIsSelecting(!isSelecting)
  }

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id))
  }

  const extractData = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) return

    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'EXTRACT_DATA',
      payload: { fields }
    })

    if (response?.results) {
      setResults(response.results)
      setShowExamples(false)
      setVisibleCount(10)
    }
  }

  const downloadCSV = () => {
    if (results.length === 0) return

    const maxLength = Math.max(...results.map(r => r.values.length))
    const headers = results.map(r => `"${r.name.replace(/"/g, '""')}"`).join(',')
    const rows = []
    for (let i = 0; i < maxLength; i++) {
      const row = results.map(r => {
        const val = r.values[i] || ''
        return `"${val.replace(/"/g, '""')}"`
      }).join(',')
      rows.push(row)
    }

    const csvContent = [headers, ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `xtractify_data_${new Date().getTime()}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getDocuments = () => {
    if (results.length === 0) return []
    const maxLength = Math.max(...results.map(r => r.values.length))
    const docs = []
    
    for (let i = 0; i < maxLength; i++) {
      const doc: Record<string, string> = {}
      results.forEach(r => {
        doc[r.name] = r.values[i] || ''
      })
      docs.push(doc)
    }
    return docs
  }

  const totalRecords = results.length > 0 ? Math.max(...results.map(r => r.values.length)) : 0

  return (
    <div className="app-container">
      <header className="header">
        <h1>Xtractify</h1>
        <p>Bulk Smart Scraper</p>
      </header>

      <main className="main">
        <section className="actions">
          <button 
            className={`btn-primary ${isSelecting ? 'active' : ''}`}
            onClick={toggleSelection}
          >
            {isSelecting ? 'Stop Selecting' : 'Select Element'}
          </button>
        </section>

        <section className="fields-section">
          <h3>Selected Fields ({fields.length})</h3>
          <div className="fields-list">
            {fields.map(field => (
              <div key={field.id} className="field-card">
                <div className="field-info">
                  <input 
                    type="text" 
                    value={field.name}
                    onChange={(e) => {
                      const newFields = fields.map(f => f.id === field.id ? { ...f, name: e.target.value } : f)
                      setFields(newFields)
                    }}
                  />
                  <div className="field-meta">
                    <span className={`match-badge ${field.matchCount > 200 ? 'warning' : ''}`}>
                      {field.matchCount} matches
                      {field.matchCount > 200 && <span className="warning-icon" title="High match count - selection might be too broad">⚠️</span>}
                    </span>
                    <span className="selector-text">{field.selector}</span>
                  </div>
                  <span className="preview-text">Sample: "{field.preview}"</span>
                </div>
                <button className="btn-delete" onClick={() => removeField(field.id)}>×</button>
              </div>
            ))}
            {fields.length === 0 && (
              <div className="empty-state">No fields selected yet.</div>
            )}
          </div>
        </section>

        {fields.length > 0 && (
          <section className="extraction-section">
            <button className="btn-secondary" onClick={extractData}>
              Extract Data
            </button>

            {results.length > 0 && (
              <div className="results-container">
                <div className="results-header-summary">
                  <div className="summary-info">
                    <span className="summary-label">Extracted</span>
                    <span className="summary-value">{totalRecords} records</span>
                  </div>
                  <button className="btn-download-small" onClick={downloadCSV}>
                    Download CSV
                  </button>
                </div>

                <div className="examples-accordion">
                  <button 
                    className="btn-toggle-examples"
                    onClick={() => setShowExamples(!showExamples)}
                  >
                    {showExamples ? 'Hide Examples ↑' : 'See Examples ↓'}
                  </button>

                  {showExamples && (
                    <div className="table-container fade-in">
                      <table className="results-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            {results.map(r => <th key={r.id}>{r.name}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {getDocuments().slice(0, visibleCount).map((doc, idx) => (
                            <tr key={idx}>
                              <td>{idx + 1}</td>
                              {results.map(r => <td key={r.id}>{doc[r.name]}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="table-footer">
                        <span>Showing {Math.min(visibleCount, totalRecords)} of {totalRecords} items</span>
                        {visibleCount < totalRecords && (
                          <button 
                            className="btn-load-more" 
                            onClick={() => setVisibleCount(prev => prev + 10)}
                          >
                            Load More 10 +
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
    </div>
  )
}
