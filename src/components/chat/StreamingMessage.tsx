import { memo } from 'react'
import { renderMarkdown } from '../../lib/markdown'
import type { StreamingState } from '../../types/chat'
import DOMPurify from 'dompurify'

interface StreamingMessageProps {
  state: StreamingState
}

export const StreamingMessage = memo(function StreamingMessage({ state }: StreamingMessageProps) {
  if (state.status === 'idle' || state.status === 'done') return null

  return (
    <div className="chat-msg chat-msg--ai">
      {state.status === 'connecting' && (
        <div className="chat-thinking">
          <div className="chat-thinking__dots">
            <span className="chat-thinking__dot" />
            <span className="chat-thinking__dot" />
            <span className="chat-thinking__dot" />
          </div>
          <span className="chat-thinking__label">Thinking...</span>
        </div>
      )}

      {state.status === 'streaming' && state.text && (
        <div className="chat-bubble-ai">
          <div
            className="chat-ai-content zn-preview"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderMarkdown(state.text)) }}
          />
          <span className="chat-cursor" />
        </div>
      )}

      {state.status === 'streaming' && !state.text && (
        <div className="chat-thinking">
          <div className="chat-thinking__dots">
            <span className="chat-thinking__dot" />
            <span className="chat-thinking__dot" />
            <span className="chat-thinking__dot" />
          </div>
        </div>
      )}

      {state.status === 'error' && (
        <div className="chat-error">
          <p>{state.error || 'An error occurred while generating the response.'}</p>
        </div>
      )}
    </div>
  )
})
