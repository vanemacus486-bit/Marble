export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

export function extractHeadings(html: string): Array<{ level: number; text: string; id: string }> {
  const headings: Array<{ level: number; text: string; id: string }> = []
  const regex = /<h([1-6])(?:\s[^>]*?)?>(.+?)<\/h\1>/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1])
    const text = stripHtml(match[2])
    const id =
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || `heading-${headings.length}`
    headings.push({ level, text, id })
  }
  return headings
}

export function extractBodyContent(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  return bodyMatch?.[1] ?? html
}

export function countWords(html: string): number {
  return stripHtml(html).split(/\s+/).filter(Boolean).length
}

export function extractLinks(html: string): Array<{ href: string; text: string }> {
  const links: Array<{ href: string; text: string }> = []
  const regex = /<a\s[^>]*?href="([^"]*)"[^>]*?>([\s\S]*?)<\/a>/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    links.push({ href: match[1], text: stripHtml(match[2]) })
  }
  return links
}
