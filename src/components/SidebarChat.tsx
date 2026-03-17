import type { ChatSession } from '../contexts/UIContext'
import { Icons } from '../lib/icons'

interface SidebarChatProps {
  chatSessions: ChatSession[]
  activeChatId: string | null
  onNewChat: () => void
  onOpenChat: (id: string) => void
}

export function SidebarChat({ chatSessions, activeChatId, onNewChat, onOpenChat }: SidebarChatProps) {
  return (
    <div className="sb-panel sb-panel--chat">
      <div className="sb-section">
        <div className="sb-section__header">
          <span className="sb-section__title">Conversations</span>
          <button className="sb-section__action" onClick={onNewChat} title="New chat">
            {Icons.plus()}
          </button>
        </div>
        <div className="sb-section__list">
          {chatSessions.length === 0 ? (
            <div className="sb-empty">
              <span className="sb-empty__text">No conversations yet</span>
              <button className="sb-empty__btn" onClick={onNewChat}>
                {Icons.plus()}
                <span>Start a chat</span>
              </button>
            </div>
          ) : (
            chatSessions.map(session => (
              <button
                key={session.id}
                className={`sb-chat-item ${activeChatId === session.id ? 'active' : ''}`}
                onClick={() => onOpenChat(session.id)}
              >
                <div className="sb-chat-item__icon">
                  {Icons.messageCircle()}
                </div>
                <div className="sb-chat-item__info">
                  <span className="sb-chat-item__title">{session.title || 'Untitled chat'}</span>
                  <span className="sb-chat-item__meta">{session.messages.length} messages</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
