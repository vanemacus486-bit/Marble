import { readFile, readdir, mkdir, rm, rename, stat, unlink } from 'fs/promises'
import { resolve, dirname, basename } from 'path'
import { atomicWrite } from '../utils/atomic-write'
import { isPathWithinVault } from '../utils/path-utils'
import type { FileEntry, FolderNode } from '../types/ipc-contracts'

function toForwardSlash(p: string): string {
  return p.replace(/\\/g, '/')
}

export class VaultManager {
  private vaultRoot: string
  private excludedPatterns: string[] = ['.git', 'node_modules', '.marble']

  constructor(vaultRoot: string) {
    this.vaultRoot = resolve(vaultRoot)
  }

  setExcludedPatterns(patterns: string[]): void {
    this.excludedPatterns = patterns
  }

  getVaultRoot(): string {
    return this.vaultRoot
  }

  async listFiles(directory?: string): Promise<FileEntry[]> {
    const dirPath = directory ? this.resolvePath(directory) : this.vaultRoot
    const entries: FileEntry[] = []
    await this.walkDir(dirPath, '', entries)
    return entries
  }

  private async walkDir(dirPath: string, relPath: string, entries: FileEntry[]): Promise<void> {
    let items: string[]
    try {
      items = await readdir(dirPath)
    } catch {
      return
    }

    for (const name of items) {
      const itemRelPath = relPath ? `${relPath}/${name}` : name
      if (this.isExcluded(name)) continue

      const itemAbsPath = resolve(dirPath, name)
      let itemStat
      try {
        itemStat = await stat(itemAbsPath)
      } catch {
        continue
      }

      if (itemStat.isDirectory()) {
        entries.push({
          name,
          path: toForwardSlash(itemRelPath),
          isDirectory: true,
          size: 0,
          modified: itemStat.mtime,
        })
        await this.walkDir(itemAbsPath, itemRelPath, entries)
      } else {
        entries.push({
          name,
          path: toForwardSlash(itemRelPath),
          isDirectory: false,
          size: itemStat.size,
          modified: itemStat.mtime,
        })
      }
    }
  }

  async readNote(relativePath: string): Promise<string> {
    const fullPath = this.resolvePath(relativePath)
    if (!isPathWithinVault(this.vaultRoot, fullPath)) {
      throw new Error('Path traversal detected')
    }
    return readFile(fullPath, 'utf-8')
  }

  async writeNote(relativePath: string, content: string): Promise<void> {
    const fullPath = this.resolvePath(relativePath)
    if (!isPathWithinVault(this.vaultRoot, fullPath)) {
      throw new Error('Path traversal detected')
    }
    await atomicWrite(fullPath, content)
  }

  async deleteNote(relativePath: string): Promise<void> {
    const fullPath = this.resolvePath(relativePath)
    if (!isPathWithinVault(this.vaultRoot, fullPath)) {
      throw new Error('Path traversal detected')
    }
    await unlink(fullPath)
  }

  async renameNote(oldPath: string, newPath: string): Promise<void> {
    const fullOldPath = this.resolvePath(oldPath)
    const fullNewPath = this.resolvePath(newPath)
    if (!isPathWithinVault(this.vaultRoot, fullOldPath) || !isPathWithinVault(this.vaultRoot, fullNewPath)) {
      throw new Error('Path traversal detected')
    }
    await mkdir(dirname(fullNewPath), { recursive: true })
    await rename(fullOldPath, fullNewPath)
  }

  async createNote(relativePath: string, content: string): Promise<void> {
    const fullPath = this.resolvePath(relativePath)
    if (!isPathWithinVault(this.vaultRoot, fullPath)) {
      throw new Error('Path traversal detected')
    }
    await atomicWrite(fullPath, content)
  }

  async moveNote(sourcePath: string, targetFolder: string): Promise<void> {
    const fullSrc = this.resolvePath(sourcePath)
    const fileName = basename(sourcePath)
    const fullDest = this.resolvePath(targetFolder + '/' + fileName)

    if (!isPathWithinVault(this.vaultRoot, fullSrc) || !isPathWithinVault(this.vaultRoot, fullDest)) {
      throw new Error('Path traversal detected')
    }

    await mkdir(dirname(fullDest), { recursive: true })
    await rename(fullSrc, fullDest)
  }

  async createFolder(relativePath: string): Promise<void> {
    const fullPath = this.resolvePath(relativePath)
    if (!isPathWithinVault(this.vaultRoot, fullPath)) {
      throw new Error('Path traversal detected')
    }
    await mkdir(fullPath, { recursive: true })
  }

  async deleteFolder(relativePath: string): Promise<void> {
    const fullPath = this.resolvePath(relativePath)
    if (!isPathWithinVault(this.vaultRoot, fullPath)) {
      throw new Error('Path traversal detected')
    }
    await rm(fullPath, { recursive: true, force: true })
  }

  async renameFolder(oldPath: string, newPath: string): Promise<void> {
    const fullOldPath = this.resolvePath(oldPath)
    const fullNewPath = this.resolvePath(newPath)
    if (!isPathWithinVault(this.vaultRoot, fullOldPath) || !isPathWithinVault(this.vaultRoot, fullNewPath)) {
      throw new Error('Path traversal detected')
    }
    await mkdir(dirname(fullNewPath), { recursive: true })
    await rename(fullOldPath, fullNewPath)
  }

  resolvePath(relativePath: string): string {
    return resolve(this.vaultRoot, relativePath)
  }

  async getFolderTree(): Promise<FolderNode[]> {
    const root = await this.buildFolderTree(this.vaultRoot, '')
    return root.children || []
  }

  private async buildFolderTree(dirPath: string, relPath: string): Promise<FolderNode> {
    let items: string[]
    try {
      items = await readdir(dirPath)
    } catch {
      return { name: basename(dirPath) || 'vault', path: toForwardSlash(relPath), children: [], noteCount: 0 }
    }

    const children: FolderNode[] = []
    let noteCount = 0

    for (const name of items) {
      if (this.isExcluded(name)) continue

      const itemAbsPath = resolve(dirPath, name)
      let itemStat
      try {
        itemStat = await stat(itemAbsPath)
      } catch {
        continue
      }

      const itemRelPath = relPath ? `${relPath}/${name}` : name

      if (itemStat.isDirectory()) {
        const child = await this.buildFolderTree(itemAbsPath, itemRelPath)
        children.push(child)
        noteCount += child.noteCount
      } else if (name.endsWith('.html')) {
        noteCount++
      }
    }

    return {
      name: basename(dirPath) || 'vault',
      path: toForwardSlash(relPath),
      children,
      noteCount,
    }
  }

  async ensureNoteDir(relativePath: string): Promise<void> {
    const fullPath = this.resolvePath(relativePath)
    if (!isPathWithinVault(this.vaultRoot, fullPath)) {
      throw new Error('Path traversal detected')
    }
    await mkdir(dirname(fullPath), { recursive: true })
  }

  private isExcluded(name: string): boolean {
    return this.excludedPatterns.some((pattern) => name === pattern || name.startsWith(pattern + '/'))
  }
}
