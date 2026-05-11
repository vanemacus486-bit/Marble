interface SearchOperatorsProps {
  onInsert: (operator: string) => void
}

const OPERATORS = [
  { id: 'tag', label: 'tag:', description: 'Filter by tag' },
  { id: 'folder', label: 'folder:', description: 'Filter by folder' },
  { id: 'file', label: 'file:', description: 'Filter by filename' },
  { id: 'path', label: 'path:', description: 'Filter by path' },
  { id: 'title', label: 'title:', description: 'Filter by title' },
] as const

export default function SearchOperators({ onInsert }: SearchOperatorsProps) {
  return (
    <div className="flex flex-wrap gap-1 px-3 pb-2">
      {OPERATORS.map((op) => (
        <button
          key={op.id}
          className="rounded-md bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-accent)] hover:text-white"
          onClick={() => onInsert(op.label)}
          title={op.description}
        >
          {op.label}
        </button>
      ))}
    </div>
  )
}
