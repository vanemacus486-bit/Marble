import { useState, useCallback } from 'react'
import { useEditorStore } from '../../stores/editor-store'

export default function FindReplace() {
  const hideFindReplace = useEditorStore((s) => s.hideFindReplace)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [showReplace, setShowReplace] = useState(false)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [useRegex, setUseRegex] = useState(false)

  const handleFind = useCallback(() => {
    if (!findText) return
    try {
      const activeTab = useEditorStore.getState().activeTab()
      if (!activeTab?.content) return

      const content = activeTab.content
      let searchText = findText
      if (!useRegex) {
        searchText = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      }
      const flags = caseSensitive ? 'g' : 'gi'
      const regex = new RegExp(searchText, flags)
      const bodyContent = content.replace(/<[^>]+>/g, '')
      const matches = bodyContent.match(regex)
      const count = matches?.length ?? 0

      if (count === 0) {
        useEditorStore.getState().addToast?.('No matches found', 'info')
      }
    } catch {
      // Invalid regex
    }
  }, [findText, caseSensitive, useRegex])

  const handleReplace = useCallback(() => {
    const activeTab = useEditorStore.getState().activeTab()
    if (!activeTab?.content) return

    // Simple replace in HTML content
    const newContent = activeTab.content.replace(
      new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive ? 'g' : 'gi'),
      replaceText
    )
    useEditorStore.getState().setContent(activeTab.id, newContent)
  }, [findText, replaceText, caseSensitive])

  return (
    <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1.5">
      <div className="flex items-center gap-1">
        <input
          className="w-40 rounded border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2 py-0.5 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          placeholder="Find..."
          value={findText}
          onChange={(e) => setFindText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleFind() }}
        />
        {showReplace && (
          <input
            className="w-40 rounded border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2 py-0.5 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
            placeholder="Replace..."
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
          />
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          className="rounded px-2 py-0.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
          onClick={handleFind}
        >
          Find
        </button>
        {showReplace && (
          <button
            className="rounded px-2 py-0.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
            onClick={handleReplace}
          >
            Replace All
          </button>
        )}
        <button
          className="rounded px-2 py-0.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
          onClick={() => setShowReplace(!showReplace)}
        >
          {showReplace ? '− Replace' : '+ Replace'}
        </button>
        <button
          className={`rounded px-2 py-0.5 text-xs ${caseSensitive ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'}`}
          onClick={() => setCaseSensitive(!caseSensitive)}
        >
          Aa
        </button>
        <button
          className={`rounded px-2 py-0.5 text-xs ${useRegex ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'}`}
          onClick={() => setUseRegex(!useRegex)}
        >
          .*
        </button>
      </div>
      <button
        className="ml-auto rounded p-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        onClick={hideFindReplace}
      >
        ✕
      </button>
    </div>
  )
}
