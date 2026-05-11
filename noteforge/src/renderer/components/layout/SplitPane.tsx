import { type ReactNode, useRef, useCallback } from 'react'
import { useEditorStore } from '../../stores/editor-store'

interface SplitPaneProps {
  paneId: string
  orientation: 'horizontal' | 'vertical'
  sizes: number[]
  children: ReactNode[]
}

export default function SplitPane({ paneId, orientation, sizes, children }: SplitPaneProps) {
  const resizeSplit = useEditorStore((s) => s.resizeSplit)
  const dividerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const startPos = orientation === 'horizontal' ? e.clientX : e.clientY
      const containerSize =
        orientation === 'horizontal'
          ? dividerRef.current?.parentElement?.offsetWidth ?? 1
          : dividerRef.current?.parentElement?.offsetHeight ?? 1

      const handleMouseMove = (e: MouseEvent) => {
        const delta = (orientation === 'horizontal' ? e.clientX : e.clientY) - startPos
        const deltaPercent = (delta / containerSize) * 100
        const newSizes = [Math.max(10, sizes[0] + deltaPercent), Math.max(10, sizes[1] - deltaPercent)]
        resizeSplit(paneId, newSizes)
      }

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [orientation, sizes, resizeSplit, paneId]
  )

  const isHorizontal = orientation === 'horizontal'

  return (
    <div
      className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} h-full w-full`}
    >
      {children.map((child, i) => (
        <div key={i} style={{ [isHorizontal ? 'width' : 'height']: `${sizes[i]}%` }}>
          {i > 0 && (
            <div
              ref={i === 1 ? dividerRef : undefined}
              className={`${
                isHorizontal
                  ? 'w-1 cursor-col-resize hover:bg-[var(--color-accent)]'
                  : 'h-1 cursor-row-resize hover:bg-[var(--color-accent)]'
              } bg-[var(--color-border)] transition-colors`}
              onMouseDown={handleMouseDown}
            />
          )}
          {child}
        </div>
      ))}
    </div>
  )
}
