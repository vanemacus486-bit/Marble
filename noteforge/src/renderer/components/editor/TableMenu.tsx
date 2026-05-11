import type { Editor } from '@tiptap/react'

interface TableMenuProps {
  editor: Editor | null
}

export default function TableMenu({ editor }: TableMenuProps) {
  if (!editor || !editor.isActive('table')) return null

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-1 shadow-lg">
      <button
        className="rounded px-1.5 py-0.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
        onClick={() => editor.chain().focus().addColumnBefore().run()}
        title="Add column before"
      >
        +← Col
      </button>
      <button
        className="rounded px-1.5 py-0.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        title="Add column after"
      >
        +→ Col
      </button>
      <button
        className="rounded px-1.5 py-0.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
        onClick={() => editor.chain().focus().deleteColumn().run()}
        title="Delete column"
      >
        − Col
      </button>
      <div className="mx-0.5 h-4 w-px bg-[var(--color-border)]" />
      <button
        className="rounded px-1.5 py-0.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
        onClick={() => editor.chain().focus().addRowBefore().run()}
        title="Add row before"
      >
        +↑ Row
      </button>
      <button
        className="rounded px-1.5 py-0.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
        onClick={() => editor.chain().focus().addRowAfter().run()}
        title="Add row after"
      >
        +↓ Row
      </button>
      <button
        className="rounded px-1.5 py-0.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
        onClick={() => editor.chain().focus().deleteRow().run()}
        title="Delete row"
      >
        − Row
      </button>
      <div className="mx-0.5 h-4 w-px bg-[var(--color-border)]" />
      <button
        className="rounded px-1.5 py-0.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        onClick={() => editor.chain().focus().deleteTable().run()}
        title="Delete table"
      >
        ✕ Table
      </button>
    </div>
  )
}
