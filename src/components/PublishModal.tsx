import { useState, useCallback } from 'react'
import { Icons } from '../lib/icons'
import type { Note } from '../types'

interface PublishModalProps {
  note: Note
  onClose: () => void
  onPublish: (note: Note, author: string) => void
}

export function PublishModal({ note, onClose, onPublish }: PublishModalProps) {
  const [publishMessage, setPublishMessage] = useState('')
  const [publishState, setPublishState] = useState<'idle' | 'loading' | 'done'>('idle')

  const handleConfirmPublish = useCallback(() => {
    if (publishState !== 'idle') return
    setPublishState('loading')
    setTimeout(() => {
      onPublish(note, 'You')
      setPublishState('done')
      setTimeout(() => {
        onClose()
      }, 1200)
    }, 600)
  }, [note, publishState, onPublish, onClose])

  return (
    <div className="publish-overlay" onClick={() => publishState === 'idle' && onClose()}>
      <div className="publish-card" onClick={(e) => e.stopPropagation()}>
        <div className="publish-card__header">
          <h3>Publish with thread</h3>
          <button className="publish-card__close" onClick={() => publishState === 'idle' && onClose()}>
            {Icons.x()}
          </button>
        </div>
        <div className="publish-card__tweet">
          <div className="publish-card__avatar">Y</div>
          <textarea
            className="publish-card__input"
            placeholder="What's happening?"
            value={publishMessage}
            onChange={(e) => setPublishMessage(e.target.value)}
            maxLength={280}
          />
        </div>
        <div className="publish-card__attached">
          <div className="publish-card__doc-icon">{Icons.file()}</div>
          <div className="publish-card__doc-meta">
            <span className="publish-card__doc-name">{note.title || 'Untitled'}</span>
            <span className="publish-card__doc-size">{note.content.length} chars</span>
          </div>
        </div>
        <div className="publish-card__footer">
          <span className="publish-card__count">{publishMessage.length} / 280</span>
          <button
            className={`publish-card__btn ${publishState}`}
            onClick={handleConfirmPublish}
            disabled={publishState !== 'idle'}
          >
            {publishState === 'loading' ? (
              <span className="publish-card__spinner" />
            ) : publishState === 'done' ? (
              Icons.check()
            ) : (
              Icons.upload()
            )}
            <span>{publishState === 'done' ? 'Published' : 'Publish'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
