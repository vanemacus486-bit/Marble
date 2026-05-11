import { useTranslation } from 'react-i18next'
import { FolderTree, Search, Tags } from 'lucide-react'
import { useUiStore } from '../../stores/ui-store'
import FileExplorer from '../vault/FileExplorer'
import SearchBar from '../search/SearchBar'
import TagPanel from '../panels/TagPanel'

export default function Sidebar() {
  const { t } = useTranslation()
  const tab = useUiStore((s) => s.leftSidebarTab)
  const setTab = useUiStore((s) => s.setLeftSidebarTab)
  const width = useUiStore((s) => s.leftSidebarWidth)

  const tabs = [
    { id: 'explorer' as const, label: t('sidebar.files'), icon: <FolderTree className="h-3.5 w-3.5" /> },
    { id: 'search' as const, label: t('sidebar.search'), icon: <Search className="h-3.5 w-3.5" /> },
    { id: 'tags' as const, label: t('sidebar.tags'), icon: <Tags className="h-3.5 w-3.5" /> },
  ]

  return (
    <div
      className="flex flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)]"
      style={{ width }}
    >
      <div className="flex border-b border-[var(--color-border)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              tab === t.id
                ? 'border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
            onClick={() => setTab(t.id)}
            title={t.label}
          >
            <span className="mr-1">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === 'explorer' && <FileExplorer />}
        {tab === 'search' && <SearchBar />}
        {tab === 'tags' && <TagPanel />}
      </div>
    </div>
  )
}
