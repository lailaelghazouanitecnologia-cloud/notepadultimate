import { memo } from 'react'
import type { ChatMode } from '../../types/chat'

interface ChatFooterProps {
  mode: ChatMode
  messageCount: number
  noteCount: number
  publishedCount: number
}

export const ChatFooter = memo(function ChatFooter({ mode, messageCount, noteCount, publishedCount }: ChatFooterProps) {
  const totalTokens = messageCount * 280

  return (
    <div className="zw-chat-footer">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span className="zw-chat-footer-name">Zarnet</span>
        {mode !== 'idle' && (
          <span className="zw-chat-mode-badge">
            {mode === 'search' ? 'Search' : 'Chat'}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="zw-chat-op-indicator" data-op={mode === 'chat' ? 'read' : 'idle'} />
          <span className="zw-chat-op-indicator" data-op="idle" />
        </div>
        {mode === 'chat' && messageCount > 0 && (
          <>
            <span className="zw-stat-sep" />
            <span className="zw-chat-footer-stat">~{totalTokens} tokens</span>
          </>
        )}
        <span className="zw-stat-sep" />
        <span className="zw-chat-footer-stat">{noteCount} notes · {publishedCount} published</span>
      </div>
    </div>
  )
})
