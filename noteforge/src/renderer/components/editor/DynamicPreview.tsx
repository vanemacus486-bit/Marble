import { useRef, useEffect } from 'react'
import { sanitizeHtml, sanitizeHtmlDynamic } from '../../utils/sanitizer'

interface DynamicPreviewProps {
  html: string
  className?: string
  allowScripts?: boolean
}

const CSS_VAR_NAMES = [
  '--color-bg-primary', '--color-bg-secondary', '--color-bg-tertiary',
  '--color-text-primary', '--color-text-secondary', '--color-text-muted',
  '--color-border', '--color-accent', '--color-link',
  '--font-sans', '--font-mono',
  '--radius-sm', '--radius-md',
]

function collectCssVars(): string {
  const computed = getComputedStyle(document.documentElement)
  return CSS_VAR_NAMES
    .map((v) => `${v}: ${computed.getPropertyValue(v).trim()}`)
    .filter((s) => !s.endsWith(': '))
    .join(';')
}

function wrapHtml(content: string, cssVars: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  :root { ${cssVars} }
  body {
    font-family: var(--font-sans, system-ui, sans-serif);
    color: var(--color-text-primary, #212529);
    line-height: 1.6;
    margin: 0;
    padding: 8px;
  }
  img { max-width: 100%; height: auto; }
  a { color: var(--color-link, #1c7ed6); }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid var(--color-border, #dee2e6); padding: 8px; text-align: left; }
  pre { background: var(--color-bg-tertiary, #e9ecef); padding: 12px; border-radius: var(--radius-md, 8px); overflow-x: auto; }
  code { font-family: var(--font-mono, monospace); font-size: 0.9em; }
  blockquote { border-left: 3px solid var(--color-accent, #7950f2); margin: 0; padding-left: 16px; color: var(--color-text-secondary, #495057); }
</style>
</head>
<body>
${content}
</body>
</html>`
}

export default function DynamicPreview({ html, className, allowScripts = true }: DynamicPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!html) {
      if (iframeRef.current) {
        iframeRef.current.srcdoc = ''
      }
      return
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      const sanitized = allowScripts ? sanitizeHtmlDynamic(html) : sanitizeHtml(html)
      const framed = wrapHtml(sanitized, collectCssVars())
      if (iframeRef.current) {
        iframeRef.current.srcdoc = framed
      }
    }, 500)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [html, allowScripts])

  const sandboxAttr = allowScripts ? 'allow-scripts' : ''

  return (
    <iframe
      ref={iframeRef}
      sandbox={sandboxAttr}
      title={allowScripts ? 'Dynamic Preview' : 'Preview'}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        background: '#fff',
      }}
    />
  )
}
