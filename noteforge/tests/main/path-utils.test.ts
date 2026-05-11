import { describe, it, expect } from 'vitest'
import {
  normalizeVaultPath,
  isPathWithinVault,
  getRelativePath,
  sanitizeFilename,
} from '../../src/main/utils/path-utils'

describe('path-utils', () => {
  describe('normalizeVaultPath', () => {
    it('joins vault root and relative path', () => {
      const result = normalizeVaultPath('/vault', 'notes/test.html')
      expect(result).toContain('notes')
      expect(result).toContain('test.html')
    })
  })

  describe('isPathWithinVault', () => {
    it('returns true for paths inside vault', () => {
      const result = isPathWithinVault('/vault', '/vault/notes/test.html')
      expect(result).toBe(true)
    })

    it('returns false for path traversal attempts', () => {
      const result = isPathWithinVault('/vault', '/vault/../../../etc/passwd')
      expect(result).toBe(false)
    })
  })

  describe('getRelativePath', () => {
    it('returns relative path from vault root', () => {
      const result = getRelativePath('/vault', '/vault/notes/test.html')
      expect(result).toBe('notes/test.html')
    })
  })

  describe('sanitizeFilename', () => {
    it('removes unsafe characters', () => {
      const result = sanitizeFilename('foo:bar<baz>')
      expect(result).not.toContain(':')
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
    })
  })
})
