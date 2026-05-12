import OpenAI from 'openai'
import { BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../types/ipc-channels'
import {
  executeReadOnlyTool,
  executeWriteTool,
  buildPendingApproval,
  isReadOnlyTool,
  getSystemPrompt,
  AI_TOOLS,
} from '../utils/ai-tools'
import { saveAppStore } from '../utils/app-store'
import type { AppStoreSchema } from '../utils/app-store'
import type { AIChatMessage, AIConfig } from '../types/ipc-contracts'
import { defaultAIConfig } from '../types/ipc-contracts'
import type { VaultManager } from './vault-manager'
import type { SearchIndexer } from './search-indexer'

export class AIService {
  private vaultManager: VaultManager | null = null
  private searchIndexer: SearchIndexer | null = null
  private appStore: AppStoreSchema
  private abortController: AbortController | null = null
  private pendingApprovals: Map<string, { resolve: (approved: boolean) => void }> = new Map()

  constructor(appStore: AppStoreSchema) {
    this.appStore = appStore
  }

  setVaultServices(vaultManager: VaultManager, searchIndexer: SearchIndexer): void {
    this.vaultManager = vaultManager
    this.searchIndexer = searchIndexer
  }

  getConfig(): AIConfig {
    return this.appStore.app.aiConfig ?? defaultAIConfig()
  }

  async updateConfig(partial: Partial<AIConfig>): Promise<void> {
    this.appStore.app.aiConfig = { ...this.getConfig(), ...partial }
    await saveAppStore(this.appStore)
  }

  cancel(): void {
    this.abortController?.abort()
    for (const [, p] of this.pendingApprovals) {
      p.resolve(false)
    }
    this.pendingApprovals.clear()
  }

  // Start a chat session. Returns immediately; results delivered via push events.
  chat(windowId: number, messages: AIChatMessage[]): void {
    const win = BrowserWindow.fromId(windowId)
    if (!win || win.isDestroyed()) return

    const config = this.getConfig()
    if (!config.apiKey) {
      win.webContents.send(IPC_CHANNELS.AI_ERROR, 'No API key configured. Please add your DeepSeek API key in Settings > AI.')
      win.webContents.send(IPC_CHANNELS.AI_STREAM_END)
      return
    }

    // Cancel any in-progress stream
    this.cancel()
    this.abortController = new AbortController()
    const signal = this.abortController.signal

    const client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.endpoint.endsWith('/v1') ? config.endpoint : `${config.endpoint}/v1`,
    })

    const systemMsg = {
      role: 'system' as const,
      content: getSystemPrompt(),
    }

    const fullMessages: any[] = [systemMsg]

    for (const m of messages) {
      const entry: any = { role: m.role, content: m.content }
      if (m.toolCallId) entry.tool_call_id = m.toolCallId
      if (m.toolCalls) {
        entry.tool_calls = m.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
        }))
      }
      fullMessages.push(entry)
    }

    // Fire and forget — results delivered via push events
    this.streamChatLoop(fullMessages, win, client, config, signal).catch((err) => {
      if (signal.aborted) return
      const message = err?.message || String(err)
      win.webContents.send(IPC_CHANNELS.AI_ERROR, `AI request failed: ${message}`)
      win.webContents.send(IPC_CHANNELS.AI_STREAM_END)
    })
  }

  private async streamChatLoop(
    messages: any[],
    win: BrowserWindow,
    client: OpenAI,
    config: AIConfig,
    signal: AbortSignal,
  ): Promise<void> {
    let currentMessages = [...messages]
    let maxIterations = 10

    while (maxIterations-- > 0) {
      if (signal.aborted) return

      const stream = await client.chat.completions.create(
        {
          model: config.model,
          messages: currentMessages,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          stream: true,
          tools: AI_TOOLS,
          tool_choice: 'auto',
        },
        { signal },
      )

      let textContent = ''
      const toolCallsAcc: Record<number, { id: string; function: { name: string; arguments: string } }> = {}

      for await (const chunk of stream) {
        if (signal.aborted) return

        const delta = chunk.choices?.[0]?.delta

        if (delta?.content) {
          textContent += delta.content
          win.webContents.send(IPC_CHANNELS.AI_STREAM_CHUNK, delta.content)
        }

        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index
            if (!toolCallsAcc[idx]) {
              toolCallsAcc[idx] = { id: tc.id || '', function: { name: '', arguments: '' } }
            }
            if (tc.id) toolCallsAcc[idx].id = tc.id
            if (tc.function?.name) toolCallsAcc[idx].function.name += tc.function.name
            if (tc.function?.arguments) toolCallsAcc[idx].function.arguments += tc.function.arguments
          }
        }
      }

      const toolCalls = Object.values(toolCallsAcc).filter((tc) => tc.id)

      if (toolCalls.length === 0) break

      // Build assistant message with accumulated tool calls
      currentMessages.push({
        role: 'assistant',
        content: textContent || null,
        tool_calls: toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments,
          },
        })),
      })

      const deps = this.vaultManager && this.searchIndexer
        ? { vaultManager: this.vaultManager, searchIndexer: this.searchIndexer }
        : null

      for (const tc of toolCalls) {
        const name = tc.function.name
        let args: Record<string, unknown> = {}
        try {
          args = JSON.parse(tc.function.arguments)
        } catch {
          currentMessages.push({ role: 'tool', tool_call_id: tc.id, content: 'Error: invalid arguments' })
          continue
        }

        if (isReadOnlyTool(name)) {
          if (!deps) {
            currentMessages.push({ role: 'tool', tool_call_id: tc.id, content: 'Error: no vault open' })
            continue
          }
          try {
            const result = await executeReadOnlyTool(name, args, deps)
            currentMessages.push({ role: 'tool', tool_call_id: tc.id, content: result })
          } catch (err: any) {
            currentMessages.push({ role: 'tool', tool_call_id: tc.id, content: `Error: ${err.message}` })
          }
        } else {
          // Write tools: require user approval
          if (!deps) {
            currentMessages.push({ role: 'tool', tool_call_id: tc.id, content: 'Error: no vault open' })
            continue
          }

          let oldContent: string | undefined
          if (name === 'write_note') {
            try {
              oldContent = await deps.vaultManager.readNote(args.path as string)
            } catch { /* file may not exist */ }
          }

          const pending = buildPendingApproval(tc.id, name, args, oldContent)
          win.webContents.send(IPC_CHANNELS.AI_TOOL_CALL_PENDING, pending)

          const approved = await new Promise<boolean>((resolve) => {
            this.pendingApprovals.set(tc.id, { resolve })
          })
          this.pendingApprovals.delete(tc.id)

          if (signal.aborted) {
            // Approval promise was rejected due to cancel — exit the entire loop
            return
          }

          if (approved) {
            try {
              const result = await executeWriteTool(name, args, deps)
              currentMessages.push({ role: 'tool', tool_call_id: tc.id, content: result })
            } catch (err: any) {
              currentMessages.push({ role: 'tool', tool_call_id: tc.id, content: `Error: ${err.message}` })
            }
          } else {
            currentMessages.push({ role: 'tool', tool_call_id: tc.id, content: 'User rejected this operation.' })
          }
        }
      }
    }

    win.webContents.send(IPC_CHANNELS.AI_STREAM_END)
  }

  approveToolCall(callId: string): boolean {
    const pending = this.pendingApprovals.get(callId)
    if (pending) {
      pending.resolve(true)
      return true
    }
    return false
  }

  rejectToolCall(callId: string): boolean {
    const pending = this.pendingApprovals.get(callId)
    if (pending) {
      pending.resolve(false)
      return true
    }
    return false
  }
}
