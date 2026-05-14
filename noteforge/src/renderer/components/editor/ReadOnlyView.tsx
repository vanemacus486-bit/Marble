import DynamicPreview from './DynamicPreview'

interface ReadOnlyViewProps {
  content: string
}

export default function ReadOnlyView({ content }: ReadOnlyViewProps) {
  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '32px 80px 60px', background: 'var(--m-bg-page)' }}>
      <DynamicPreview html={content} allowScripts={false} />
    </div>
  )
}
