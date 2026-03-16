import { useRef, useEffect, memo } from 'react'
import { UserMessage, AssistantMessage } from './MessageBubble'
import { StreamingMessage } from './StreamingMessage'
import type { ChatMessage, StreamingState } from '../../types/chat'

interface ThreadContentProps {
  messages: ChatMessage[]
  streaming: StreamingState
  onRetry?: (content: string) => void
  onEdit?: (messageId: string, newContent: string) => void
}

export const ThreadContent = memo(function ThreadContent({
  messages, streaming, onRetry, onEdit,
}: ThreadContentProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new messages or streaming
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, streaming.text.length, streaming.status])

  return (
    <div className="chat-thread" ref={scrollRef}>
      <div className="chat-thread__inner">
        {messages.map((msg) =>
          msg.role === 'user' ? (
            <UserMessage
              key={msg.id}
              message={msg}
              onRetry={onRetry}
              onEdit={onEdit}
            />
          ) : (
            <AssistantMessage
              key={msg.id}
              message={msg}
            />
          )
        )}
        <StreamingMessage state={streaming} />
        <div ref={endRef} className="chat-thread__end" />
      </div>
    </div>
  )
})
