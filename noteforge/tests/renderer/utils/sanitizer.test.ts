import { describe, it, expect } from 'vitest'
import { sanitizePastedHtml, sanitizeHtml, sanitizeHtmlDynamic } from '../../../src/renderer/utils/sanitizer'

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

  describe('sanitizeHtmlDynamic', () => {
    it('preserves script tags', () => {
      const result = sanitizeHtmlDynamic('<script>console.log("hello")</script>')
      expect(result).toContain('<script>')
      expect(result).toContain('console.log')
    })

    it('strips event handlers even with scripts allowed', () => {
      const result = sanitizeHtmlDynamic('<div onclick="evil()">Content</div>')
      expect(result).not.toContain('onclick')
      expect(result).toContain('Content')
    })

    it('strips onerror handlers on images', () => {
      const result = sanitizeHtmlDynamic('<img src="x" onerror="alert(1)">')
      expect(result).not.toContain('onerror')
    })

    it('removes object tags', () => {
      const result = sanitizeHtmlDynamic('<object data="evil.swf"></object>')
      expect(result).not.toContain('object')
    })

    it('removes embed tags', () => {
      const result = sanitizeHtmlDynamic('<embed src="evil.swf">')
      expect(result).not.toContain('embed')
    })

    it('removes applet tags', () => {
      const result = sanitizeHtmlDynamic('<applet code="evil.class"></applet>')
      expect(result).not.toContain('applet')
    })

    it('removes base tags', () => {
      const result = sanitizeHtmlDynamic('<base href="https://evil.com">')
      expect(result).not.toContain('base')
    })

    it('preserves style tags', () => {
      const result = sanitizeHtmlDynamic('<style>body { color: red; }</style>')
      expect(result).toContain('<style>')
      expect(result).toContain('color: red')
    })

    it('preserves iframe tags', () => {
      const result = sanitizeHtmlDynamic('<iframe src="https://example.com"></iframe>')
      expect(result).toContain('<iframe')
    })

    it('preserves link tags', () => {
      const result = sanitizeHtmlDynamic('<link rel="stylesheet" href="style.css">')
      expect(result).toContain('style.css')
    })

    it('preserves video tags', () => {
      const result = sanitizeHtmlDynamic('<video controls><source src="vid.mp4"></video>')
      expect(result).toContain('<video')
      expect(result).toContain('vid.mp4')
    })

    it('preserves inline script with complex content', () => {
      const result = sanitizeHtmlDynamic('<script>\n  function test() {\n    return 42;\n  }\n</script>')
      expect(result).toContain('function test')
      expect(result).toContain('return 42')
    })

    it('handles script src references', () => {
      const result = sanitizeHtmlDynamic('<script src="https://cdn.example.com/lib.js"></script>')
      expect(result).toContain('src="https://cdn.example.com/lib.js"')
    })

    it('preserves canvas and svg elements', () => {
      const result = sanitizeHtmlDynamic('<canvas id="c"></canvas><svg><circle cx="50" cy="50" r="40"/></svg>')
      expect(result).toContain('<canvas')
      expect(result).toContain('<circle')
    })

    it('removes script tags from non-dynamic sanitizeHtml', () => {
      const result = sanitizeHtml('<script>bad()</script><p>Safe</p>')
      expect(result).not.toContain('script')
      expect(result).toContain('Safe')
    })
  })
})
