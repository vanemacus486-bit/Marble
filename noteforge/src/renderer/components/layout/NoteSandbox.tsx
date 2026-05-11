import { useRef, useEffect } from 'react'
import { sanitizeHtml } from '../../utils/sanitizer'

interface NoteSandboxProps {
  html: string
  className?: string
}

export default function NoteSandbox({ html, className }: NoteSandboxProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const shadowRootRef = useRef<ShadowRoot | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    if (!shadowRootRef.current) {
      shadowRootRef.current = containerRef.current.attachShadow({
        mode: 'closed',
      })
    }

    const root = shadowRootRef.current
    const computed = getComputedStyle(document.documentElement)

    const cssVars = [
      '--color-bg-primary', '--color-bg-secondary', '--color-bg-tertiary',
      '--color-text-primary', '--color-text-secondary', '--color-text-muted',
      '--color-border', '--color-accent', '--color-link', '--font-sans', '--font-mono',
      '--radius-sm', '--radius-md',
    ]
      .map((v) => `${v}: ${computed.getPropertyValue(v).trim()}`)
      .join(';')

    const sanitized = sanitizeHtml(html)

    root.innerHTML = `
      <style>
        :host {
          all: initial;
          display: block;
          ${cssVars}
          font-family: var(--font-sans, system-ui, sans-serif);
          color: var(--color-text-primary, #212529);
          line-height: 1.6;
        }
        img { max-width: 100%; height: auto; }
        a { color: var(--color-link, #1c7ed6); }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid var(--color-border, #dee2e6); padding: 8px; text-align: left; }
        pre { background: var(--color-bg-tertiary, #e9ecef); padding: 12px; border-radius: var(--radius-md, 8px); overflow-x: auto; }
        code { font-family: var(--font-mono, monospace); font-size: 0.9em; }
        blockquote { border-left: 3px solid var(--color-accent, #7950f2); margin: 0; padding-left: 16px; color: var(--color-text-secondary, #495057); }
      </style>
      ${sanitized}
    `
  }, [html])

  return <div ref={containerRef} className={className} />
}
