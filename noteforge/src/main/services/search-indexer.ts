import FlexSearch from 'flexsearch'
import type { NoteIndex, SearchQuery, SearchResult, SearchResponse } from '../types/ipc-contracts'

interface IndexedDoc {
  id: string
  title: string
  tags: string
  content: string
  headings: string
  path: string
}

export class SearchIndexer {
  private index: FlexSearch.Document<IndexedDoc, string[]>
  private noteStore: Map<string, { index: NoteIndex; bodyText: string }> = new Map()
  private docCount: number = 0

  constructor() {
    this.index = this.createIndex()
  }

  private createIndex(): FlexSearch.Document<IndexedDoc, string[]> {
    return new FlexSearch.Document<IndexedDoc, string[]>({
      tokenize: 'forward',
      cache: false,
      resolution: 9,
      document: {
        id: 'id',
        index: ['title', 'tags', 'content', 'headings', 'path'],
        store: ['title', 'path'],
      },
    })
  }

  async build(notes: Map<string, { index: NoteIndex; bodyText: string }>): Promise<void> {
    this.index = this.createIndex()
    this.noteStore = new Map(notes)
    this.docCount = 0
    for (const [id, note] of notes) {
      await this.addDoc(id, note.index, note.bodyText)
    }
  }

  async addDocument(id: string, note: NoteIndex, bodyText: string): Promise<void> {
    this.noteStore.set(id, { index: note, bodyText })
    await this.addDoc(id, note, bodyText)
  }

  private async addDoc(id: string, note: NoteIndex, bodyText: string): Promise<void> {
    const tags = note.tags.join(' ')
    const headings = note.headings.map((h) => h.text).join(' ')
    await this.index.add({
      id,
      title: note.title,
      tags,
      content: bodyText,
      headings,
      path: id,
    })
    this.docCount++
  }

  async updateDocument(id: string, note: NoteIndex, bodyText: string): Promise<void> {
    try {
      await this.index.remove(id)
    } catch {}
    this.noteStore.set(id, { index: note, bodyText })
    const tags = note.tags.join(' ')
    const headings = note.headings.map((h) => h.text).join(' ')
    await this.index.add({
      id,
      title: note.title,
      tags,
      content: bodyText,
      headings,
      path: id,
    })
  }

  async removeDocument(id: string): Promise<void> {
    this.noteStore.delete(id)
    try {
      await this.index.remove(id)
    } catch {}
    this.docCount = Math.max(0, this.docCount - 1)
  }

  async search(query: SearchQuery): Promise<SearchResponse> {
    const start = performance.now()
    const { text, operators } = query
    if (!text && Object.keys(operators).length === 0) {
      return { results: [], total: 0, time: 0 }
    }

    let resultIds = new Set<string>()

    if (text) {
      const fieldResults = await this.index.search({ query: text, limit: query.limit || 50, enrich: false })

      for (const fr of fieldResults) {
        if (Array.isArray(fr.result)) {
          for (const id of fr.result) {
            resultIds.add(id)
          }
        }
      }
    } else {
      for (const [id] of this.noteStore) {
        resultIds.add(id)
      }
    }

    let results = Array.from(resultIds)

    const folderOp = operators['folder']
    if (folderOp) {
      results = results.filter((id) => id.startsWith(folderOp + '/') || id.startsWith(folderOp + '\\'))
    }

    const fileOp = operators['file']
    if (fileOp) {
      results = results.filter((id) => id.endsWith('/' + fileOp) || id === fileOp)
    }

    const pathOp = operators['path']
    if (pathOp) {
      results = results.filter((id) => id.includes(pathOp))
    }

    const titleOp = operators['title']
    if (titleOp) {
      const lower = titleOp.toLowerCase()
      results = results.filter((id) => {
        const stored = this.noteStore.get(id)
        return stored && stored.index.title.toLowerCase().includes(lower)
      })
    }

    const tagOp = operators['tag']
    if (tagOp) {
      const lower = tagOp.toLowerCase()
      results = results.filter((id) => {
        const stored = this.noteStore.get(id)
        return stored && stored.index.tags.some((t) => t.toLowerCase().includes(lower))
      })
    }

    const offset = query.offset || 0
    const limit = query.limit || 50
    const page = results.slice(offset, offset + limit)
    const total = results.length
    const elapsed = performance.now() - start

    const searchResults: SearchResult[] = page.map((id, i) => {
      const stored = this.noteStore.get(id)
      return {
        noteId: id,
        title: stored?.index.title || '',
        path: id,
        snippet: stored ? this.generateSnippet(stored.bodyText, text) : '',
        matchType: this.determineMatchType(id, text || operators),
        score: total - offset - i,
      }
    })

    return { results: searchResults, total, time: Math.round(elapsed) }
  }

  parseQuery(raw: string): { text: string; operators: Record<string, string> } {
    const operators: Record<string, string> = {}
    const textParts: string[] = []
    for (const part of raw.split(/\s+/)) {
      const match = part.match(/^(tag|folder|file|path|title):(.+)$/)
      if (match) {
        operators[match[1]] = match[2]
      } else {
        textParts.push(part)
      }
    }
    return { text: textParts.join(' ').trim(), operators }
  }

  async serialize(): Promise<Uint8Array> {
    const parts: Record<string, string> = {}
    await this.index.export((key: string, data: string) => {
      parts[key] = data
    })

    const storeData: Array<[string, { index: NoteIndex; bodyText: string }]> = []
    for (const [id, data] of this.noteStore) {
      storeData.push([id, data])
    }

    const payload = JSON.stringify({
      parts,
      store: storeData,
      count: this.docCount,
    })
    return new TextEncoder().encode(payload)
  }

  async deserialize(data: Uint8Array): Promise<void> {
    this.index = this.createIndex()
    this.noteStore = new Map()
    this.docCount = 0

    const payload = JSON.parse(new TextDecoder().decode(data))
    const { parts, store, count } = payload

    if (parts) {
      for (const [key, value] of Object.entries(parts)) {
        await this.index.import(key, value as string)
      }
    }

    if (store) {
      for (const [id, data] of store) {
        this.noteStore.set(id, data)
      }
    }

    this.docCount = count || 0
  }

  getDocumentCount(): number {
    return this.docCount
  }

  private generateSnippet(bodyText: string, query: string): string {
    if (!bodyText) return ''
    if (!query) return bodyText.slice(0, 200) + (bodyText.length > 200 ? '...' : '')

    const lowerBody = bodyText.toLowerCase()
    const lowerQuery = query.toLowerCase()
    const idx = lowerBody.indexOf(lowerQuery)

    if (idx === -1) {
      return bodyText.slice(0, 200) + (bodyText.length > 200 ? '...' : '')
    }

    const start = Math.max(0, idx - 80)
    const end = Math.min(bodyText.length, idx + query.length + 80)
    const prefix = start > 0 ? '...' : ''
    const suffix = end < bodyText.length ? '...' : ''
    return prefix + bodyText.slice(start, end) + suffix
  }

  private determineMatchType(id: string, query: string): SearchResult['matchType'] {
    if (!query) return 'content'
    const stored = this.noteStore.get(id)
    if (!stored) return 'content'

    const lower = query.toLowerCase()
    if (stored.index.title.toLowerCase().includes(lower)) return 'title'
    if (stored.index.tags.some((t) => t.toLowerCase().includes(lower))) return 'tag'
    if (id.toLowerCase().includes(lower)) return 'path'
    return 'content'
  }
}
