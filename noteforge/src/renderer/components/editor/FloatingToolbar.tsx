import { useState, useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { Bold, Italic, Underline, Palette, RemoveFormatting } from 'lucide-react'

interface FloatingToolbarProps {
  editor: Editor | null
}

export default function FloatingToolbar({ editor }: FloatingToolbarProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editor) return

    const updatePosition = () => {
      const { from, to, empty } = editor.state.selection
      if (empty || from === to) {
        setPosition(null)
        setShowColorPicker(false)
        return
      }

      const { view } = editor
      const start = view.coordsAtPos(from)
      const end = view.coordsAtPos(to)
      const x = (start.left + end.right) / 2
      const y = start.top - 44

      setPosition({ x, y })
    }

    editor.on('selectionUpdate', updatePosition)
    editor.on('blur', () => {
      // Delay to allow clicking toolbar buttons
      setTimeout(() => {
        if (!toolbarRef.current?.contains(document.activeElement)) {
          setPosition(null)
          setShowColorPicker(false)
        }
      }, 200)
    })

    return () => {
      editor.off('selectionUpdate', updatePosition)
    }
  }, [editor])

  if (!position || !editor) return null

  const setFontSize = (size: string) => {
    editor.chain().focus().setFontSize(size).run()
  }

  const setColor = (color: string) => {
    editor.chain().focus().setColor(color).run()
  }

  const setBgColor = (color: string) => {
    editor.chain().focus().setHighlight({ color }).run()
  }

  const colors = ['#000000', '#e03131', '#2f9e44', '#1c7ed6', '#7950f2', '#f08c00', '#868e96', '#ffffff']
  const fontSizes = [
    { label: 'XS', value: '12px' },
    { label: 'S', value: '14px' },
    { label: 'M', value: '16px' },
    { label: 'L', value: '20px' },
    { label: 'XL', value: '24px' },
  ]

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 -translate-x-1/2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-1.5 py-1 shadow-xl"
      style={{ left: position.x, top: position.y }}
    >
      <div className="flex items-center gap-0.5">
        {/* Font size buttons */}
        {fontSizes.map((fs) => (
          <button
            key={fs.value}
            className="rounded px-1.5 py-0.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
            onClick={() => setFontSize(fs.value)}
            title={fs.label}
          >
            {fs.label}
          </button>
        ))}

        <div className="mx-0.5 h-5 w-px bg-[var(--color-border)]" />

        {/* Quick style toggles */}
        <button className="rounded p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]" onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button className="rounded p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]" onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button className="rounded p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]" onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
          <Underline className="h-3.5 w-3.5" />
        </button>

        <div className="mx-0.5 h-5 w-px bg-[var(--color-border)]" />

        {/* Color picker toggle */}
        <button
          className={`rounded p-1 hover:bg-[var(--color-bg-tertiary)] ${showColorPicker ? 'bg-[var(--color-bg-tertiary)]' : 'text-[var(--color-text-secondary)]'}`}
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Text color"
        >
          <Palette className="h-3.5 w-3.5" />
        </button>

        {/* Clear formatting */}
        <button className="rounded p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]" onClick={() => editor.chain().focus().unsetAllMarks().run()} title="Clear formatting">
          <RemoveFormatting className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Color picker popup */}
      {showColorPicker && (
        <div className="mt-1.5 border-t border-[var(--color-border)] pt-1.5">
          <div className="mb-1 text-[10px] font-medium text-[var(--color-text-muted)]">Text</div>
          <div className="flex gap-1">
            {colors.map((c) => (
              <button
                key={`text-${c}`}
                className="h-5 w-5 rounded-full border border-[var(--color-border)]"
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <div className="mb-1 mt-1.5 text-[10px] font-medium text-[var(--color-text-muted)]">Background</div>
          <div className="flex gap-1">
            {colors.map((c) => (
              <button
                key={`bg-${c}`}
                className="h-5 w-5 rounded-full border border-[var(--color-border)]"
                style={{ backgroundColor: c }}
                onClick={() => setBgColor(c)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
