export function isInternalLink(href: string): boolean {
  if (!href) return false
  if (href.startsWith('http://') || href.startsWith('https://')) return false
  if (href.startsWith('//') || href.startsWith('#')) return false
  if (href.startsWith('mailto:') || href.startsWith('tel:')) return false
  return href.endsWith('.html') || href.endsWith('.htm') || !href.includes(':')
}

export function normalizeNotePath(path: string, currentNotePath: string): string {
  if (!path) return path

  // Absolute from vault root
  if (!path.startsWith('.') && !path.startsWith('/')) {
    return path.replace(/\\/g, '/')
  }

  // Relative to current note
  const currentDir = currentNotePath.includes('/')
    ? currentNotePath.substring(0, currentNotePath.lastIndexOf('/'))
    : ''

  // Resolve relative path
  if (path.startsWith('./')) {
    return `${currentDir}/${path.substring(2)}`.replace(/\\/g, '/')
  }
  if (path.startsWith('../')) {
    const parts = currentDir.split('/')
    let relPath = path
    while (relPath.startsWith('../')) {
      parts.pop()
      relPath = relPath.substring(3)
    }
    return [...parts, relPath].join('/')
  }

  return `${currentDir}/${path}`.replace(/\\/g, '/')
}

export function isBrokenLink(
  targetPath: string,
  existingNoteIds: Set<string>
): boolean {
  return !existingNoteIds.has(targetPath)
}

export function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
