import { useEffect, useCallback } from 'react'
import type { Editor } from '@tiptap/react'

interface ImageUploaderProps {
  editor: Editor | null
}

export default function ImageUploader({ editor }: ImageUploaderProps) {
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (!editor) return
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (!file) continue

          const reader = new FileReader()
          reader.onload = () => {
            const dataUrl = reader.result as string
            editor.chain().focus().setImage({ src: dataUrl }).run()
          }
          reader.readAsDataURL(file)
          break
        }
      }
    },
    [editor]
  )

  useEffect(() => {
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [handlePaste])

  return null
}
