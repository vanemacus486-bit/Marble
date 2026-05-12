import { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import FontFamily from '@tiptap/extension-font-family'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { useEditorStore } from '../../stores/editor-store'
import FloatingToolbar from './FloatingToolbar'

const lowlight = createLowlight(common)

interface EditorWrapperProps {
  tabId: string
  content: string
  editMode: 'source' | 'wysiwyg' | 'read'
  onSync?: (html: string) => void
  onEditorReady?: (editor: ReturnType<typeof useEditor>) => void
}

export default function EditorWrapper({ tabId, content, editMode, onSync, onEditorReady }: EditorWrapperProps) {
  const setContent = useEditorStore((s) => s.setContent)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: { rel: 'noopener noreferrer' },
      }),
      Image.configure({ inline: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Highlight,
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      FontFamily,
      Subscript,
      Superscript,
      Placeholder.configure({ placeholder: 'Start writing...' }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      setContent(tabId, html)
      onSync?.(html)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none',
        style: 'font-family: var(--f-text);',
      },
    },
  })

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor)
    }
  }, [editor, onEditorReady])

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) return null

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '32px 80px', background: 'transparent' }}>
      <style>{`
        .ProseMirror ::selection { background: var(--m-vein-bg); }
        .ProseMirror code { font-family: var(--f-mono); }
      `}</style>
      <EditorContent editor={editor} style={{ minHeight: '100%' }} />
      <FloatingToolbar editor={editor} />
    </div>
  )
}
