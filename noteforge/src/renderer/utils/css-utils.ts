const snippetStyleElements = new Map<string, HTMLStyleElement>()

export function injectCssSnippet(name: string, css: string): void {
  removeCssSnippet(name)

  const style = document.createElement('style')
  style.setAttribute('data-snippet', name)
  style.textContent = css
  document.head.appendChild(style)
  snippetStyleElements.set(name, style)
}

export function removeCssSnippet(name: string): void {
  const existing = snippetStyleElements.get(name)
  if (existing) {
    existing.remove()
    snippetStyleElements.delete(name)
  }
}

export function toggleCssSnippet(name: string, css: string, enabled: boolean): void {
  if (enabled) {
    injectCssSnippet(name, css)
  } else {
    removeCssSnippet(name)
  }
}

export function getActiveSnippets(): string[] {
  return Array.from(snippetStyleElements.keys())
}

export function clearAllSnippets(): void {
  for (const [name] of snippetStyleElements) {
    removeCssSnippet(name)
  }
}

export function getCssVariable(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export function setCssVariable(name: string, value: string): void {
  document.documentElement.style.setProperty(name, value)
}
