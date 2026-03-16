import { useState, useCallback, memo } from 'react'
import { Icons } from '../../lib/icons'
import { renderMarkdown } from '../../lib/markdown'
import type { ChatMessage } from '../../types/chat'
import DOMPurify from 'dompurify'

interface MessageBubbleProps {
  message: ChatMessage
  onRetry?: (content: string) => void
  onEdit?: (messageId: string, newContent: string) => void
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export const UserMessage = memo(function UserMessage({ message, onRetry, onEdit }: MessageBubbleProps) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(message.content)
  const [copied, setCopied] = useState(false)

  const handleSave = useCallback(() => {
    if (editText.trim() && onEdit) {
      onEdit(message.id, editText.trim())
    }
    setEditing(false)
  }, [editText, onEdit, message.id])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [message.content])

  return (
    <div className="chat-msg chat-msg--user">
      {editing ? (
        <div className="chat-edit-wrap">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="chat-edit-textarea"
            rows={3}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave() }
              if (e.key === 'Escape') { setEditText(message.content); setEditing(false) }
            }}
          />
          <div className="chat-edit-actions">
            <button className="chat-edit-btn" onClick={() => { setEditText(message.content); setEditing(false) }}>
              Cancel
            </button>
            <button className="chat-edit-btn chat-edit-btn--save" onClick={handleSave}>
              Save & Resend
            </button>
          </div>
        </div>
      ) : (
        <div className="chat-bubble-user">
          <p>{message.content}</p>
        </div>
      )}
      <div className="chat-msg__actions">
        <span className="chat-msg__time">{formatTime(message.timestamp)}</span>
        {onRetry && (
          <button className="chat-msg__action-btn" onClick={() => onRetry(message.content)} title="Retry">
            {Icons.refresh()}
          </button>
        )}
        <button className="chat-msg__action-btn" onClick={() => { setEditText(message.content); setEditing(true) }} title="Edit">
          {Icons.edit()}
        </button>
        <button className="chat-msg__action-btn" onClick={handleCopy} title="Copy">
          {copied ? Icons.check() : Icons.copy()}
        </button>
      </div>
    </div>
  )
})

export const AssistantMessage = memo(function AssistantMessage({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [message.content])

  const html = renderMarkdown(message.content)

  return (
    <div className="chat-msg chat-msg--ai">
      <div className="chat-bubble-ai">
        <div
          className="chat-ai-content zn-preview"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
        />
      </div>
      <div className="chat-msg__actions">
        <span className="chat-msg__time">{formatTime(message.timestamp)}</span>
        <button className="chat-msg__action-btn" onClick={handleCopy} title="Copy">
          {copied ? Icons.check() : Icons.copy()}
        </button>
      </div>
    </div>
  )
})
