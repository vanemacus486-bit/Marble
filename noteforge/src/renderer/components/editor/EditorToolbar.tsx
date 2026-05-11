import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { Editor } from '@tiptap/react'
import {
  Save,
  Search,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Code2,
  Table,
  Image,
  Link2,
  Minus,
  Undo2,
  Redo2,
} from 'lucide-react'
import { useEditorStore } from '../../stores/editor-store'
import { getEffectiveShortcut, formatShortcutKeys } from '../../config/shortcuts'

interface EditorToolbarProps {
  editor: Editor | null
}

interface ToolbarButton {
  label: string
  labelKey: string
  icon: ReactNode
  action: () => void
  isActive?: () => boolean
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  const { t } = useTranslation()
  if (!editor) return null

  const editorStore = useEditorStore

  const saveShortcut = getEffectiveShortcut('save')
  const findShortcut = getEffectiveShortcut('find')

  const iconCls = 'h-3.5 w-3.5'

  const toolbarButtons: ToolbarButton[][] = [
    [
      {
        label: 'Save', labelKey: 'editor.save', icon: <Save className={iconCls} />,
        action: () => {
          const tab = editorStore.getState().activeTab()
          if (tab) editorStore.getState().saveNote(tab.id)
        },
      },
      {
        label: 'Find', labelKey: 'editor.find', icon: <Search className={iconCls} />,
        action: () => editorStore.getState().showFindReplace(),
      },
    ],
    [
      {
        label: t('editor.bold'), labelKey: 'editor.bold', icon: <Bold className={iconCls} />,
        action: () => editor.chain().focus().toggleBold().run(),
        isActive: () => editor.isActive('bold'),
      },
      {
        label: t('editor.italic'), labelKey: 'editor.italic', icon: <Italic className={iconCls} />,
        action: () => editor.chain().focus().toggleItalic().run(),
        isActive: () => editor.isActive('italic'),
      },
      {
        label: t('editor.underline'), labelKey: 'editor.underline', icon: <Underline className={iconCls} />,
        action: () => editor.chain().focus().toggleUnderline().run(),
        isActive: () => editor.isActive('underline'),
      },
      {
        label: t('editor.strikethrough'), labelKey: 'editor.strikethrough', icon: <Strikethrough className={iconCls} />,
        action: () => editor.chain().focus().toggleStrike().run(),
        isActive: () => editor.isActive('strike'),
      },
      {
        label: t('editor.highlight'), labelKey: 'editor.highlight', icon: <Highlighter className={iconCls} />,
        action: () => editor.chain().focus().toggleHighlight().run(),
        isActive: () => editor.isActive('highlight'),
      },
    ],
    [
      {
        label: t('editor.h1'), labelKey: 'editor.h1', icon: <Heading1 className={iconCls} />,
        action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        isActive: () => editor.isActive('heading', { level: 1 }),
      },
      {
        label: t('editor.h2'), labelKey: 'editor.h2', icon: <Heading2 className={iconCls} />,
        action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        isActive: () => editor.isActive('heading', { level: 2 }),
      },
      {
        label: t('editor.h3'), labelKey: 'editor.h3', icon: <Heading3 className={iconCls} />,
        action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        isActive: () => editor.isActive('heading', { level: 3 }),
      },
    ],
    [
      {
        label: t('editor.bulletList'), labelKey: 'editor.bulletList', icon: <List className={iconCls} />,
        action: () => editor.chain().focus().toggleBulletList().run(),
        isActive: () => editor.isActive('bulletList'),
      },
      {
        label: t('editor.orderedList'), labelKey: 'editor.orderedList', icon: <ListOrdered className={iconCls} />,
        action: () => editor.chain().focus().toggleOrderedList().run(),
        isActive: () => editor.isActive('orderedList'),
      },
      {
        label: t('editor.taskList'), labelKey: 'editor.taskList', icon: <ListTodo className={iconCls} />,
        action: () => editor.chain().focus().toggleTaskList().run(),
        isActive: () => editor.isActive('taskList'),
      },
      {
        label: t('editor.blockquote'), labelKey: 'editor.blockquote', icon: <Quote className={iconCls} />,
        action: () => editor.chain().focus().toggleBlockquote().run(),
        isActive: () => editor.isActive('blockquote'),
      },
      {
        label: t('editor.codeBlock'), labelKey: 'editor.codeBlock', icon: <Code2 className={iconCls} />,
        action: () => editor.chain().focus().toggleCodeBlock().run(),
        isActive: () => editor.isActive('codeBlock'),
      },
    ],
    [
      {
        label: t('editor.table'), labelKey: 'editor.table', icon: <Table className={iconCls} />,
        action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
      },
      {
        label: t('editor.link'), labelKey: 'editor.link', icon: <Link2 className={iconCls} />,
        action: () => {
          const url = window.prompt(t('editor.urlPrompt'))
          if (url) editor.chain().focus().setLink({ href: url }).run()
        },
        isActive: () => editor.isActive('link'),
      },
      {
        label: t('editor.image'), labelKey: 'editor.image', icon: <Image className={iconCls} />,
        action: () => {
          const url = window.prompt(t('editor.imageUrlPrompt'))
          if (url) editor.chain().focus().setImage({ src: url }).run()
        },
      },
      {
        label: t('editor.horizontalRule'), labelKey: 'editor.horizontalRule', icon: <Minus className={iconCls} />,
        action: () => editor.chain().focus().setHorizontalRule().run(),
      },
    ],
    [
      {
        label: t('editor.undo'), labelKey: 'editor.undo', icon: <Undo2 className={iconCls} />,
        action: () => editor.chain().focus().undo().run(),
      },
      {
        label: t('editor.redo'), labelKey: 'editor.redo', icon: <Redo2 className={iconCls} />,
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
