import type { SearchResult } from '../../types'

interface SearchResultItemProps {
  result: SearchResult
  isSelected: boolean
  onClick: () => void
}

export default function SearchResultItem({ result, isSelected, onClick }: SearchResultItemProps) {
  const highlightText = (text: string, maxLen = 200): string => {
    return text.length > maxLen ? text.substring(0, maxLen) + '...' : text
  }

  return (
    <button
      className={`w-full px-3 py-2 text-left transition-colors ${
        isSelected
          ? 'bg-[var(--color-accent)] text-white'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
      }`}
      onClick={onClick}
    >
      <div
        className={`text-sm font-medium ${
          isSelected ? 'text-white' : 'text-[var(--color-text-primary)]'
        }`}
      >
        {result.title}
        {result.matchType === 'title' && (
          <span
            className={`ml-1.5 text-xs ${
              isSelected ? 'text-white/70' : 'text-[var(--color-accent)]'
            }`}
          >
            (title match)
          </span>
        )}
      </div>
      {result.path !== result.title && (
        <div
          className={`mt-0.5 truncate text-xs ${
            isSelected ? 'text-white/60' : 'text-[var(--color-text-muted)]'
          }`}
        >
          {result.path}
        </div>
      )}
      {result.snippet && (
        <div
          className={`mt-1 line-clamp-2 text-xs leading-relaxed ${
            isSelected ? 'text-white/70' : 'text-[var(--color-text-muted)]'
          }`}
        >
          {highlightText(result.snippet)}
        </div>
      )}
    </button>
  )
}
