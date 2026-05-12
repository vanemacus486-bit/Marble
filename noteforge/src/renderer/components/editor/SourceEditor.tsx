import { useEffect, useRef, useCallback } from 'react'
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { html } from '@codemirror/lang-html'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { search, searchKeymap } from '@codemirror/search'
import { foldGutter, foldKeymap } from '@codemirror/language'
import { oneDark } from '@codemirror/theme-one-dark'
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

  const debouncedOnChange = useCallback(
    debounce((value: string) => {
      onChange(value)
    }, 250),
    [onChange]
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
              fontFamily: 'var(--font-mono, "Fira Code", "Cascadia Code", Consolas, monospace)',
            },
            '.cm-scroller': {
              overflow: 'auto',
              lineHeight: '1.6',
            },
            '.cm-content': {
              padding: '16px',
              caretColor: 'var(--color-accent, #2196f3)',
            },
            '.cm-gutters': {
              borderRight: '1px solid var(--color-border, #333)',
              backgroundColor: 'var(--color-bg-secondary, #1e1e1e)',
              color: 'var(--color-text-muted, #666)',
            },
            '.cm-activeLine': {
              backgroundColor: 'var(--color-bg-tertiary, rgba(255,255,255,0.05))',
            },
            '.cm-selectionBackground, ::selection': {
              backgroundColor: 'var(--color-accent-muted, rgba(33,150,243,0.3)) !important',
            },
            '.cm-cursor': {
              borderLeftColor: 'var(--color-accent, #2196f3)',
            },
            '.cm-searchMatch': {
              backgroundColor: 'var(--color-accent-muted, rgba(33,150,243,0.2))',
              outline: '1px solid var(--color-accent, #2196f3)',
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
      className="h-full w-full overflow-hidden bg-[var(--color-bg-primary)]"
    />
  )
}
