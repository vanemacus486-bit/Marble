interface ReadOnlyViewProps {
  content: string
}

export default function ReadOnlyView({ content }: ReadOnlyViewProps) {
  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '32px 80px 60px' }}>
      <style>{`
        .readonly-body {
          font-family: var(--f-text);
          font-size: 14.5px;
          color: var(--m-fg);
          line-height: 1.65;
        }
        .readonly-body h1 {
          font-size: 30px;
          font-weight: 600;
          margin: 8px 0 6px;
          letter-spacing: -0.018em;
          line-height: 1.15;
        }
        .readonly-body h2 {
          font-size: 18px;
          font-weight: 600;
          margin-top: 24px;
          margin-bottom: 4px;
          letter-spacing: -0.01em;
        }
        .readonly-body a {
          color: var(--m-vein);
          text-decoration: underline;
          text-decoration-color: var(--m-vein-dim);
          text-underline-offset: 3px;
        }
        .readonly-body code {
          font-family: var(--f-mono);
          font-size: 0.88em;
          background: var(--m-bg-2);
          color: var(--c-cyan);
          padding: 1px 6px;
          border-radius: 4px;
        }
        .readonly-body img { max-width: 100%; }
        .readonly-body table { width: 100%; }
        .readonly-body pre { overflow-x: auto; }
      `}</style>
      <div
        className="readonly-body"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  )
}
