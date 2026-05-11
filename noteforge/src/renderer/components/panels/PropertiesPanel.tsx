import NoteProperties from '../vault/NoteProperties'

export default function PropertiesPanel() {
  return (
    <div className="flex flex-col">
      <div className="border-b border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)]">
        Properties
      </div>
      <NoteProperties />
    </div>
  )
}
