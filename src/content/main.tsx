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
  let matches: HTMLElement[] = []

  if (selectionMode === 'field' && activeParentSelector) {
    const parent = target.closest(activeParentSelector) as HTMLElement
    if (parent) {
      const parentMatches = Array.from(parent.querySelectorAll(selector))
      const childIndex = parentMatches.indexOf(target)
      
      if (childIndex !== -1) {
        const allParents = Array.from(document.querySelectorAll(activeParentSelector))
        allParents.forEach(p => {
          const peers = p.querySelectorAll(selector)
          if (peers[childIndex]) {
            matches.push(peers[childIndex] as HTMLElement)
          }
        })
      }
    }
  } else {
    // Parent selection mode or no active parent: highlight all matches globally
    matches = Array.from(document.querySelectorAll(selector)) as HTMLElement[]
  }
  
  matches.slice(0, 400).forEach(el => el.classList.add('xtractify-highlight'))
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
  
  let text = ''
  if (target instanceof HTMLImageElement) {
    text = '[Image] ' + (target.alt || target.src.substring(0, 20))
  } else {
    text = target.innerText.trim().substring(0, 50) + (target.innerText.length > 50 ? '...' : '')
  }

  if (selectionMode === 'parent') {
    const elements = document.querySelectorAll(selector)
    chrome.runtime.sendMessage({
      type: 'PARENT_SELECTED',
      payload: { 
        selector,
        matchCount: elements.length
      }
    })
  } else {
    let relativeSelector: string | undefined = undefined
    let childIndex: number = 0
    let matchCount: number = 0

    if (activeParentSelector) {
      const parent = target.closest(activeParentSelector) as HTMLElement
      const allContainers = Array.from(document.querySelectorAll(activeParentSelector))
      
      if (parent) {
        relativeSelector = getRelativeSelector(target, activeParentSelector)
        if (relativeSelector) {
          const peers = Array.from(parent.querySelectorAll(relativeSelector))
          childIndex = peers.indexOf(target)
          
          // Accurate count: how many containers actually have an element at this index?
          allContainers.forEach(container => {
            const matches = container.querySelectorAll(relativeSelector!)
            if (matches[childIndex]) matchCount++
          })
        }
      }
    } else {
      matchCount = document.querySelectorAll(selector).length
    }

    chrome.runtime.sendMessage({
      type: 'ELEMENT_SELECTED',
      payload: { 
        selector, 
        relativeSelector,
        childIndex,
        text,
        matchCount
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
          const matches = p.querySelectorAll(field.relativeSelector || field.selector)
          const el = matches[field.childIndex || 0] as HTMLElement
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
