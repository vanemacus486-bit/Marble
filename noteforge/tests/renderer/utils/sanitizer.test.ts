import { describe, it, expect } from 'vitest'
import { sanitizePastedHtml, sanitizeHtml } from '../../../src/renderer/utils/sanitizer'

describe('sanitizer', () => {
  describe('sanitizePastedHtml', () => {
    it('removes script tags', () => {
      const result = sanitizePastedHtml('<p>Hello</p><script>alert("xss")</script>')
      expect(result).not.toContain('<script')
      expect(result).not.toContain('alert')
      expect(result).toContain('<p>Hello</p>')
    })

    it('removes event handlers', () => {
      const result = sanitizePastedHtml('<div onclick="alert(1)">Content</div>')
      expect(result).not.toContain('onclick')
      expect(result).toContain('Content')
    })

    it('removes iframe tags on paste', () => {
      const result = sanitizePastedHtml('<iframe src="evil.com"></iframe>')
      expect(result).not.toContain('iframe')
    })

    it('removes font tags', () => {
      const result = sanitizePastedHtml('<font face="Arial">Text</font>')
      expect(result).not.toContain('<font')
      expect(result).toContain('Text')
    })

    it('removes style attributes on paste', () => {
      const result = sanitizePastedHtml('<p style="color:red">Text</p>')
      expect(result).not.toContain('style=')
      expect(result).toContain('Text')
    })

    it('preserves clean HTML', () => {
      const result = sanitizePastedHtml('<p>Hello <strong>World</strong></p>')
      expect(result).toContain('<p>')
      expect(result).toContain('<strong>World</strong>')
    })

    it('removes nested script tags', () => {
      const result = sanitizePastedHtml('<div><script>evil()</script><p>Safe</p></div>')
      expect(result).not.toContain('script')
      expect(result).not.toContain('evil()')
      expect(result).toContain('Safe')
    })

    it('removes svg-based XSS', () => {
      const result = sanitizePastedHtml('<svg onload="alert(1)"></svg>')
      expect(result).not.toContain('onload')
    })
  })

  describe('sanitizeHtml', () => {
    it('removes script tags', () => {
      const result = sanitizeHtml('<html><body><script>bad()</script><p>Safe</p></body></html>')
      expect(result).not.toContain('script')
      expect(result).toContain('Safe')
    })

    it('preserves style tags for source mode', () => {
      const result = sanitizeHtml('<style>body { color: red; }</style><p>Text</p>')
      expect(result).toContain('<style>')
      expect(result).toContain('Text')
    })

    it('preserves iframe for source mode', () => {
      const result = sanitizeHtml('<iframe src="https://example.com"></iframe>')
      expect(result).toContain('<iframe')
    })

    it('strips event handlers', () => {
      const result = sanitizeHtml('<p onclick="evil()">Text</p>')
      expect(result).not.toContain('onclick')
    })
  })
})
