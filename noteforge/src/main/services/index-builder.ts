import type { NoteIndex, IndexProgress, FileChangeEvent, Link } from '../types/ipc-contracts'
import type { VaultManager } from './vault-manager'
import type { NoteParser } from './note-parser'
import type { SearchIndexer } from './search-indexer'

function extractBodyText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export class IndexBuilder {
  private vaultManager: VaultManager
  private noteParser: NoteParser
  private searchIndexer: SearchIndexer

  constructor(vaultManager: VaultManager, noteParser: NoteParser, searchIndexer: SearchIndexer) {
    this.vaultManager = vaultManager
    this.noteParser = noteParser
    this.searchIndexer = searchIndexer
  }

  async buildFull(callback?: (progress: IndexProgress) => void): Promise<Map<string, NoteIndex>> {
    this.emitProgress(callback, { current: 0, total: 0, phase: 'scanning' })

    const files = await this.vaultManager.listFiles()
    const htmlFiles = files.filter((f) => !f.isDirectory && f.name.endsWith('.html'))
    const total = htmlFiles.length

    if (total === 0) {
      this.emitProgress(callback, { current: 0, total: 0, phase: 'complete' })
      return new Map()
    }

    this.emitProgress(callback, { current: 0, total, phase: 'parsing' })

    const notes = new Map<string, NoteIndex>()
    const noteData = new Map<string, { index: NoteIndex; bodyText: string }>()

    for (let i = 0; i < total; i++) {
      const file = htmlFiles[i]
      try {
        const content = await this.vaultManager.readNote(file.path)
        const parsed = this.noteParser.parseNote(content, file.path)
        notes.set(parsed.id, parsed)
        const bodyText = extractBodyText(content)
        noteData.set(parsed.id, { index: parsed, bodyText })
      } catch {
        // Skip files that can't be read or parsed
      }

      if ((i + 1) % 10 === 0 || i === total - 1) {
        this.emitProgress(callback, { current: i + 1, total, phase: 'parsing' })
      }
    }

    this.emitProgress(callback, { current: total, total, phase: 'indexing' })

    this.computeBacklinks(notes)

    // Add body text to be available for mention detection
    const notesForIndex = new Map<string, { index: NoteIndex; bodyText: string }>()
    for (const [id, note] of notes) {
      const bodyText = noteData.get(id)?.bodyText || ''
      notesForIndex.set(id, { index: note, bodyText })
    }

    await this.searchIndexer.build(notesForIndex)

    this.emitProgress(callback, { current: total, total, phase: 'complete' })
    return notes
  }

  async incrementalUpdate(event: FileChangeEvent): Promise<void> {
    if (event.type === 'unlink') {
      await this.searchIndexer.removeDocument(event.path)
      return
    }

    if (event.type === 'add' || event.type === 'change') {
      try {
        const content = await this.vaultManager.readNote(event.path)
        const parsed = this.noteParser.parseNote(content, event.path)
        const bodyText = extractBodyText(content)

        if (event.type === 'add') {
          await this.searchIndexer.addDocument(event.path, parsed, bodyText)
        } else {
          await this.searchIndexer.updateDocument(event.path, parsed, bodyText)
        }
      } catch {
        // Skip files that can't be read
      }
      return
    }
  }

  computeBacklinks(notes: Map<string, NoteIndex>): void {
    for (const [, note] of notes) {
      note.backlinks = []
    }

    for (const [, sourceNote] of notes) {
      for (const link of sourceNote.links) {
        const targetId = link.target.replace(/\.html$/i, '')
        const targetNote = notes.get(targetId)
        if (targetNote) {
          targetNote.backlinks.push({
            source: link.source,
            target: targetId,
            displayText: link.displayText,
          })
        }
      }
    }
  }

  detectUnlinkedMentions(notes: Map<string, NoteIndex>): Map<string, Link[]> {
    const titleToId = new Map<string, string>()
    for (const [id, note] of notes) {
      const key = note.title.toLowerCase().trim()
      if (key) {
        titleToId.set(key, id)
      }
    }

    const result = new Map<string, Link[]>()
    for (const [id, note] of notes) {
      result.set(id, [])
    }

    for (const [id, note] of notes) {
      const existingTargets = new Set(note.links.map((l) => l.target.replace(/\.html$/i, '')))

      for (const [title, targetId] of titleToId) {
        if (targetId === id) continue
        if (existingTargets.has(targetId)) continue

        const bodyText = note.title.toLowerCase() + ' ' + note.headings.map((h) => h.text).join(' ').toLowerCase()
        const idx = bodyText.indexOf(title)
        if (idx !== -1) {
          const mentions = result.get(id)
          if (mentions) {
            mentions.push({
              source: id,
              target: targetId,
              displayText: note.title,
            })
          }
        }
      }
    }

    return result
  }

  private emitProgress(
    callback: ((progress: IndexProgress) => void) | undefined,
    progress: IndexProgress
  ): void {
    try {
      callback?.(progress)
    } catch {}
  }
}
