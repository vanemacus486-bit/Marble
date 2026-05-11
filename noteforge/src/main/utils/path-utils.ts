import { resolve, relative, extname, basename, isAbsolute } from 'path'
import { access } from 'fs/promises'

function toForwardSlash(p: string): string {
  return p.replace(/\\/g, '/')
}

export function normalizeVaultPath(vaultRoot: string, relativePath: string): string {
  const root = resolve(vaultRoot)
  const target = resolve(root, relativePath)
  const rel = relative(root, target)
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error('Path traversal detected')
  }
  return target
}

export function isPathWithinVault(vaultRoot: string, targetPath: string): boolean {
  const root = resolve(vaultRoot)
  const target = resolve(targetPath)
  const rel = relative(root, target)
  return !rel.startsWith('..') && !isAbsolute(rel)
}

export function getRelativePath(vaultRoot: string, absolutePath: string): string {
  const root = resolve(vaultRoot)
  const target = resolve(absolutePath)
  return toForwardSlash(relative(root, target))
}

export function sanitizeFilename(name: string): string {
  let sanitized = name.replace(/[/\\?<>:*|"]/g, '_')
  sanitized = sanitized.replace(/^\.+/, '')
  if (sanitized.length > 255) {
    const ext = extname(sanitized)
    sanitized = sanitized.slice(0, 255 - ext.length) + ext
  }
  return sanitized || 'untitled'
}

export async function getUniqueFilename(
  vaultRoot: string,
  folder: string,
  baseName: string
): Promise<string> {
  const ext = extname(baseName)
  const nameWithoutExt = basename(baseName, ext)
  let result = baseName
  let counter = 1
  for (;;) {
    const fullPath = resolve(vaultRoot, folder, result)
    try {
      await access(fullPath)
      result = `${nameWithoutExt}-${counter}${ext}`
      counter++
    } catch {
      return result
    }
  }
}
