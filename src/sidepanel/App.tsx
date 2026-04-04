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
  elementType?: 'image' | 'link' | 'text'
  extractMode?: 'url' | 'text'
  previewUrl?: string
  previewText?: string
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
  const [hoveredImage, setHoveredImage] = useState<{ url: string, x: number, y: number } | null>(null)
  const [acceptDuplicates, setAcceptDuplicates] = useState(false)

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
        const { selector, relativeSelector, childIndex, text, matchCount, elementType, previewUrl, previewText } = message.payload
        
        const newField: Field = {
          id: crypto.randomUUID(),
          name: generateFieldName(selector, text),
          selector,
          relativeSelector,
          childIndex,
          preview: text,
          matchCount: matchCount || 0,
          elementType,
          extractMode: elementType === 'text' ? 'text' : 'url',
          previewUrl,
          previewText
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

      if (!response) {
        alert('Could not communicate with the page. Please wait for it to load completely or refresh it.')
        return
      }

      if (response.results) {
        const newMaxLength = Math.max(0, ...response.results.map((r: any) => r.values?.length || 0))
        if (newMaxLength === 0) {
          alert('Zero records found on this page matching your selections.')
          return
        }

        let addedCount = 0

        setResults((prev: ExtractionResult[]) => {
          if (prev.length === 0) {
            addedCount = newMaxLength
            return response.results
          }
          
          const maxLength = Math.max(...prev.map(r => r.values.length))
          const existingHashes = new Set<string>()
          for (let i = 0; i < maxLength; i++) {
            const hash = JSON.stringify(prev.map(r => r.values[i] || ''))
            existingHashes.add(hash)
          }

          const validIndices: number[] = []
          for (let i = 0; i < newMaxLength; i++) {
            if (acceptDuplicates) {
              validIndices.push(i)
            } else {
              const valuesArr = prev.map(p => {
                const newRes = response.results.find((r: any) => r.id === p.id)
                return newRes ? (newRes.values[i] || '') : ''
              })
              const hash = JSON.stringify(valuesArr)
              if (!existingHashes.has(hash)) {
                validIndices.push(i)
                existingHashes.add(hash) // avoid duplicates within new batch as well
              }
            }
          }

          if (validIndices.length === 0) {
            return prev
          }

          addedCount = validIndices.length

          return prev.map(p => {
            const newRes = response.results.find((r: ExtractionResult) => r.id === p.id)
            if (newRes) {
              const filteredNewValues = validIndices.map(i => newRes.values[i] !== undefined ? newRes.values[i] : '')
              return {
                ...p,
                values: [...p.values, ...filteredNewValues]
              }
            }
            return p
          })
        })
        
        if (addedCount > 0) {
          setShowExamples(true)
        }
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
                    {(field.elementType === 'image' || field.elementType === 'link') && (
                      <select 
                        style={{ fontSize: '0.7rem', padding: '2px 4px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', outline: 'none' }}
                        value={field.extractMode} 
                        onChange={(e) => {
                          const val = e.target.value as 'url' | 'text';
                          const newFields = fields.map(f => f.id === field.id ? { ...f, extractMode: val } : f)
                          setFields(newFields)
                        }}
                      >
                        <option value="url">URL</option>
                        <option value="text">Text</option>
                      </select>
                    )}
                  </div>
                  <span className="preview-text">Sample: "{(field.elementType === 'image' || field.elementType === 'link') ? (field.extractMode === 'text' ? field.previewText : field.previewUrl) : field.preview}"</span>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={acceptDuplicates} 
                  onChange={(e) => setAcceptDuplicates(e.target.checked)} 
                  style={{ accentColor: 'var(--accent-color)', width: '14px', height: '14px', cursor: 'pointer' }}
                />
                Accept duplicate data
              </label>
              <button className="btn-secondary" onClick={extractData}>
                Extract Data
              </button>
            </div>

            {results.length > 0 && (
              <div className="results-container fade-in">
                <div className="results-header-summary">
                  <div className="summary-info">
                    <span className="summary-label">Extracted</span>
                    <span className="summary-value">{totalRecords} records</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-download-small" onClick={() => {
                      if (confirm('Are you sure you want to clear all extracted data?')) setResults([])
                    }} style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                      Clear
                    </button>
                    <button className="btn-download-small" onClick={downloadCSV}>
                      Download CSV
                    </button>
                  </div>
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
                              {results.map(r => (
                                <td 
                                  key={r.id}
                                  onMouseEnter={(e) => {
                                    const val = doc[r.name]
                                    if (typeof val === 'string' && (val.startsWith('http') || val.startsWith('data:image/'))) {
                                      const rect = (e.target as HTMLElement).getBoundingClientRect()
                                      setHoveredImage({ url: val, x: rect.left + rect.width / 2, y: rect.top })
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

      {hoveredImage && (
        <div style={{
          position: 'fixed',
          left: hoveredImage.x,
          top: hoveredImage.y - 10,
          transform: 'translate(-50%, -100%)',
          backgroundColor: 'var(--card-bg)',
          padding: '4px',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          zIndex: 9999,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          pointerEvents: 'none',
          maxWidth: '200px'
        }}>
          <img 
            src={hoveredImage.url} 
            alt="Preview"
            style={{ 
              maxWidth: '100%', 
              height: 'auto', 
              display: 'block', 
              borderRadius: '2px',
              objectFit: 'contain'
            }} 
            onError={(e) => {
              const parent = e.currentTarget.parentElement
              if (parent) parent.style.display = 'none'
            }}
          />
        </div>
      )}
    </div>
  )
}
