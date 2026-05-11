export function getFileName(path: string): string {
  const idx = path.lastIndexOf('/')
  return idx >= 0 ? path.substring(idx + 1) : path
}

export function getFolder(path: string): string {
  const idx = path.lastIndexOf('/')
  return idx >= 0 ? path.substring(0, idx) : ''
}

export function isHtmlFile(path: string): boolean {
  return path.toLowerCase().endsWith('.html')
}
