import { useState, useCallback, memo } from 'react'
import { Icons } from '../../lib/icons'
import { renderMarkdown } from '../../lib/markdown'
import type { ChatMessage } from './types'

function formatRelativeDate(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString('en', { day: 'numeric', month: 'short' })
}

/* ── Copy button with check feedback ── */
export const CopyButton = memo(function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [text])

  return (
    <button className="zw-msg-action-btn" onClick={handleCopy} title="Copy">
      {copied ? Icons.check() : Icons.copy()}
    </button>
  )
})

/* ── User message with inline edit ── */
export const UserMessage = memo(function UserMessage({
  message,
  onRetry,
  onEdit,
}: {
  message: ChatMessage
  onRetry?: (content: string) => void
  onEdit?: (messageId: string, newContent: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(message.content)

  const handleSave = useCallback(() => {
    if (editText.trim() && onEdit) {
      onEdit(message.id, editText.trim())
    }
    setEditing(false)
  }, [editText, onEdit, message.id])

  const handleCancel = useCallback(() => {
    setEditText(message.content)
    setEditing(false)
  }, [message.content])

  return (
    <div className="zw-chat-msg zw-chat-msg-user">
      {editing ? (
        <div className="zw-edit-wrap">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="zw-edit-textarea"
            rows={3}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave() }
              if (e.key === 'Escape') handleCancel()
            }}
          />
          <div className="zw-edit-actions">
            <button className="zw-edit-cancel" onClick={handleCancel}>Cancel</button>
            <button className="zw-edit-save" onClick={handleSave}>Save & Resend</button>
          </div>
        </div>
      ) : (
        <div className="zw-chat-bubble-user">{message.content}</div>
      )}
      <div className="zw-msg-actions">
        <span className="zw-msg-time">{formatRelativeDate(message.timestamp)}</span>
        <button className="zw-msg-action-btn" onClick={() => onRetry?.(message.content)} title="Retry">
          {Icons.refresh()}
        </button>
        <button
          className="zw-msg-action-btn"
          onClick={() => { setEditText(message.content); setEditing(true) }}
          title="Edit"
        >
          {Icons.edit()}
        </button>
        <CopyButton text={message.content} />
      </div>
    </div>
  )
})

/* ── Parse search cards from content ── */
interface SearchCard {
  id: string
  title: string
  snippet: string
}

function parseSearchCards(content: string): { cards: SearchCard[]; cleanContent: string } {
  const cards: SearchCard[] = []
  const cleanContent = content.replace(/<!--SEARCH_CARD:([^:]+):([^:]+):([^-]*)-->/g, (_, id, title, snippet) => {
    cards.push({ id, title, snippet })
    return ''
  }).trim()
  return { cards, cleanContent }
}

/* ── Assistant message with markdown + search cards ── */
export const AssistantMessage = memo(function AssistantMessage({
  message,
  onRetry,
  onOpenNote,
}: {
  message: ChatMessage
  onRetry?: (content: string) => void
  onOpenNote?: (id: string) => void
}) {
  const { cards, cleanContent } = parseSearchCards(message.content)

  return (
    <div className="zw-chat-msg zw-chat-msg-ai">
      <div className="zw-chat-bubble-ai">
        <div
          className="zw-chat-ai-content zn-preview"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(cleanContent) }}
        />
        {cards.length > 0 && (
          <div className="zw-chat-search-cards">
            {cards.map((card) => (
              <button
                key={card.id}
                className="zw-chat-search-card"
                onClick={() => onOpenNote?.(card.id)}
              >
                <div className="zw-chat-search-card__url">
                  {Icons.file()}
                  <span>zarnet.app / notes / {card.id.slice(0, 8)}</span>
                </div>
                <div className="zw-chat-search-card__title">{card.title}</div>
                <div className="zw-chat-search-card__snippet">{card.snippet}</div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="zw-msg-actions">
        <CopyButton text={message.content} />
        <button className="zw-msg-action-btn" onClick={() => onRetry?.(message.content)} title="Retry">
          {Icons.refresh()}
        </button>
      </div>
    </div>
  )
})
