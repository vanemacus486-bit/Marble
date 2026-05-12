import { create } from 'zustand'
import type { AIChatMessage, AIPendingApproval } from '../../main/types/ipc-contracts'

export interface AIMessage {
  id: string
  role: 'user' | 'assistant' | 'tool' | 'system'
  content: string
  toolCalls?: { id: string; name: string; args: Record<string, unknown> }[]
  pendingApproval?: AIPendingApproval
  timestamp: number
}

interface AIState {
  messages: AIMessage[]
  streaming: boolean
  streamingText: string
  pendingApprovals: AIPendingApproval[]
  error: string | null

  sendMessage: (text: string) => Promise<void>
  approveToolCall: (callId: string) => Promise<void>
  rejectToolCall: (callId: string) => Promise<void>
  cancelStream: () => Promise<void>
  clearChat: () => void
  dismissError: () => void

  // Internal
  _addStreamChunk: (chunk: string) => void
  _addToolCallPending: (pending: AIPendingApproval) => void
  _handleStreamEnd: () => void
  _handleError: (error: string) => void
}

let cleanupFns: (() => void)[] = []

function uid(): string {
  return crypto.randomUUID()
}

export const useAiStore = create<AIState>((set, get) => {
  // Set up IPC listeners once
  if (cleanupFns.length === 0 && typeof window !== 'undefined' && window.electronAPI) {
    cleanupFns.push(
      window.electronAPI.onAiStreamChunk((chunk) => {
        get()._addStreamChunk(chunk)
      }),
    )
    cleanupFns.push(
      window.electronAPI.onAiToolCallPending((pending) => {
        get()._addToolCallPending(pending)
      }),
    )
    cleanupFns.push(
      window.electronAPI.onAiStreamEnd(() => {
        get()._handleStreamEnd()
      }),
    )
    cleanupFns.push(
      window.electronAPI.onAiError((error) => {
        get()._handleError(error)
      }),
    )
  }

  return {
    messages: [],
    streaming: false,
    streamingText: '',
    pendingApprovals: [],
    error: null,

    sendMessage: async (text: string) => {
      const userMsg: AIMessage = {
        id: uid(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
      }

      set((s) => ({
        messages: [...s.messages, userMsg],
        streaming: true,
        streamingText: '',
        error: null,
        pendingApprovals: [],
      }))

      // Build chat messages for IPC
      const chatMessages: AIChatMessage[] = get().messages
        .filter((m) => m.role === 'user' || m.role === 'assistant' || m.role === 'tool')
        .map((m) => ({
          role: m.role,
          content: m.content,
          ...(m.toolCalls ? { toolCalls: m.toolCalls.map((tc) => ({ id: tc.id, name: tc.name, arguments: tc.args })) } : {}),
        }))

      try {
        await window.electronAPI.aiChat(chatMessages)
      } catch {
        // Errors are delivered via onAiError push event
      }
    },

    approveToolCall: async (callId: string) => {
      await window.electronAPI.aiApproveToolCall(callId)
      set((s) => ({
        pendingApprovals: s.pendingApprovals.filter((p) => p.callId !== callId),
      }))
    },

    rejectToolCall: async (callId: string) => {
      await window.electronAPI.aiRejectToolCall(callId)
      set((s) => ({
        pendingApprovals: s.pendingApprovals.filter((p) => p.callId !== callId),
      }))
    },

    cancelStream: async () => {
      await window.electronAPI.aiCancel()
      set({ streaming: false, streamingText: '' })
    },

    clearChat: () => {
      set({ messages: [], streamingText: '', streaming: false, pendingApprovals: [], error: null })
    },

    dismissError: () => set({ error: null }),

    _addStreamChunk: (chunk: string) => {
      set((s) => ({ streamingText: s.streamingText + chunk }))
    },

    _addToolCallPending: (pending: AIPendingApproval) => {
      set((s) => ({
        pendingApprovals: [...s.pendingApprovals, pending],
        messages: [
          ...s.messages,
          {
            id: uid(),
            role: 'tool',
            content: pending.toolName,
            toolCalls: [{ id: pending.callId, name: pending.toolName, args: pending.args }],
            pendingApproval: pending,
            timestamp: Date.now(),
          },
        ],
      }))
    },

    _handleStreamEnd: () => {
      const { streamingText } = get()
      if (streamingText) {
        set((s) => ({
          messages: [
            ...s.messages,
            {
              id: uid(),
              role: 'assistant',
              content: streamingText,
              timestamp: Date.now(),
            },
          ],
          streaming: false,
          streamingText: '',
        }))
      } else {
        set({ streaming: false, streamingText: '' })
      }
    },

    _handleError: (error: string) => {
      set((s) => ({
        error,
        streaming: false,
        streamingText: '',
        messages: [
          ...s.messages,
          {
            id: uid(),
            role: 'system',
            content: `Error: ${error}`,
            timestamp: Date.now(),
          },
        ],
      }))
    },
  }
})
