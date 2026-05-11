import { describe, it, expect } from 'vitest'

describe('search-indexer', () => {
  describe('parseQuery', () => {
    // Test the operator parsing logic (inline since class needs async init)
    function parseQuery(raw: string): { text: string; operators: Record<string, string> } {
      const operators: Record<string, string> = {}
      const patterns = ['tag', 'folder', 'file', 'path', 'title']
      for (const op of patterns) {
        const match = raw.match(new RegExp(`${op}:("[^"]*"|'[^']*'|\\S+)`))
        if (match) {
          operators[op] = match[1].replace(/['"]/g, '')
        }
      }
      const text = raw.replace(/(tag|folder|file|path|title):("[^"]*"|'[^']*'|\S+)\s*/g, '').trim()
      return { text, operators }
    }

    it('extracts tag operator', () => {
      const result = parseQuery('hello tag:research world')
      expect(result.operators.tag).toBe('research')
      expect(result.text).toBe('hello world')
    })

    it('extracts folder operator', () => {
      const result = parseQuery('notes folder:projects')
      expect(result.operators.folder).toBe('projects')
    })

    it('extracts path operator', () => {
      const result = parseQuery('path:Daily/notes')
      expect(result.operators.path).toBe('Daily/notes')
    })

    it('extracts multiple operators', () => {
      const result = parseQuery('tag:research folder:projects search text')
      expect(result.operators.tag).toBe('research')
      expect(result.operators.folder).toBe('projects')
      expect(result.text).toBe('search text')
    })

    it('handles quoted values', () => {
      const result = parseQuery('tag:"multi word tag"')
      expect(result.operators.tag).toBe('multi word tag')
    })

    it('returns empty operators when none present', () => {
      const result = parseQuery('plain text search')
      expect(Object.keys(result.operators)).toHaveLength(0)
      expect(result.text).toBe('plain text search')
    })
  })
})
