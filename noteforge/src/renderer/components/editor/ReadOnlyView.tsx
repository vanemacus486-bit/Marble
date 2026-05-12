interface ReadOnlyViewProps {
  content: string
}

export default function ReadOnlyView({ content }: ReadOnlyViewProps) {
  return (
    <div className="h-full overflow-y-auto px-6 py-4">
      <div
        className="prose prose-lg max-w-none focus:outline-none [&_img]:max-w-full [&_table]:w-full [&_pre]:overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  )
}
