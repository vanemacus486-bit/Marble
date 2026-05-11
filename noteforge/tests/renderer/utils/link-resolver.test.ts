import { describe, it, expect } from 'vitest'
import {
  isInternalLink,
  normalizeNotePath,
  isBrokenLink,
  generateHeadingId,
} from '../../../src/renderer/utils/link-resolver'

describe('link-resolver', () => {
  describe('isInternalLink', () => {
    it('returns true for .html relative paths', () => {
      expect(isInternalLink('notes/example.html')).toBe(true)
    })

    it('returns false for external URLs', () => {
      expect(isInternalLink('https://example.com')).toBe(false)
      expect(isInternalLink('http://example.com')).toBe(false)
    })

    it('returns false for mailto and tel links', () => {
      expect(isInternalLink('mailto:test@example.com')).toBe(false)
      expect(isInternalLink('tel:+1234567890')).toBe(false)
    })

    it('returns false for anchor links', () => {
      expect(isInternalLink('#section')).toBe(false)
    })
  })

  describe('normalizeNotePath', () => {
    it('returns absolute path unchanged', () => {
      const result = normalizeNotePath('notes/test.html', 'other/file.html')
      expect(result).toBe('notes/test.html')
    })

    it('resolves ./ relative paths', () => {
      const result = normalizeNotePath('./sibling.html', 'notes/current.html')
      expect(result).toBe('notes/sibling.html')
    })

    it('resolves ../ relative paths', () => {
      const result = normalizeNotePath('../other.html', 'notes/current.html')
      expect(result).toBe('other.html')
    })
  })

  describe('isBrokenLink', () => {
    it('returns true when target does not exist', () => {
      const result = isBrokenLink('missing.html', new Set(['notes/exists.html']))
      expect(result).toBe(true)
    })

    it('returns false when target exists', () => {
      const result = isBrokenLink('notes/exists.html', new Set(['notes/exists.html']))
      expect(result).toBe(false)
    })
  })

  describe('generateHeadingId', () => {
    it('converts text to URL-safe id', () => {
      const result = generateHeadingId('Hello World!')
      expect(result).toBe('hello-world')
    })

    it('handles special characters', () => {
      const result = generateHeadingId('Section 3.1: Introduction (Overview)')
      expect(result).toBe('section-3-1-introduction-overview')
    })
  })
})
