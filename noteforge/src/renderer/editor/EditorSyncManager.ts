import type { Editor } from '@tiptap/core'
import type { EditorView } from '@codemirror/view'

interface SyncState {
  tipTapEditor: Editor | null
  codeMirrorView: EditorView | null
  lastSyncedContent: string
  syncing: boolean
  paused: boolean
}

export class EditorSyncManager {
  private state: SyncState = {
    tipTapEditor: null,
    codeMirrorView: null,
    lastSyncedContent: '',
    syncing: false,
    paused: false,
  }

  registerWysiwyg(editor: Editor): void {
    this.state.tipTapEditor = editor
  }

  registerSource(view: EditorView): void {
    this.state.codeMirrorView = view
  }

  /** Push WYSIWYG change to source editor */
  syncWysiwygToSource(html: string): void {
    if (this.state.paused || this.state.syncing) return
    if (html === this.state.lastSyncedContent) return

    const cm = this.state.codeMirrorView
    if (!cm) return

    this.state.syncing = true
    this.state.lastSyncedContent = html

    cm.dispatch({
      changes: { from: 0, to: cm.state.doc.length, insert: html },
    })

    this.state.syncing = false
  }

  /** Push source editor change to WYSIWYG */
  syncSourceToWysiwyg(html: string): void {
    if (this.state.paused || this.state.syncing) return
    if (html === this.state.lastSyncedContent) return

    const tt = this.state.tipTapEditor
    if (!tt) return

    this.state.syncing = true
    this.state.lastSyncedContent = html

    tt.commands.setContent(html, false)

    this.state.syncing = false
  }

  pause(): void {
    this.state.paused = true
  }

  resume(): void {
    this.state.paused = false
  }

  getLastSyncedContent(): string {
    return this.state.lastSyncedContent
  }

  isPaused(): boolean {
    return this.state.paused
  }

  destroy(): void {
    this.state.tipTapEditor = null
    this.state.codeMirrorView = null
    this.state.lastSyncedContent = ''
    this.state.syncing = false
    this.state.paused = false
  }
}
