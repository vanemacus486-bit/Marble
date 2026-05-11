import { Parser } from 'htmlparser2'
import type { NoteIndex, Link, NoteProperties } from '../types/ipc-contracts'

export class NoteParser {
  parseNote(html: string, relativePath: string): NoteIndex {
    const state = {
      title: '',
      tags: [] as string[],
      created: '',
      modified: '',
      links: [] as Array<{ href: string; text: string; internal: boolean }>,
      headings: [] as Array<{ level: number; text: string; id: string }>,
      metadata: {} as Record<string, string>,
      textParts: [] as string[],
      inTitle: false,
      inHead: false,
      inBody: false,
      inScript: false,
      scriptDepth: 0,
      headingLevel: 0,
      headingText: '',
      headingId: '',
      linkHref: '',
      linkText: '',
      inLink: false,
    }

    const parser = new Parser({
      onopentag(name, attribs) {
        const tag = name.toLowerCase()
        if (tag === 'head') {
          state.inHead = true
          return
        }
        if (tag === 'body') {
          state.inBody = true
          return
        }
        if (tag === 'title' && state.inHead) {
          state.inTitle = true
          return
        }
        if (tag === 'script' || tag === 'style') {
          state.inScript = true
          state.scriptDepth = 1
          return
        }
        if (tag === 'a' && attribs.href) {
          state.inLink = true
          state.linkHref = attribs.href
          state.linkText = ''
          return
        }
        if (/^h[1-6]$/.test(tag)) {
          state.headingLevel = parseInt(tag[1], 10)
          state.headingId = attribs.id || ''
          state.headingText = ''
          return
        }
        if (tag === 'meta' && state.inHead) {
          const nameAttr = attribs.name?.toLowerCase()
          if (nameAttr === 'tags' && attribs.content) {
            state.tags = attribs.content.split(/[,\s]+/).filter(Boolean)
          } else if (nameAttr === 'created' && attribs.content) {
            state.created = attribs.content
          } else if (nameAttr === 'modified' && attribs.content) {
            state.modified = attribs.content
          } else if (nameAttr && attribs.content) {
            state.metadata[nameAttr] = attribs.content
          }
          return
        }
      },

      ontext(text) {
        if (state.inScript) return
        if (state.inTitle) {
          state.title += text.trim()
          return
        }
        if (state.headingLevel > 0) {
          state.headingText += text
          return
        }
        if (state.inLink) {
          state.linkText += text
          return
        }
        if (state.inBody) {
          state.textParts.push(text)
          return
        }
      },

      onclosetag(name) {
        const tag = name.toLowerCase()
        if (tag === 'head') {
          state.inHead = false
          return
        }
        if (tag === 'title') {
          state.inTitle = false
          return
        }
        if (tag === 'body') {
          state.inBody = false
          return
        }
        if ((tag === 'script' || tag === 'style') && state.inScript) {
          state.inScript = false
          state.scriptDepth = 0
          return
        }
        if (tag === 'a' && state.inLink) {
          const href = state.linkHref
          const text = state.linkText || href
          const isInternal = !href.startsWith('http://') && !href.startsWith('https://')
          state.links.push({ href, text, internal: isInternal })
          state.inLink = false
          state.linkHref = ''
          state.linkText = ''
          return
        }
        if (/^h[1-6]$/.test(tag) && state.headingLevel > 0) {
          const text = state.headingText.trim()
          const id = state.headingId || slugify(text) || `heading-${state.headings.length}`
          state.headings.push({ level: state.headingLevel, text, id })
          state.headingLevel = 0
          state.headingText = ''
          state.headingId = ''
          return
        }
      },
    })

    parser.write(html)
    parser.end()

    const fullText = state.textParts.join(' ')
    const wordCount = fullText ? fullText.split(/\s+/).filter(Boolean).length : 0
    const firstHeading = state.headings.length > 0 ? state.headings[0].text : null

    const links: Link[] = state.links.map((l) => ({
      source: relativePath,
      target: l.href,
      displayText: l.text,
    }))

    const now = new Date()
    const created = state.created ? new Date(state.created) : now
    const modified = state.modified ? new Date(state.modified) : now

    return {
      id: relativePath,
      title: state.title || firstHeading || relativePath.replace(/\.html$/i, ''),
      tags: state.tags,
      links,
      backlinks: [],
      created,
      modified,
      metadata: state.metadata,
      wordCount,
      firstHeading,
      headings: state.headings,
    }
  }

  updateProperties(html: string, props: Partial<NoteProperties>): string {
    let result = html

    if (props.title !== undefined) {
      result = result.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(props.title)}</title>`)
    }

    if (props.tags !== undefined) {
      const tagsContent = props.tags.join(', ')
      if (/<meta\s+name="tags"/i.test(result)) {
        result = result.replace(/<meta\s+name="tags"\s+content="[^"]*"/i, `<meta name="tags" content="${escapeAttr(tagsContent)}"`)
      } else {
        result = result.replace('</head>', `  <meta name="tags" content="${escapeAttr(tagsContent)}">\n</head>`)
      }
    }

    if (props.created !== undefined) {
      const createdStr = props.created instanceof Date ? props.created.toISOString() : String(props.created)
      if (/<meta\s+name="created"/i.test(result)) {
        result = result.replace(/<meta\s+name="created"\s+content="[^"]*"/i, `<meta name="created" content="${escapeAttr(createdStr)}"`)
      } else {
        result = result.replace('</head>', `  <meta name="created" content="${escapeAttr(createdStr)}">\n</head>`)
      }
    }

    if (props.modified !== undefined) {
      const modifiedStr = props.modified instanceof Date ? props.modified.toISOString() : String(props.modified)
      if (/<meta\s+name="modified"/i.test(result)) {
        result = result.replace(/<meta\s+name="modified"\s+content="[^"]*"/i, `<meta name="modified" content="${escapeAttr(modifiedStr)}"`)
      } else {
        result = result.replace('</head>', `  <meta name="modified" content="${escapeAttr(modifiedStr)}">\n</head>`)
      }
    }

    if (props.metadata !== undefined) {
      for (const [key, value] of Object.entries(props.metadata)) {
        if (/^(tags|created|modified)$/i.test(key)) continue
        const escapedKey = escapeAttr(key)
        const escapedVal = escapeAttr(value)
        const regex = new RegExp(`<meta\\s+name="${escapeRegExp(key)}"\\s+content="[^"]*"`, 'i')
        if (regex.test(result)) {
          result = result.replace(regex, `<meta name="${escapedKey}" content="${escapedVal}"`)
        } else {
          result = result.replace('</head>', `  <meta name="${escapedKey}" content="${escapedVal}">\n</head>`)
        }
      }
    }

    return result
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
