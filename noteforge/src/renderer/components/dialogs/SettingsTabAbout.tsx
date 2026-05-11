import { useState, useEffect } from 'react'
import { SectionHeading } from './SettingsFormControls'

export default function SettingsTabAbout() {
  const [appVersion, setAppVersion] = useState<string>('0.1.0')
  const [envInfo, setEnvInfo] = useState<{
    electron: string
    chrome: string
    node: string
  } | null>(null)

  useEffect(() => {
    window.electronAPI.getAppVersion().then((v) => setAppVersion(v)).catch(() => {})
    try {
      setEnvInfo({
        electron: process.versions.electron ?? '--',
        chrome: process.versions.chrome ?? '--',
        node: process.versions.node ?? '--',
      })
    } catch {
      setEnvInfo(null)
    }
  }, [])

  const handleLink = (url: string) => {
    window.electronAPI.openExternal(url).catch(() => {})
  }

  return (
    <div className="space-y-6">
      <SectionHeading title="About NoteForge" />

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--color-accent)] text-2xl font-bold text-white">
            NF
          </div>
          <div>
            <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">NoteForge</h4>
            <p className="text-sm text-[var(--color-text-muted)]">Version {appVersion}</p>
            <p className="text-xs text-[var(--color-text-muted)]">Built with Electron, React, TypeScript</p>
          </div>
        </div>
      </div>

      {envInfo && (
        <div className="space-y-1.5">
          <SectionHeading title="Environment" />
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-[var(--color-text-muted)]">Electron</span>
              <span className="text-[var(--color-text-primary)]">{envInfo.electron}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[var(--color-text-muted)]">Chrome</span>
              <span className="text-[var(--color-text-primary)]">{envInfo.chrome}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[var(--color-text-muted)]">Node.js</span>
              <span className="text-[var(--color-text-primary)]">{envInfo.node}</span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <SectionHeading title="Links" />
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 text-sm">
          <button
            className="block w-full rounded px-2 py-1.5 text-left text-[var(--color-accent)] hover:bg-[var(--color-bg-tertiary)]"
            onClick={() => handleLink('https://github.com/noteforge/noteforge')}
          >
            GitHub Repository
          </button>
          <button
            className="block w-full rounded px-2 py-1.5 text-left text-[var(--color-accent)] hover:bg-[var(--color-bg-tertiary)]"
            onClick={() => handleLink('https://github.com/noteforge/noteforge/issues')}
          >
            Report Issue
          </button>
        </div>
      </div>

      <p className="text-xs text-[var(--color-text-muted)]">
        &copy; {new Date().getFullYear()} Marble. All rights reserved.
      </p>
    </div>
  )
}
