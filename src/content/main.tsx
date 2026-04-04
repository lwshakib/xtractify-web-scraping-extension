import { getGeneralSelector } from './utils/selector'

let isSelecting = false

const highlightStyle = document.createElement('style')
highlightStyle.textContent = `
  .xtractify-highlight {
    outline: 2px solid #3b82f6 !important;
    outline-offset: -2px !important;
    cursor: crosshair !important;
  }
`
document.head.appendChild(highlightStyle)

let currentMatches: HTMLElement[] = []

function handleMouseOver(e: MouseEvent) {
  if (!isSelecting) return
  const target = e.target as HTMLElement
  
  // Clean up previous highlights
  currentMatches.forEach(el => el.classList.remove('xtractify-highlight'))
  
  // Find new general selector and highlight all matches
  const selector = getGeneralSelector(target)
  const matches = Array.from(document.querySelectorAll(selector)) as HTMLElement[]
  
  // Cap at 200 for performance
  matches.slice(0, 200).forEach(el => el.classList.add('xtractify-highlight'))
  currentMatches = matches
}

function handleMouseOut(e: MouseEvent) {
  if (!isSelecting) return
  // We handle cleanup in MouseOver or on Stop, 
  // but to avoid flickering on sibling hover, we can leave them 
  // and they will be cleaned up by the next MouseOver.
  // However, if we leave the page, we should clean up:
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

function handleClick(e: MouseEvent) {
  if (!isSelecting) return
  preventAll(e)

  const target = e.target as HTMLElement
  const selector = getGeneralSelector(target)
  const elements = document.querySelectorAll(selector)
  const text = target.innerText.trim().substring(0, 50) + (target.innerText.length > 50 ? '...' : '')

  chrome.runtime.sendMessage({
    type: 'ELEMENT_SELECTED',
    payload: { 
      selector, 
      text,
      matchCount: elements.length
    }
  })
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'START_SELECTION') {
    isSelecting = true
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
    const { fields } = message.payload
    const results = fields.map((field: any) => {
      const elements = Array.from(document.querySelectorAll(field.selector)) as HTMLElement[]
      return {
        id: field.id,
        name: field.name,
        values: elements.map(el => el.innerText.trim())
      }
    })
    sendResponse({ results })
  }
})

console.log('[Xtractify] Content script loaded.')
