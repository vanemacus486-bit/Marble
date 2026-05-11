import { useEffect, useRef } from 'react'

interface SourceEditorProps {
  content: string
  onChange: (content: string) => void
}

export default function SourceEditor({ content, onChange }: SourceEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Basic source mode using a textarea with monospace font
  // Full CodeMirror integration would be done in a future phase
  return (
    <textarea
      ref={textareaRef}
      className="h-full w-full resize-none bg-[var(--color-bg-primary)] p-6 font-mono text-sm text-[var(--color-text-primary)] focus:outline-none"
      value={content}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      placeholder="<h1>Your HTML here</h1>"
    />
  )
}
