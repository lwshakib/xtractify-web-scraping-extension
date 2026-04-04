export function getUniqueSelector(el: HTMLElement): string {
  if (el.id) {
    return `#${CSS.escape(el.id)}`
  }

  const path: string[] = []
  let current: HTMLElement | null = el

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    if (current.id) {
      path.unshift(`#${CSS.escape(current.id)}`)
      break
    }

    let tagName = current.nodeName.toLowerCase()
    let index = 1
    let sibling = current.previousElementSibling

    while (sibling) {
      if (sibling.nodeName.toLowerCase() === tagName) {
        index++
      }
      sibling = sibling.previousElementSibling
    }

    path.unshift(`${tagName}:nth-of-type(${index})`)
    current = current.parentElement as HTMLElement | null
  }

  return path.join(' > ')
}

export function getGeneralSelector(el: HTMLElement): string {
  const path: string[] = []
  let current: HTMLElement | null = el
  let depth = 0

  while (current && current.nodeType === Node.ELEMENT_NODE && depth < 5) {
    let part = current.nodeName.toLowerCase()
    const hasClasses = current.className && typeof current.className === 'string'
    
    if (hasClasses) {
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
    
    // If it's a common tag with no classes, don't stop here unless it matches something small
    const isGeneric = !hasClasses && ['div', 'span', 'p', 'li', 'a', 'td', 'tr'].includes(part)
    
    if (matches.length > 1 && matches.length < 200 && !isGeneric) {
      break
    }
    
    // If we've reached a high match count, we MUST continue up to find a container
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
