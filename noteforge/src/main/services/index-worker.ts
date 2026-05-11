import { parentPort } from 'worker_threads'
import { NoteParser } from './note-parser'
import { SearchIndexer } from './search-indexer'
import type { IndexProgress } from '../types/ipc-contracts'

function extractBodyText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function postProgress(current: number, total: number, phase: IndexProgress['phase']): void {
  parentPort?.postMessage({
    type: 'progress',
    progress: { current, total, phase } satisfies IndexProgress,
  })
}

interface BuildPayload {
  type: 'build'
  notes: Array<{ path: string; html: string }>
}

interface UpdatePayload {
  type: 'update'
  path: string
  html: string
  action: 'add' | 'change' | 'unlink'
}

type WorkerMessage = BuildPayload | UpdatePayload

const noteParser = new NoteParser()
const searchIndexer = new SearchIndexer()

parentPort?.on('message', async (msg: WorkerMessage) => {
  try {
    if (msg.type === 'build') {
      const { notes } = msg
      const total = notes.length
      const noteData = new Map<string, { index: ReturnType<NoteParser['parseNote']>; bodyText: string }>()

      postProgress(0, total, 'parsing')

      for (let i = 0; i < total; i++) {
        const { path, html } = notes[i]
        try {
          const parsed = noteParser.parseNote(html, path)
          const bodyText = extractBodyText(html)
          noteData.set(parsed.id, { index: parsed, bodyText })
        } catch {
          // Skip problematic files
        }

        if ((i + 1) % 5 === 0 || i === total - 1) {
          postProgress(i + 1, total, 'parsing')
        }
      }

      postProgress(total, total, 'indexing')
      await searchIndexer.build(noteData)
      const serialized = await searchIndexer.serialize()
      const buf = new Uint8Array(serialized)

      parentPort?.postMessage(
        {
          type: 'complete',
          serialized: buf,
          noteCount: searchIndexer.getDocumentCount(),
        },
        { transfer: [buf.buffer] }
      )
    } else if (msg.type === 'update') {
      const { path, html, action } = msg

      if (action === 'unlink') {
        await searchIndexer.removeDocument(path)
        parentPort?.postMessage({ type: 'updated', path })
        return
      }

      const parsed = noteParser.parseNote(html, path)
      const bodyText = extractBodyText(html)

      if (action === 'add') {
        await searchIndexer.addDocument(path, parsed, bodyText)
      } else {
        await searchIndexer.updateDocument(path, parsed, bodyText)
      }

      parentPort?.postMessage({ type: 'updated', path })
    }
  } catch (err) {
    parentPort?.postMessage({
      type: 'error',
      error: err instanceof Error ? err.message : String(err),
    })
  }
})
