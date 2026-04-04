import { useState, useEffect } from 'react'
import './App.css'

interface Field {
  id: string
  name: string
  selector: string
  relativeSelector?: string
  childIndex?: number
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
  const [isSelectingParent, setIsSelectingParent] = useState(false)
  const [parentSelector, setParentSelector] = useState<string | null>(null)
  const [parentCount, setParentCount] = useState<number | null>(null)
  const [fields, setFields] = useState<Field[]>([])
  const [results, setResults] = useState<ExtractionResult[]>([])
  const [showExamples, setShowExamples] = useState(false)
  const [visibleCount, setVisibleCount] = useState(10)

  const generateFieldName = (selector: string, text: string): string => {
    const parts = selector.split(' > ')
    const lastPart = parts[parts.length - 1]
    const classMatch = lastPart.match(/\.([\w-]+)/)
    
    if (classMatch) {
      return classMatch[1]
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
    }

    const tagMatch = lastPart.match(/^(\w+)/)
    if (tagMatch && !['div', 'span', 'p'].includes(tagMatch[1])) {
      return tagMatch[1].charAt(0).toUpperCase() + tagMatch[1].slice(1)
    }

    const words = text.split(/\s+/).slice(0, 2).join(' ')
    return words || `Field ${fields.length + 1}`
  }

  useEffect(() => {
    const listener = (message: any) => {
      if (message.type === 'ELEMENT_SELECTED') {
        const { selector, relativeSelector, childIndex, text, matchCount } = message.payload
        
        const newField: Field = {
          id: crypto.randomUUID(),
          name: generateFieldName(selector, text),
          selector,
          relativeSelector,
          childIndex,
          preview: text,
          matchCount: matchCount || 0
        }
        setFields(prev => [...prev, newField])
      } else if (message.type === 'PARENT_SELECTED') {
        const { selector, matchCount } = message.payload
        setParentSelector(selector)
        setParentCount(matchCount)
        setIsSelectingParent(false)
      }
    }

    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [fields.length])

  const toggleSelection = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) return

      if (isSelecting) {
        await chrome.tabs.sendMessage(tab.id, { type: 'STOP_SELECTION' })
      } else {
        setIsSelectingParent(false) // Stop other modes
        await chrome.tabs.sendMessage(tab.id, { type: 'START_SELECTION', payload: { parentSelector } })
      }
      setIsSelecting(!isSelecting)
    } catch (err) {
      console.error('Xtractify: Connection failed', err)
      alert('Could not connect to the page. Please refresh the page being scraped and try again.')
      setIsSelecting(false)
    }
  }

  const toggleParentSelection = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) return

      if (isSelectingParent) {
        await chrome.tabs.sendMessage(tab.id, { type: 'STOP_SELECTION' })
      } else {
        setIsSelecting(false) // Stop other modes
        await chrome.tabs.sendMessage(tab.id, { type: 'START_PARENT_SELECTION' })
      }
      setIsSelectingParent(!isSelectingParent)
    } catch (err) {
      console.error('Xtractify: Connection failed', err)
      alert('Could not connect to the page. Please refresh the page being scraped and try again.')
      setIsSelectingParent(false)
    }
  }

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id))
  }

  const extractData = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) return

      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'EXTRACT_DATA',
        payload: { fields, parentSelector }
      })

      if (response?.results) {
        setResults(response.results)
        setShowExamples(false)
        setVisibleCount(10)
      }
    } catch (err) {
      console.error('Xtractify: Extraction failed', err)
      alert('Extraction failed. Please refresh the page and try again.')
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
      <main className="main">
        <section className="actions">
          <div className="action-grid">
            <button 
              className={`btn-primary ${isSelectingParent ? 'active' : ''}`}
              onClick={toggleParentSelection}
            >
              {isSelectingParent ? 'Stop Selecting Container' : 'Set Item Container'}
            </button>
            <button 
              className={`btn-primary ${isSelecting ? 'active' : ''}`}
              onClick={toggleSelection}
            >
              {isSelecting ? 'Stop Selecting Fields' : 'Select Fields'}
            </button>
          </div>
          
          {parentSelector && (
            <div className="parent-info-card">
              <div className="parent-meta-row">
                <span className="parent-label">Item Container:</span>
                {parentCount !== null && (
                  <span className="parent-count-badge">{parentCount} containers found</span>
                )}
              </div>
              <span className="parent-selector">{parentSelector}</span>
              <button className="btn-clear" onClick={() => {
                setParentSelector(null)
                setParentCount(null)
              }}>×</button>
            </div>
          )}
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
                      {field.matchCount} items
                    </span>
                    <span className="selector-text">{field.relativeSelector || field.selector}</span>
                  </div>
                  <span className="preview-text">Sample: "{field.preview}"</span>
                </div>
                <button className="btn-delete" onClick={() => removeField(field.id)}>×</button>
              </div>
            ))}
            {fields.length === 0 && (
              <div className="empty-state">Select item container first, then fields.</div>
            )}
          </div>
        </section>

        {fields.length > 0 && (
          <section className="extraction-section">
            <button className="btn-secondary" onClick={extractData}>
              Extract Data
            </button>

            {results.length > 0 && (
              <div className="results-container fade-in">
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
                    <div className="records-list fade-in">
                      {getDocuments().slice(0, visibleCount).map((doc, idx) => (
                        <div key={idx} className="record-card">
                          <div className="record-index">Record #{idx + 1}</div>
                          <div className="record-fields">
                            {results.map(r => (
                              <div key={r.id} className="record-field">
                                <span className="record-field-label">{r.name}</span>
                                <span className="record-field-value">{doc[r.name]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="table-footer">
                        <span>Showing {Math.min(visibleCount, totalRecords)} of {totalRecords} items</span>
                        {visibleCount < totalRecords && (
                          <button 
                            className="btn-load-more" 
                            onClick={() => setVisibleCount(prev => prev + 10)}
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
    </div>
  )
}
