import { memo } from 'react'
import { renderMarkdown } from '../../lib/markdown'
import type { StreamingState } from './types'

export const StreamingMessage = memo(function StreamingMessage({
  streaming,
}: {
  streaming: StreamingState
}) {
  if (streaming.status === 'idle' || streaming.status === 'completed') return null

  if (streaming.status === 'error') {
    return (
      <div className="zw-chat-msg zw-chat-msg-ai">
        <div className="zw-chat-error">
          <p>{streaming.error || 'An error occurred while generating the response.'}</p>
        </div>
      </div>
    )
  }

  if (streaming.status === 'connecting') {
    return (
      <div className="zw-chat-msg zw-chat-msg-ai">
        <div className="zw-thinking">
          <div className="zw-thinking__dots">
            <span className="zw-thinking__dot" />
            <span className="zw-thinking__dot" />
            <span className="zw-thinking__dot" />
          </div>
          <span className="zw-thinking__label">Thinking...</span>
        </div>
      </div>
    )
  }

  // streaming text
  return (
    <div className="zw-chat-msg zw-chat-msg-ai">
      <div className="zw-chat-bubble-ai">
        <div
          className="zw-chat-ai-content zn-preview"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(streaming.text) }}
        />
        <span className="zw-cursor" />
      </div>
    </div>
  )
})
