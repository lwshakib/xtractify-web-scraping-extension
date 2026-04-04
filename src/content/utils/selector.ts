/**
 * Generates a unique CSS selector for a given HTML element.
 * This is used when we need to target a SPECIFIC element precisely, 
 * usually by leveraging IDs or the complete DOM path with nth-of-type.
 * 
 * @param el The HTMLElement to generate a selector for.
 * @returns A string representing the unique CSS selector.
 */
export function getUniqueSelector(el: HTMLElement): string {
  // If the element has a unique ID, that's the best and simplest selector.
  if (el.id) {
    return `#${CSS.escape(el.id)}`
  }

  const path: string[] = []
  let current: HTMLElement | null = el

  // Traverse up the DOM tree until we hit an ID or the root.
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    if (current.id) {
      // If an ancestor has an ID, we can start our path from there.
      path.unshift(`#${CSS.escape(current.id)}`)
      break
    }

    let tagName = current.nodeName.toLowerCase()
    let index = 1
    let sibling = current.previousElementSibling

    // Calculate the index of this element among its same-tagged siblings.
    while (sibling) {
      if (sibling.nodeName.toLowerCase() === tagName) {
        index++
      }
      sibling = sibling.previousElementSibling
    }

    // Use nth-of-type to ensure uniqueness within the parent container.
    path.unshift(`${tagName}:nth-of-type(${index})`)
    current = current.parentElement as HTMLElement | null
  }

  return path.join(' > ')
}

/**
 * Generates a "general" CSS selector that aims to match similar elements on the page.
 * This is the CORE of the scraping logic – it helps identify repeated patterns 
 * like product cards, list items, or prices across a catalog.
 * 
 * @param el The HTMLElement to generate a pattern-matching selector for.
 * @returns A string representing a selector that likely matches multiple similar items.
 */
export function getGeneralSelector(el: HTMLElement): string {
  const path: string[] = []
  let current: HTMLElement | null = el
  let depth = 0

  // We traverse up to 5 levels to find a stable "container" or "pattern" selector.
  while (current && current.nodeType === Node.ELEMENT_NODE && depth < 5) {
    let part = current.nodeName.toLowerCase()
    const hasClasses = current.className && typeof current.className === 'string'
    
    if (hasClasses) {
      // Sanitize and include classes, excluding internal extension classes.
      const classes = current.className
        .split(/\s+/)
        .filter(c => c && !c.includes(':') && !c.includes('xtractify'))
        .map(c => `.${CSS.escape(c)}`)
        .join('')
      part += classes
    }

    path.unshift(part)
    const selector = path.join(' > ')
    const matches = document.querySelectorAll(selector)
    
    /**
     * DECISION LOGIC:
     * We stop traversing up if we find a selector that:
     * 1. Matches multiple items (indicating it's a pattern).
     * 2. Matches fewer than 200 items (to avoid overly broad selection like 'div').
     * 3. Isn't a generic/common HTML tag without classes (like a bare 'div' or 'p').
     */
    const isGeneric = !hasClasses && ['div', 'span', 'p', 'li', 'a', 'td', 'tr'].includes(part)
    
    if (matches.length > 1 && matches.length < 200 && !isGeneric) {
      break
    }
    
    // If the match count is too high (e.g., > 200), the selector is too broad.
    // We MUST continue climbing the DOM tree to find a more specific parent container.
    if (matches.length > 200) {
      current = current.parentElement as HTMLElement | null
      depth++
      continue
    }

    current = current.parentElement as HTMLElement | null
    depth++
  }

  return path.join(' > ')
}

