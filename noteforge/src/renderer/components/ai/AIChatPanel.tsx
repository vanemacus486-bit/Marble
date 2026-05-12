import React, { useRef, useEffect, useState } from 'react'
import { useAiStore } from '../../stores/ai-store'
import DiffPreview from './DiffPreview'

export default function AIChatPanel() {
  const messages = useAiStore((s) => s.messages)
  const streaming = useAiStore((s) => s.streaming)
  const streamingText = useAiStore((s) => s.streamingText)
  const pendingApprovals = useAiStore((s) => s.pendingApprovals)
  const error = useAiStore((s) => s.error)
  const sendMessage = useAiStore((s) => s.sendMessage)
  const approveToolCall = useAiStore((s) => s.approveToolCall)
  const rejectToolCall = useAiStore((s) => s.rejectToolCall)
  const cancelStream = useAiStore((s) => s.cancelStream)
  const clearChat = useAiStore((s) => s.clearChat)
  const dismissError = useAiStore((s) => s.dismissError)

  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  const handleSend = () => {
    const text = input.trim()
    if (!text || streaming) return
    setInput('')
    sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const renderMessageContent = (content: string) => {
    // Simple markdown rendering
    const lines = content.split('\n')
    return lines.map((line, i) => {
      // Code blocks are handled by looking for ``` markers
      if (line.startsWith('# ')) return <h3 key={i} style={{ fontSize: 15, fontWeight: 600, margin: '8px 0 4px', color: 'var(--m-fg)' }}>{line.slice(2)}</h3>
      if (line.startsWith('## ')) return <h4 key={i} style={{ fontSize: 14, fontWeight: 600, margin: '6px 0 3px', color: 'var(--m-fg)' }}>{line.slice(3)}</h4>
      if (line.startsWith('- ')) return <div key={i} style={{ paddingLeft: 12, color: 'var(--m-fg-1)' }}>• {line.slice(2)}</div>
      if (line.match(/^\d+\. /)) return <div key={i} style={{ paddingLeft: 12, color: 'var(--m-fg-1)' }}>{line}</div>
      if (line.startsWith('> ')) return <blockquote key={i} style={{ borderLeft: '2px solid var(--m-vein)', paddingLeft: 10, margin: '4px 0', color: 'var(--m-fg-2)', fontSize: 12.5 }}>{line.slice(2)}</blockquote>
      if (line.startsWith('```')) return <div key={i} style={{ height: 4 }} />
      if (line.trim() === '') return <div key={i} style={{ height: 4 }} />
      return <p key={i} style={{ margin: '2px 0', color: 'var(--m-fg-1)', lineHeight: 1.5 }}>{line}</p>
    })
  }

  const getToolLabel = (name: string): string => {
    switch (name) {
      case 'list_files': return 'Listing files'
      case 'read_note': return 'Reading note'
      case 'search_notes': return 'Searching notes'
      case 'create_note': return 'Creating note'
      case 'write_note': return 'Editing note'
      case 'delete_note': return 'Deleting note'
      case 'rename_note': return 'Renaming note'
      default: return name
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--m-bg-1)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderBottom: '1px solid var(--m-line-soft)',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--m-fg)' }}>
          AI Assistant
        </span>
        <button
          onClick={clearChat}
          style={{
            padding: '2px 8px',
            borderRadius: 4,
            border: 0,
            background: 'transparent',
            color: 'var(--m-fg-3)',
            cursor: 'pointer',
            fontSize: 11,
          }}
          title="Clear chat"
        >
          Clear
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {messages.length === 0 && !streaming && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: 20,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'var(--m-vein-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 12,
              color: 'var(--m-vein)',
              fontSize: 18,
            }}>
              AI
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--m-fg-2)', textAlign: 'center', margin: 0 }}>
              Ask me to help with your notes.
            </p>
            <p style={{ fontSize: 11, color: 'var(--m-fg-3)', textAlign: 'center', margin: '4px 0 0' }}>
              I can search, read, create, and edit notes.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              padding: '6px 12px',
              borderBottom: msg.role === 'tool' ? undefined : 'none',
            }}
          >
            {msg.role === 'user' && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
              }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'var(--m-vein)',
                  color: '#fff',
                  fontSize: 12.5,
                  lineHeight: 1.5,
                }}>
                  {msg.content}
                </div>
              </div>
            )}

            {msg.role === 'assistant' && (
              <div style={{ fontSize: 12.5 }}>
                {renderMessageContent(msg.content)}
              </div>
            )}

            {msg.role === 'tool' && (
              <div style={{
                padding: '6px 0',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: msg.pendingApproval ? 6 : 0,
                }}>
                  <span style={{
                    display: 'inline-block',
                    width: 6, height: 6,
                    borderRadius: '50%',
                    background: msg.pendingApproval ? '#d97706' : 'var(--c-green)',
                  }} />
                  <span style={{ fontSize: 11, color: 'var(--m-fg-3)' }}>
                    {getToolLabel(msg.content)}
                  </span>
                </div>
                {msg.pendingApproval && (
                  <DiffPreview
                    approval={msg.pendingApproval}
                    onApprove={() => approveToolCall(msg.pendingApproval!.callId)}
                    onReject={() => rejectToolCall(msg.pendingApproval!.callId)}
                  />
                )}
              </div>
            )}

            {msg.role === 'system' && (
              <div style={{
                padding: '8px 12px',
                borderRadius: 6,
                background: 'rgba(239,68,68,0.08)',
                color: 'var(--c-red)',
                fontSize: 12,
              }}>
                {msg.content}
              </div>
            )}
          </div>
        ))}

        {/* Streaming text */}
        {streaming && streamingText && (
          <div style={{ padding: '6px 12px', fontSize: 12.5 }}>
            {renderMessageContent(streamingText)}
          </div>
        )}

        {streaming && !streamingText && (
          <div style={{ padding: '6px 12px' }}>
            <span style={{
              display: 'inline-flex',
              gap: 4,
              alignItems: 'center',
              color: 'var(--m-fg-3)',
              fontSize: 12,
            }}>
              Thinking
              <span style={{ animation: 'pulse 1s infinite' }}>...</span>
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ padding: '6px 12px' }}>
            <div style={{
              padding: '8px 12px',
              borderRadius: 6,
              background: 'rgba(239,68,68,0.08)',
              color: 'var(--c-red)',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span>{error}</span>
              <button
                onClick={dismissError}
                style={{
                  padding: '2px 6px',
                  borderRadius: 3,
                  border: 0,
                  background: 'transparent',
                  color: 'var(--c-red)',
                  cursor: 'pointer',
                  fontSize: 11,
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '8px',
        borderTop: '1px solid var(--m-line-soft)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          gap: 6,
          alignItems: 'flex-end',
        }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your notes..."
            rows={2}
            disabled={streaming}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid var(--m-line)',
              background: 'var(--m-bg)',
              color: 'var(--m-fg)',
              fontSize: 12.5,
              fontFamily: 'inherit',
              lineHeight: 1.4,
              outline: 'none',
              resize: 'none',
              opacity: streaming ? 0.5 : 1,
            }}
          />
          {streaming ? (
            <button
              onClick={cancelStream}
              style={{
                padding: '10px 12px',
                borderRadius: 6,
                border: '1px solid var(--m-line)',
                background: 'var(--m-bg-2)',
                color: 'var(--m-fg-2)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              Stop
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              style={{
                padding: '10px 14px',
                borderRadius: 6,
                border: 0,
                background: input.trim() ? 'var(--m-vein)' : 'var(--m-bg-2)',
                color: input.trim() ? '#fff' : 'var(--m-fg-3)',
                cursor: input.trim() ? 'pointer' : 'default',
                fontSize: 12,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
