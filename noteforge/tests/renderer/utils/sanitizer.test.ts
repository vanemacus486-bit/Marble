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
    })

    it('removes iframe tags', () => {
      const result = sanitizePastedHtml('<iframe src="evil.com"></iframe>')
      expect(result).not.toContain('iframe')
    })

    it('removes font tags', () => {
      const result = sanitizePastedHtml('<font face="Arial">Text</font>')
      expect(result).not.toContain('<font')
      expect(result).toContain('Text')
    })

    it('preserves clean HTML', () => {
      const result = sanitizePastedHtml('<p>Hello <strong>World</strong></p>')
      expect(result).toBe('<p>Hello <strong>World</strong></p>')
    })
  })

  describe('sanitizeHtml', () => {
    it('removes script tags', () => {
      const result = sanitizeHtml('<html><body><script>bad()</script><p>Safe</p></body></html>')
      expect(result).not.toContain('script')
    })
  })
})
