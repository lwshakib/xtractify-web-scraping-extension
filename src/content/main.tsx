import { getGeneralSelector } from './utils/selector'

let isSelecting = false
let selectionMode: 'field' | 'parent' = 'field'
let activeParentSelector: string | null = null

const highlightStyle = document.createElement('style')
highlightStyle.textContent = `
  .xtractify-highlight {
    outline: 3px solid #10b981 !important;
    outline-offset: -3px !important;
    cursor: crosshair !important;
    transition: outline 0.1s ease !important;
  }
`
document.head.appendChild(highlightStyle)

let currentMatches: HTMLElement[] = []

function handleMouseOver(e: MouseEvent) {
  if (!isSelecting) return
  const target = e.target as HTMLElement
  
  currentMatches.forEach(el => el.classList.remove('xtractify-highlight'))
  
  const selector = getGeneralSelector(target)
  const matches = Array.from(document.querySelectorAll(selector)) as HTMLElement[]
  
  matches.slice(0, 200).forEach(el => el.classList.add('xtractify-highlight'))
  currentMatches = matches
}

function handleMouseOut(e: MouseEvent) {
  if (!isSelecting) return
  if (e.relatedTarget === null) {
     currentMatches.forEach(el => el.classList.remove('xtractify-highlight'))
     currentMatches = []
  }
}

function preventAll(e: Event) {
  if (!isSelecting) return
  e.preventDefault()
  e.stopPropagation()
  e.stopImmediatePropagation()
}

function getRelativeSelector(el: HTMLElement, parentSelector: string): string | undefined {
  const parent = el.closest(parentSelector)
  if (!parent) return undefined

  const tagName = el.tagName.toLowerCase()
  const classList = Array.from(el.classList).filter(c => c !== 'xtractify-highlight').map(c => `.${c}`).join('')
  
  return `${tagName}${classList}`
}

function extractElementValue(el: HTMLElement): string {
  if (el instanceof HTMLImageElement) {
    if (el.srcset) {
      const sources = el.srcset.split(',').map(s => s.trim().split(' '))
      const bestSource = sources.reduce((prev, curr) => {
        const prevVal = prev[1] ? parseInt(prev[1]) : 0
        const currVal = curr[1] ? parseInt(curr[1]) : 0
        return currVal > prevVal ? curr : prev
      })
      return bestSource[0]
    }
    return el.src || ''
  }
  
  if (el instanceof HTMLAnchorElement) {
    return el.href || ''
  }

  // Check for picture source if it's a child of picture
  if (el.parentElement instanceof HTMLPictureElement) {
    const source = el.parentElement.querySelector('source')
    if (source?.srcset) return source.srcset.split(',')[0].split(' ')[0]
  }

  return el.innerText.trim()
}

function handleClick(e: MouseEvent) {
  if (!isSelecting) return
  preventAll(e)

  const target = e.target as HTMLElement
  const selector = getGeneralSelector(target)
  const elements = document.querySelectorAll(selector)
  
  let text = ''
  if (target instanceof HTMLImageElement) {
    text = '[Image] ' + (target.alt || target.src.substring(0, 20))
  } else {
    text = target.innerText.trim().substring(0, 50) + (target.innerText.length > 50 ? '...' : '')
  }

  if (selectionMode === 'parent') {
    chrome.runtime.sendMessage({
      type: 'PARENT_SELECTED',
      payload: { selector }
    })
  } else {
    let relativeSelector: string | undefined = undefined
    if (activeParentSelector) {
      relativeSelector = getRelativeSelector(target, activeParentSelector)
    }

    chrome.runtime.sendMessage({
      type: 'ELEMENT_SELECTED',
      payload: { 
        selector, 
        relativeSelector,
        text,
        matchCount: elements.length
      }
    })
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'START_SELECTION' || message.type === 'START_PARENT_SELECTION') {
    isSelecting = true
    selectionMode = message.type === 'START_PARENT_SELECTION' ? 'parent' : 'field'
    activeParentSelector = message.payload?.parentSelector || null

    document.addEventListener('mouseover', handleMouseOver)
    document.addEventListener('mouseout', handleMouseOut)
    document.addEventListener('click', handleClick, true)
    document.addEventListener('mousedown', preventAll, true)
    document.addEventListener('mouseup', preventAll, true)
    document.addEventListener('pointerdown', preventAll, true)
    document.addEventListener('pointerup', preventAll, true)
    sendResponse({ status: 'Selection started' })
  } else if (message.type === 'STOP_SELECTION') {
    isSelecting = false
    document.removeEventListener('mouseover', handleMouseOver)
    document.removeEventListener('mouseout', handleMouseOut)
    document.removeEventListener('click', handleClick, true)
    document.removeEventListener('mousedown', preventAll, true)
    document.removeEventListener('mouseup', preventAll, true)
    document.removeEventListener('pointerdown', preventAll, true)
    document.removeEventListener('pointerup', preventAll, true)
    currentMatches.forEach(el => el.classList.remove('xtractify-highlight'))
    currentMatches = []
    sendResponse({ status: 'Selection stopped' })
  } else if (message.type === 'EXTRACT_DATA') {
    const { fields, parentSelector } = message.payload
    
    if (parentSelector) {
      const parents = Array.from(document.querySelectorAll(parentSelector)) as HTMLElement[]
      const results = fields.map((field: any) => ({
        id: field.id,
        name: field.name,
        values: parents.map(p => {
          const el = p.querySelector(field.relativeSelector || field.selector) as HTMLElement
          return el ? extractElementValue(el) : ''
        })
      }))
      sendResponse({ results })
    } else {
      const results = fields.map((field: any) => {
        const elements = Array.from(document.querySelectorAll(field.selector)) as HTMLElement[]
        return {
          id: field.id,
          name: field.name,
          values: elements.map(el => extractElementValue(el))
        }
      })
      sendResponse({ results })
    }
  }
})

console.log('[Xtractify] Content script loaded.')
