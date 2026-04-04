/**
 * main.tsx — Xtractify Content Script (Scraping Engine)
 *
 * This is the content script injected into every web page the user wants to scrape.
 * It is responsible for the entire in-page scraping lifecycle:
 *
 * 1. ELEMENT HIGHLIGHTING — When the user hovers over elements, this script
 *    computes a "general" CSS selector (via getGeneralSelector) and highlights
 *    ALL matching elements so the user can visually confirm their selection.
 *
 * 2. ELEMENT SELECTION — On click, it captures the selector, determines the
 *    element type (image / link / text), and sends the selection back to the
 *    sidepanel via chrome.runtime.sendMessage.
 *
 * 3. DATA EXTRACTION — When the user clicks "Extract Data" in the sidepanel,
 *    this script receives the list of field definitions, queries the DOM for
 *    each field's selector, extracts the appropriate value (URL or text),
 *    and returns the structured results.
 *
 * Communication with the sidepanel is entirely message-based using the
 * Chrome Extension messaging API (chrome.runtime.onMessage).
 */

import { getGeneralSelector } from './utils/selector'

// ─── Global State ─────────────────────────────────────────────────────────────
// These module-level variables track the current selection session.

/** Whether the user is currently in selection mode (hover-to-highlight is active). */
let isSelecting = false

/**
 * The current selection mode:
 * - 'field': Selecting a data field WITHIN a parent container.
 * - 'parent': Selecting the repeating parent container itself (e.g., a product card).
 */
let selectionMode: 'field' | 'parent' = 'field'

/**
 * The CSS selector for the currently active parent container.
 * When set, field selections are scoped WITHIN each parent container,
 * enabling accurate per-row data extraction.
 */
let activeParentSelector: string | null = null

// ─── Highlight Styling ────────────────────────────────────────────────────────
// Inject a <style> element into the page to define the visual highlight.
// Using a CSS class (instead of inline styles) prevents interference with
// the page's existing inline styles and allows easy bulk removal.

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

/** Tracks all currently highlighted elements so we can remove highlights efficiently. */
let currentMatches: HTMLElement[] = []

// ─── Event Handlers ───────────────────────────────────────────────────────────

/**
 * Handles the mouseover event during selection mode.
 *
 * Strategy:
 * 1. Remove all previous highlights.
 * 2. Compute the general selector for the hovered element.
 * 3. If in "field" mode with an active parent:
 *    - Find which parent container the hovered element belongs to.
 *    - Determine the child's INDEX within that parent (e.g., the 2nd <span> with class "price").
 *    - Then highlight the element at that SAME index inside EVERY parent container.
 *    This ensures the user sees a preview of exactly which data will be extracted per row.
 * 4. If in "parent" mode (or no parent set): highlight ALL global matches.
 * 5. Cap highlights at 400 to avoid freezing the page on broad selectors.
 */
function handleMouseOver(e: MouseEvent) {
  if (!isSelecting) return
  const target = e.target as HTMLElement
  
  // Clear previous highlights before computing new ones.
  currentMatches.forEach(el => el.classList.remove('xtractify-highlight'))
  
  const selector = getGeneralSelector(target)
  let matches: HTMLElement[] = []

  if (selectionMode === 'field' && activeParentSelector) {
    // --- Scoped Field Selection ---
    // Find the parent container that wraps the hovered element.
    const parent = target.closest(activeParentSelector) as HTMLElement
    if (parent) {
      // Find all siblings matching the selector WITHIN this specific parent.
      const parentMatches = Array.from(parent.querySelectorAll(selector))
      // Determine the ordinal position of the hovered element among its peers.
      const childIndex = parentMatches.indexOf(target)
      
      if (childIndex !== -1) {
        // Now replicate the selection across ALL parent containers at the same index.
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
    // --- Parent Selection Mode (or no parent set) ---
    // Highlight all global matches so the user can see every repeating container.
    matches = Array.from(document.querySelectorAll(selector)) as HTMLElement[]
  }
  
  // Performance guard: limit to 400 highlights to avoid DOM thrashing.
  matches.slice(0, 400).forEach(el => el.classList.add('xtractify-highlight'))
  currentMatches = matches
}

/**
 * Handles mouseout to clean up highlights when the cursor leaves the page entirely.
 * We check `e.relatedTarget === null` because that indicates the mouse has left
 * the document window (not just moved to another element).
 */
function handleMouseOut(e: MouseEvent) {
  if (!isSelecting) return
  if (e.relatedTarget === null) {
     currentMatches.forEach(el => el.classList.remove('xtractify-highlight'))
     currentMatches = []
  }
}

/**
 * Prevents ALL default browser behavior during selection mode.
 * This stops clicks from navigating links, submitting forms, or triggering
 * the page's own JavaScript handlers. We use stopImmediatePropagation to
 * ensure even handlers registered before ours don't fire.
 */
function preventAll(e: Event) {
  if (!isSelecting) return
  e.preventDefault()
  e.stopPropagation()
  e.stopImmediatePropagation()
}

// ─── Selector & Value Helpers ─────────────────────────────────────────────────

/**
 * Builds a CSS selector for an element RELATIVE to its parent container.
 * This is used when the user has set a parent container — we store the
 * relative selector (e.g., "span.price") instead of the full DOM path,
 * so we can query it within each parent independently during extraction.
 *
 * @param el The target element.
 * @param parentSelector The CSS selector of the parent container.
 * @returns A relative selector string (tagName + classes), or undefined if the element isn't inside a parent.
 */
function getRelativeSelector(el: HTMLElement, parentSelector: string): string | undefined {
  const parent = el.closest(parentSelector)
  if (!parent) return undefined

  const tagName = el.tagName.toLowerCase()
  // Filter out internal "xtractify-highlight" class to avoid polluting the selector.
  const classList = Array.from(el.classList).filter(c => c !== 'xtractify-highlight').map(c => `.${c}`).join('')
  
  return `${tagName}${classList}`
}

/**
 * Searches for a nearby <a> element (hyperlink) around a given element.
 * This is used to determine if a clicked element is semantically a "link"
 * even if the user clicked on a child (e.g., the text inside an <a> tag,
 * or a button that wraps a link).
 *
 * Search order:
 * 1. Check if the element itself is an <a>.
 * 2. Recursively search children up to `maxDepth` levels deep.
 * 3. Walk up through parent elements up to `maxDepth` levels.
 *
 * @param el The element to start searching from.
 * @param maxDepth How many levels deep/up to search (default: 3).
 * @returns The found HTMLAnchorElement, or null.
 */
function findNearbyLink(el: HTMLElement, maxDepth: number = 3): HTMLAnchorElement | null {
  // 1. Check self — is the element already a link?
  if (el instanceof HTMLAnchorElement && el.href) return el

  // 2. Check children — recursive depth-first search for nested links.
  function searchChildren(parent: HTMLElement, currentDepth: number): HTMLAnchorElement | null {
    if (currentDepth > maxDepth) return null
    for (const child of Array.from(parent.children)) {
      if (child instanceof HTMLAnchorElement && child.href) return child
      const found = searchChildren(child as HTMLElement, currentDepth + 1)
      if (found) return found
    }
    return null
  }
  const childLink = searchChildren(el, 1)
  if (childLink) return childLink

  // 3. Check parents — walk up the DOM tree looking for wrapping <a> tags.
  let currentParent = el.parentElement
  let depth = 1
  while (currentParent && depth <= maxDepth) {
    if (currentParent instanceof HTMLAnchorElement && currentParent.href) return currentParent
    currentParent = currentParent.parentElement
    depth++
  }

  return null
}

/**
 * Extracts a meaningful value from an HTML element based on the extract mode.
 *
 * In 'url' mode (for images and links):
 *   - For images: prefers `srcset` (highest resolution) over `src`.
 *   - For <picture> elements: reads the first <source> srcset.
 *   - For links: returns the href from the closest <a> ancestor.
 *
 * In 'text' mode (default for plain text elements):
 *   - For images: returns the `alt` attribute.
 *   - For <picture> elements: returns the alt from the nested <img>.
 *   - For all others: returns the visible `innerText`.
 *
 * @param el The element to extract a value from.
 * @param extractMode Whether to extract a 'url' or 'text' value.
 * @returns The extracted string value.
 */
function extractElementValue(el: HTMLElement, extractMode: 'url' | 'text' = 'url'): string {
  if (extractMode === 'url') {
    // --- URL Extraction: Images ---
    // Check if the element is (or contains) an <img>, and extract its best source.
    const img = el instanceof HTMLImageElement ? el : (el.closest('img') || el.querySelector('img'))
    if (img) {
      if (img.srcset) {
        // Parse srcset and pick the highest-resolution source.
        // srcset format: "url1 1x, url2 2x" or "url1 300w, url2 600w"
        const sources = img.srcset.split(',').map(s => s.trim().split(' '))
        const bestSource = sources.reduce((prev, curr) => {
          const prevVal = prev[1] ? parseInt(prev[1]) : 0
          const currVal = curr[1] ? parseInt(curr[1]) : 0
          return currVal > prevVal ? curr : prev
        })
        return bestSource[0]
      }
      return img.src || ''
    }

    // --- URL Extraction: <picture> element ---
    if (el.parentElement instanceof HTMLPictureElement) {
      const source = el.parentElement.querySelector('source')
      if (source?.srcset) return source.srcset.split(',')[0].split(' ')[0]
    }

    // --- URL Extraction: Anchor links ---
    const anchor = el.closest('a')
    if (anchor) return anchor.href
  }

  // --- Text Extraction ---
  // For images, return alt text instead of trying to get innerText.
  if (el instanceof HTMLImageElement) {
    return el.alt || ''
  }
  
  if (el.parentElement instanceof HTMLPictureElement) {
    return el.parentElement.querySelector('img')?.alt || ''
  }

  return el.innerText.trim()
}

// ─── Click Handler (Element Selection) ────────────────────────────────────────

/**
 * Handles click events during selection mode. This is the main "selection" handler.
 *
 * Flow:
 * 1. Prevent the click from doing anything on the page (no navigation, no JS).
 * 2. Compute the general selector for the clicked element.
 * 3. Determine the element's semantic type: image, link, or text.
 * 4. Extract preview values (both URL and text) so the sidepanel can show them.
 * 5. Send the selection data to the sidepanel:
 *    - In "parent" mode: sends PARENT_SELECTED with the selector and match count.
 *    - In "field" mode: sends ELEMENT_SELECTED with full field metadata including
 *      the relative selector, child index, element type, and preview values.
 */
function handleClick(e: MouseEvent) {
  if (!isSelecting) return
  preventAll(e)

  const target = e.target as HTMLElement
  const selector = getGeneralSelector(target)
  
  // Determine the semantic type of the clicked element for UI and extraction purposes.
  let elementType: 'image' | 'link' | 'text' = 'text'
  let previewUrl = ''
  let previewText = ''

  const anchor = findNearbyLink(target, 3)
  const img = target.closest('img') || target.closest('picture')?.querySelector('img')

  if (img) {
    elementType = 'image'
    previewUrl = extractElementValue(img, 'url')
    previewText = extractElementValue(img, 'text')
  } else if (anchor) {
    elementType = 'link'
    previewUrl = anchor.href
    previewText = target.innerText.trim() || anchor.innerText.trim()
  } else {
    elementType = 'text'
    const val = target.innerText.trim()
    previewText = val.substring(0, 50) + (val.length > 50 ? '...' : '')
    previewUrl = previewText
  }

  if (selectionMode === 'parent') {
    // --- Parent Container Selection ---
    // Send the selector and how many containers match it across the page.
    const elements = document.querySelectorAll(selector)
    chrome.runtime.sendMessage({
      type: 'PARENT_SELECTED',
      payload: { 
        selector,
        matchCount: elements.length
      }
    })
  } else {
    // --- Field Selection (within a parent) ---
    let relativeSelector: string | undefined = undefined
    let childIndex: number = 0
    let matchCount: number = 0

    if (activeParentSelector) {
      // Compute the field's position RELATIVE to the parent container.
      const parent = target.closest(activeParentSelector) as HTMLElement
      const allContainers = Array.from(document.querySelectorAll(activeParentSelector))
      
      if (parent) {
        relativeSelector = getRelativeSelector(target, activeParentSelector)
        if (relativeSelector) {
          // Determine the ordinal index of this field among its peers within the container.
          const peers = Array.from(parent.querySelectorAll(relativeSelector))
          childIndex = peers.indexOf(target)
          
          // Count how many containers actually have an element at this specific index.
          // This gives the user an accurate "X matched" count.
          allContainers.forEach(container => {
            const matches = container.querySelectorAll(relativeSelector!)
            if (matches[childIndex]) matchCount++
          })
        }
      }
    } else {
      // No parent container — count global matches.
      matchCount = document.querySelectorAll(selector).length
    }

    chrome.runtime.sendMessage({
      type: 'ELEMENT_SELECTED',
      payload: { 
        selector, 
        relativeSelector,
        childIndex,
        text: previewUrl, // Default text preview carries the URL for images/links.
        previewUrl,
        previewText,
        elementType,
        matchCount
      }
    })
  }
}

// ─── Message Listener (Bridge to Sidepanel) ───────────────────────────────────

/**
 * Listens for messages from the sidepanel (or background script) and responds accordingly.
 *
 * Supported message types:
 *
 * - PING: Health check. The sidepanel pings to verify the content script is alive
 *   before sending real commands. Responds with { status: 'PONG' }.
 *
 * - START_SELECTION / START_PARENT_SELECTION: Activates selection mode.
 *   Registers all mouse/click event listeners with `capture: true` (for click events)
 *   to intercept before the page's own handlers. Sets the selection mode and
 *   optionally stores the active parent selector for scoped field selection.
 *
 * - STOP_SELECTION: Deactivates selection mode. Removes all event listeners and
 *   cleans up any remaining highlights from the page.
 *
 * - EXTRACT_DATA: The main data extraction command. Receives the list of field
 *   definitions (with selectors, extract modes, etc.) and the parent selector.
 *   For each field:
 *   - If a parentSelector is set: queries within each parent container, using the
 *     field's relativeSelector and childIndex to pick the right element per row.
 *   - If no parentSelector: queries globally and extracts all matches.
 *   Returns an array of { id, name, values[] } objects.
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ status: 'PONG' })
    return true
  }

  if (message.type === 'START_SELECTION' || message.type === 'START_PARENT_SELECTION') {
    isSelecting = true
    selectionMode = message.type === 'START_PARENT_SELECTION' ? 'parent' : 'field'
    activeParentSelector = message.payload?.parentSelector || null

    // Register event listeners. Click-related events use `capture: true` to intercept
    // BEFORE the page's own handlers, preventing navigation and other side effects.
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
    // Remove all selection-mode event listeners.
    document.removeEventListener('mouseover', handleMouseOver)
    document.removeEventListener('mouseout', handleMouseOut)
    document.removeEventListener('click', handleClick, true)
    document.removeEventListener('mousedown', preventAll, true)
    document.removeEventListener('mouseup', preventAll, true)
    document.removeEventListener('pointerdown', preventAll, true)
    document.removeEventListener('pointerup', preventAll, true)
    // Clean up any remaining visual highlights.
    currentMatches.forEach(el => el.classList.remove('xtractify-highlight'))
    currentMatches = []
    sendResponse({ status: 'Selection stopped' })
  } else if (message.type === 'EXTRACT_DATA') {
    // --- Data Extraction ---
    const { fields, parentSelector } = message.payload
    
    if (parentSelector) {
      // Scoped extraction: iterate over each parent container and extract per-row values.
      const parents = Array.from(document.querySelectorAll(parentSelector)) as HTMLElement[]
      const results = fields.map((field: any) => ({
        id: field.id,
        name: field.name,
        values: parents.map(p => {
          // Use relativeSelector (scoped to parent) if available, fallback to global selector.
          const matches = p.querySelectorAll(field.relativeSelector || field.selector)
          // Pick the element at the same childIndex that was recorded during selection.
          const el = matches[field.childIndex || 0] as HTMLElement
          return el ? extractElementValue(el, field.extractMode || 'url') : ''
        })
      }))
      sendResponse({ results })
    } else {
      // Global extraction: query the entire document for each field's selector.
      const results = fields.map((field: any) => {
        const elements = Array.from(document.querySelectorAll(field.selector)) as HTMLElement[]
        return {
          id: field.id,
          name: field.name,
          values: elements.map(el => extractElementValue(el, field.extractMode || 'url'))
        }
      })
      sendResponse({ results })
    }
  }
})

console.log('[Xtractify] Content script loaded.')
