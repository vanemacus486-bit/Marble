import { useTranslation } from 'react-i18next'
import type { Editor } from '@tiptap/react'
import { useEditorStore } from '../../stores/editor-store'
import { getEffectiveShortcut, formatShortcutKeys } from '../../config/shortcuts'

interface EditorToolbarProps {
  editor: Editor | null
}

interface ToolbarButton {
  label: string
  labelKey: string
  icon: string
  action: () => void
  isActive?: () => boolean
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  const { t } = useTranslation()
  if (!editor) return null

  const editorStore = useEditorStore

  const saveShortcut = getEffectiveShortcut('save')
  const findShortcut = getEffectiveShortcut('find')

  const toolbarButtons: ToolbarButton[][] = [
    [
      {
        label: 'Save', labelKey: 'editor.save', icon: '💾',
        action: () => {
          const tab = editorStore.getState().activeTab()
          if (tab) editorStore.getState().saveNote(tab.id)
        },
      },
      {
        label: 'Find', labelKey: 'editor.find', icon: '🔍',
        action: () => editorStore.getState().showFindReplace(),
      },
    ],
    [
      {
        label: t('editor.bold'), labelKey: 'editor.bold', icon: 'B',
        action: () => editor.chain().focus().toggleBold().run(),
        isActive: () => editor.isActive('bold'),
      },
      {
        label: t('editor.italic'), labelKey: 'editor.italic', icon: 'I',
        action: () => editor.chain().focus().toggleItalic().run(),
        isActive: () => editor.isActive('italic'),
      },
      {
        label: t('editor.underline'), labelKey: 'editor.underline', icon: 'U',
        action: () => editor.chain().focus().toggleUnderline().run(),
        isActive: () => editor.isActive('underline'),
      },
      {
        label: t('editor.strikethrough'), labelKey: 'editor.strikethrough', icon: 'S',
        action: () => editor.chain().focus().toggleStrike().run(),
        isActive: () => editor.isActive('strike'),
      },
      {
        label: t('editor.highlight'), labelKey: 'editor.highlight', icon: 'H',
        action: () => editor.chain().focus().toggleHighlight().run(),
        isActive: () => editor.isActive('highlight'),
      },
    ],
    [
      {
        label: t('editor.h1'), labelKey: 'editor.h1', icon: 'H1',
        action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        isActive: () => editor.isActive('heading', { level: 1 }),
      },
      {
        label: t('editor.h2'), labelKey: 'editor.h2', icon: 'H2',
        action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        isActive: () => editor.isActive('heading', { level: 2 }),
      },
      {
        label: t('editor.h3'), labelKey: 'editor.h3', icon: 'H3',
        action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        isActive: () => editor.isActive('heading', { level: 3 }),
      },
    ],
    [
      {
        label: t('editor.bulletList'), labelKey: 'editor.bulletList', icon: '•',
        action: () => editor.chain().focus().toggleBulletList().run(),
        isActive: () => editor.isActive('bulletList'),
      },
      {
        label: t('editor.orderedList'), labelKey: 'editor.orderedList', icon: '1.',
        action: () => editor.chain().focus().toggleOrderedList().run(),
        isActive: () => editor.isActive('orderedList'),
      },
      {
        label: t('editor.taskList'), labelKey: 'editor.taskList', icon: '☑',
        action: () => editor.chain().focus().toggleTaskList().run(),
        isActive: () => editor.isActive('taskList'),
      },
      {
        label: t('editor.blockquote'), labelKey: 'editor.blockquote', icon: '“',
        action: () => editor.chain().focus().toggleBlockquote().run(),
        isActive: () => editor.isActive('blockquote'),
      },
      {
        label: t('editor.codeBlock'), labelKey: 'editor.codeBlock', icon: '<>',
        action: () => editor.chain().focus().toggleCodeBlock().run(),
        isActive: () => editor.isActive('codeBlock'),
      },
    ],
    [
      {
        label: t('editor.table'), labelKey: 'editor.table', icon: '⊞',
        action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
      },
      {
        label: t('editor.link'), labelKey: 'editor.link', icon: '🔗',
        action: () => {
          const url = window.prompt(t('editor.urlPrompt'))
          if (url) editor.chain().focus().setLink({ href: url }).run()
        },
        isActive: () => editor.isActive('link'),
      },
      {
        label: t('editor.image'), labelKey: 'editor.image', icon: '🖼',
        action: () => {
          const url = window.prompt(t('editor.imageUrlPrompt'))
          if (url) editor.chain().focus().setImage({ src: url }).run()
        },
      },
      {
        label: t('editor.horizontalRule'), labelKey: 'editor.horizontalRule', icon: '—',
        action: () => editor.chain().focus().setHorizontalRule().run(),
      },
    ],
    [
      {
        label: t('editor.undo'), labelKey: 'editor.undo', icon: '↩',
        action: () => editor.chain().focus().undo().run(),
      },
      {
        label: t('editor.redo'), labelKey: 'editor.redo', icon: '↪',
        action: () => editor.chain().focus().redo().run(),
      },
    ],
  ]

  const getTooltip = (btn: ToolbarButton): string => {
    if (btn.labelKey === 'editor.save' && saveShortcut) {
      return `${btn.label} (${formatShortcutKeys(saveShortcut)})`
    }
    if (btn.labelKey === 'editor.find' && findShortcut) {
      return `${btn.label} (${formatShortcutKeys(findShortcut)})`
    }
    return btn.label
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-1">
      {toolbarButtons.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5">
          {gi > 0 && <div className="mx-1 h-5 w-px bg-[var(--color-border)]" />}
          {group.map((btn) => (
            <button
              key={btn.labelKey}
              className={`rounded px-1.5 py-1 text-xs transition-colors ${
                btn.isActive?.()
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
              }`}
              onClick={btn.action}
              title={getTooltip(btn)}
            >
              {btn.icon}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
