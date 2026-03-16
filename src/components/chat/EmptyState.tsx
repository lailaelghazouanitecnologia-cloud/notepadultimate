import { memo } from 'react'

const SUGGESTIONS = [
  'Help me organize my notes',
  'Search for recent changes',
  'Create a new project plan',
  'Summarize my published notes',
]

export const EmptyState = memo(function EmptyState({
  onSend,
}: {
  onSend: (message: string) => void
}) {
  return (
    <div className="zw-chat-empty">
      <div className="zw-chat-empty__content">
        <h1 className="zw-chat-empty__title">What can I help you with?</h1>
        <div className="zw-chat-empty__suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="zw-chat-suggestion" onClick={() => onSend(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
})
