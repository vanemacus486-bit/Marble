import type { Editor } from '@tiptap/react'

interface EditorToolbarProps {
  editor: Editor | null
}

interface ToolbarButton {
  label: string
  icon: string
  action: () => void
  isActive?: () => boolean
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null

  const buttons: ToolbarButton[][] = [
    [
      {
        label: 'Bold', icon: 'B',
        action: () => editor.chain().focus().toggleBold().run(),
        isActive: () => editor.isActive('bold'),
      },
      {
        label: 'Italic', icon: 'I',
        action: () => editor.chain().focus().toggleItalic().run(),
        isActive: () => editor.isActive('italic'),
      },
      {
        label: 'Underline', icon: 'U',
        action: () => editor.chain().focus().toggleUnderline().run(),
        isActive: () => editor.isActive('underline'),
      },
      {
        label: 'Strikethrough', icon: 'S',
        action: () => editor.chain().focus().toggleStrike().run(),
        isActive: () => editor.isActive('strike'),
      },
      {
        label: 'Highlight', icon: 'H',
        action: () => editor.chain().focus().toggleHighlight().run(),
        isActive: () => editor.isActive('highlight'),
      },
    ],
    [
      {
        label: 'H1', icon: 'H1',
        action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        isActive: () => editor.isActive('heading', { level: 1 }),
      },
      {
        label: 'H2', icon: 'H2',
        action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        isActive: () => editor.isActive('heading', { level: 2 }),
      },
      {
        label: 'H3', icon: 'H3',
        action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        isActive: () => editor.isActive('heading', { level: 3 }),
      },
    ],
    [
      {
        label: 'Bullet List', icon: '•',
        action: () => editor.chain().focus().toggleBulletList().run(),
        isActive: () => editor.isActive('bulletList'),
      },
      {
        label: 'Ordered List', icon: '1.',
        action: () => editor.chain().focus().toggleOrderedList().run(),
        isActive: () => editor.isActive('orderedList'),
      },
      {
        label: 'Task List', icon: '☑',
        action: () => editor.chain().focus().toggleTaskList().run(),
        isActive: () => editor.isActive('taskList'),
      },
      {
        label: 'Blockquote', icon: '"',
        action: () => editor.chain().focus().toggleBlockquote().run(),
        isActive: () => editor.isActive('blockquote'),
      },
      {
        label: 'Code Block', icon: '<>',
        action: () => editor.chain().focus().toggleCodeBlock().run(),
        isActive: () => editor.isActive('codeBlock'),
      },
    ],
    [
      {
        label: 'Table', icon: '⊞',
        action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
      },
      {
        label: 'Link', icon: '🔗',
        action: () => {
          const url = window.prompt('URL:')
          if (url) editor.chain().focus().setLink({ href: url }).run()
        },
        isActive: () => editor.isActive('link'),
      },
      {
        label: 'Image', icon: '🖼',
        action: () => {
          const url = window.prompt('Image URL:')
          if (url) editor.chain().focus().setImage({ src: url }).run()
        },
      },
      {
        label: 'Horizontal Rule', icon: '—',
        action: () => editor.chain().focus().setHorizontalRule().run(),
      },
    ],
    [
      {
        label: 'Undo', icon: '↩',
        action: () => editor.chain().focus().undo().run(),
      },
      {
        label: 'Redo', icon: '↪',
        action: () => editor.chain().focus().redo().run(),
      },
    ],
  ]

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-1">
      {buttons.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5">
          {gi > 0 && <div className="mx-1 h-5 w-px bg-[var(--color-border)]" />}
          {group.map((btn) => (
            <button
              key={btn.label}
              className={`rounded px-1.5 py-1 text-xs transition-colors ${
                btn.isActive?.()
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
              }`}
              onClick={btn.action}
              title={btn.label}
            >
              {btn.icon}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
