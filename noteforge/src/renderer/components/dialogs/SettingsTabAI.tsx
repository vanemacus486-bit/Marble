import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { AIConfig } from '../../../main/types/ipc-contracts'

interface SettingsTabAIProps {
  onSaved?: (msg: string) => void
}

export default function SettingsTabAI({ onSaved }: SettingsTabAIProps) {
  const { t } = useTranslation()
  const [config, setConfig] = useState<AIConfig | null>(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  useEffect(() => {
    window.electronAPI.aiGetConfig().then(setConfig)
  }, [])

  const update = useCallback(async (partial: Partial<AIConfig>) => {
    if (!config) return
    await window.electronAPI.aiSetConfig(partial)
    const updated = { ...config, ...partial }
    setConfig(updated)
    // Also persist API key in app config so it survives vault switches
    try {
      const appConfig = await window.electronAPI.getAppConfig()
      await window.electronAPI.setAppConfig({
        ...appConfig,
        aiConfig: updated,
      })
    } catch { /* best effort */ }
    onSaved?.('Saved')
  }, [config, onSaved])

  const testConnection = async () => {
    if (!config?.apiKey) {
      setTestResult('Enter an API key first')
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      // Simple fetch to deepseek API to verify auth
      const baseUrl = config.endpoint.endsWith('/v1') ? config.endpoint : `${config.endpoint}/v1`
      const resp = await fetch(`${baseUrl}/models`, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      })
      if (resp.ok) {
        setTestResult('Connection successful')
      } else {
        const data = await resp.json().catch(() => ({}))
        setTestResult(`Error: ${(data as any)?.error?.message || resp.statusText}`)
      }
    } catch (err: any) {
      setTestResult(`Error: ${err.message}`)
    }
    setTesting(false)
  }

  if (!config) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 13 }}>
      {/* API Key */}
      <div>
        <label style={{ display: 'block', fontWeight: 500, marginBottom: 4, color: 'var(--m-fg)' }}>
          API Key
        </label>
        <input
          type="password"
          value={config.apiKey}
          onChange={(e) => update({ apiKey: e.target.value })}
          placeholder="sk-..."
          style={{
            width: '100%',
            padding: '6px 10px',
            borderRadius: 4,
            border: '1px solid var(--m-line)',
            background: 'var(--m-bg)',
            color: 'var(--m-fg)',
            fontSize: 12,
            fontFamily: 'var(--f-mono)',
            outline: 'none',
          }}
        />
        <div style={{ fontSize: 10, color: 'var(--m-fg-3)', marginTop: 3 }}>
          Get your key at platform.deepseek.com/api_keys
        </div>
      </div>

      {/* Model */}
      <div>
        <label style={{ display: 'block', fontWeight: 500, marginBottom: 4, color: 'var(--m-fg)' }}>
          Model
        </label>
        <select
          value={config.model}
          onChange={(e) => update({ model: e.target.value })}
          style={{
            width: '100%',
            padding: '6px 10px',
            borderRadius: 4,
            border: '1px solid var(--m-line)',
            background: 'var(--m-bg)',
            color: 'var(--m-fg)',
            fontSize: 12,
            outline: 'none',
          }}
        >
          <option value="deepseek-chat">DeepSeek-V3 (deepseek-chat)</option>
          <option value="deepseek-reasoner">DeepSeek-R1 (deepseek-reasoner)</option>
        </select>
      </div>

      {/* Endpoint */}
      <div>
        <label style={{ display: 'block', fontWeight: 500, marginBottom: 4, color: 'var(--m-fg)' }}>
          API Endpoint
        </label>
        <input
          type="text"
          value={config.endpoint}
          onChange={(e) => update({ endpoint: e.target.value })}
          style={{
            width: '100%',
            padding: '6px 10px',
            borderRadius: 4,
            border: '1px solid var(--m-line)',
            background: 'var(--m-bg)',
            color: 'var(--m-fg)',
            fontSize: 12,
            fontFamily: 'var(--f-mono)',
            outline: 'none',
          }}
        />
      </div>

      {/* Temperature */}
      <div>
        <label style={{ display: 'block', fontWeight: 500, marginBottom: 4, color: 'var(--m-fg)' }}>
          Temperature: {config.temperature}
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={config.temperature}
          onChange={(e) => update({ temperature: parseFloat(e.target.value) })}
          style={{ width: '100%', accentColor: 'var(--m-vein)' }}
        />
      </div>

      {/* Max Tokens */}
      <div>
        <label style={{ display: 'block', fontWeight: 500, marginBottom: 4, color: 'var(--m-fg)' }}>
          Max Tokens
        </label>
        <input
          type="number"
          min={256}
          max={8192}
          step={256}
          value={config.maxTokens}
          onChange={(e) => update({ maxTokens: parseInt(e.target.value) || 4096 })}
          style={{
            width: '100%',
            padding: '6px 10px',
            borderRadius: 4,
            border: '1px solid var(--m-line)',
            background: 'var(--m-bg)',
            color: 'var(--m-fg)',
            fontSize: 12,
            fontFamily: 'var(--f-mono)',
            outline: 'none',
          }}
        />
      </div>

      {/* Test Connection */}
      <div>
        <button
          onClick={testConnection}
          disabled={testing}
          style={{
            padding: '6px 14px',
            borderRadius: 4,
            border: '1px solid var(--m-line)',
            background: 'var(--m-bg-2)',
            color: 'var(--m-fg)',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
        {testResult && (
          <span style={{
            marginLeft: 10,
            fontSize: 12,
            color: testResult.startsWith('Error') ? 'var(--c-red)' : 'var(--c-green)',
          }}>
            {testResult}
          </span>
        )}
      </div>
    </div>
  )
}
