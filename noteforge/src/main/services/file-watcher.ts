import chokidar from 'chokidar'
import { access } from 'fs/promises'
import type { FileChangeEvent, FileChangeType } from '../types/ipc-contracts'

type ChangeCallback = (events: FileChangeEvent[]) => void

export class FileWatcher {
  private vaultRoot: string
  private excludedPatterns: string[]
  private watcher: chokidar.FSWatcher | null = null
  private callbacks: Set<ChangeCallback> = new Set()
  private pendingEvents: FileChangeEvent[] = []
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private readonly DEBOUNCE_MS = 500

  constructor(vaultRoot: string, excludedPatterns: string[]) {
    this.vaultRoot = vaultRoot
    this.excludedPatterns = excludedPatterns
  }

  async start(): Promise<void> {
    await this.checkDriveSpeed()

    const ignored = [
      /[/\\]\.git[/\\]/,
      /[/\\]node_modules[/\\]/,
      /[/\\]\.marble[/\\]/,
      ...this.excludedPatterns.map((p) => new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))),
    ]

    this.watcher = chokidar.watch(this.vaultRoot, {
      ignored,
      persistent: true,
      ignoreInitial: true,
      followSymlinks: false,
      disableGlobbing: false,
      alwaysStat: false,
    })

    this.watcher
      .on('add', (filePath: string) => {
        if (!filePath.endsWith('.html')) return
        this.queueEvent('add', filePath)
      })
      .on('change', (filePath: string) => {
        if (!filePath.endsWith('.html')) return
        this.queueEvent('change', filePath)
      })
      .on('unlink', (filePath: string) => {
        if (!filePath.endsWith('.html')) return
        this.queueEvent('unlink', filePath)
      })
      .on('addDir', (dirPath: string) => {
        this.queueEvent('addDir', dirPath)
      })
      .on('unlinkDir', (dirPath: string) => {
        this.queueEvent('unlinkDir', dirPath)
      })
  }

  async stop(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
    if (this.watcher) {
      await this.watcher.close()
      this.watcher = null
    }
    this.pendingEvents = []
  }

  onChange(callback: ChangeCallback): void {
    this.callbacks.add(callback)
  }

  removeCallback(callback: (...args: unknown[]) => void): void {
    for (const cb of this.callbacks) {
      if (cb === callback) {
        this.callbacks.delete(cb)
        return
      }
    }
  }

  private queueEvent(type: FileChangeType, filePath: string): void {
    const relativePath = this.toRelativePath(filePath)
    this.pendingEvents.push({ type, path: relativePath })

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    this.debounceTimer = setTimeout(() => {
      this.flushEvents()
    }, this.DEBOUNCE_MS)
  }

  private flushEvents(): void {
    if (this.pendingEvents.length === 0) return

    const events = this.pendingEvents.splice(0)
    for (const callback of this.callbacks) {
      try {
        callback(events)
      } catch {}
    }
  }

  private toRelativePath(absolutePath: string): string {
    const normalized = absolutePath.replace(/\\/g, '/')
    const root = this.vaultRoot.replace(/\\/g, '/').replace(/\/+$/, '')
    if (normalized.startsWith(root + '/')) {
      return normalized.slice(root.length + 1)
    }
    return normalized
  }

  private async checkDriveSpeed(): Promise<void> {
    const start = Date.now()
    try {
      await access(this.vaultRoot)
      const elapsed = Date.now() - start
      if (elapsed > 1000) {
        console.warn(
          `[FileWatcher] Slow drive detected: ${elapsed}ms response time for ${this.vaultRoot}. Watching may be unreliable.`
        )
      }
    } catch {
      console.warn(`[FileWatcher] Cannot access vault root: ${this.vaultRoot}`)
    }
  }
}
