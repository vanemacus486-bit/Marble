import { useEffect, useRef, useCallback } from 'react'
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { html } from '@codemirror/lang-html'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { search, searchKeymap } from '@codemirror/search'
import { foldGutter, foldKeymap } from '@codemirror/language'
import type { EditorSyncManager } from '../../editor/EditorSyncManager'

interface SourceEditorProps {
  content: string
  onChange: (content: string) => void
  syncManager?: EditorSyncManager | null
}

const debounce = <T extends (...args: any[]) => void>(fn: T, ms: number) => {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

export default function SourceEditor({ content, onChange, syncManager }: SourceEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const syncingRef = useRef(false)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const debouncedOnChange = useCallback(
    debounce((value: string) => {
      onChangeRef.current(value)
    }, 250),
    []
  )

  useEffect(() => {
    if (!containerRef.current) return

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && !syncingRef.current) {
        const value = update.state.doc.toString()
        debouncedOnChange(value)
      }
    })

    const view = new EditorView({
      state: EditorState.create({
        doc: content,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          drawSelection(),
          foldGutter(),
          html(),
          history(),
          search({ top: true }),
          keymap.of([
            ...defaultKeymap,
            ...historyKeymap,
            ...searchKeymap,
            ...foldKeymap,
            indentWithTab,
          ]),
          updateListener,
          EditorView.theme({
            '&': {
              height: '100%',
              fontSize: '14px',
              fontFamily: 'var(--f-mono, "Fira Code", "Cascadia Code", Consolas, monospace)',
              backgroundColor: 'var(--m-bg-inset)',
            },
            '.cm-scroller': {
              overflow: 'auto',
              lineHeight: '1.6',
            },
            '.cm-content': {
              padding: '16px',
              caretColor: 'var(--m-vein)',
              color: 'var(--m-fg-1)',
            },
            '.cm-gutters': {
              borderRight: '1px solid var(--m-line)',
              backgroundColor: 'transparent',
              color: 'var(--m-fg-3)',
            },
            '.cm-activeLine': {
              backgroundColor: 'var(--m-bg-2)',
            },
            '.cm-selectionBackground, ::selection': {
              backgroundColor: 'var(--m-vein-bg) !important',
            },
            '.cm-cursor': {
              borderLeftColor: 'var(--m-vein)',
            },
            '.cm-searchMatch': {
              backgroundColor: 'var(--m-vein-bg)',
              outline: '1px solid var(--m-vein-dim)',
            },
          }),
        ],
      }),
      parent: containerRef.current,
    })

    viewRef.current = view

    if (syncManager) {
      syncManager.registerSource(view)
    }

    return () => {
      if (syncManager) {
        syncManager.registerSource(null as any)
      }
      view.destroy()
      viewRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!viewRef.current) return
    const currentContent = viewRef.current.state.doc.toString()
    if (content !== currentContent) {
      syncingRef.current = true
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: content,
        },
      })
      syncingRef.current = false
    }
  }, [content])

  return (
    <div
      ref={containerRef}
      style={{ height: '100%', width: '100%', overflow: 'hidden', background: 'var(--m-bg-inset)' }}
    />
  )
}
