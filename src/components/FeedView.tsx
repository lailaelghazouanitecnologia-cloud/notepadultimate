import { useMemo, useState } from 'react'
import type { Note, Agent } from '../types'
import { Icons } from '../lib/icons'

interface FeedViewProps {
  publishedNotes: Note[]
  agents: Agent[]
  onOpenNote: (noteId: string) => void
  onOpenProfile: (agentId: string) => void
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(ts).toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

export function FeedView({ publishedNotes, agents, onOpenNote, onOpenProfile }: FeedViewProps) {
  const [tab, setTab] = useState<'foryou' | 'following'>('foryou')

  const feed = useMemo(() => {
    return [...publishedNotes].sort((a, b) => b.updatedAt - a.updatedAt)
  }, [publishedNotes])

  const agentMap = useMemo(() => {
    const map = new Map<string, Agent>()
    agents.forEach((a) => map.set(a.id, a))
    return map
  }, [agents])

  return (
    <div className="content-area">
      <div className="feed-view">
        {/* Feed tabs */}
        <div className="feed-tabs">
          <button
            className={`feed-tabs__tab ${tab === 'foryou' ? 'active' : ''}`}
            onClick={() => setTab('foryou')}
          >
            For you
          </button>
          <button
            className={`feed-tabs__tab ${tab === 'following' ? 'active' : ''}`}
            onClick={() => setTab('following')}
          >
            Following
          </button>
        </div>

        {/* Timeline */}
        <div className="feed-timeline">
          {feed.length === 0 && (
            <div className="feed-empty">
              <div className="feed-empty__icon">{Icons.rss()}</div>
              <h3 className="feed-empty__title">Your feed is empty</h3>
              <p className="feed-empty__text">
                Publish notes to see them here. Content from the community will appear in your timeline.
              </p>
            </div>
          )}

          {feed.map((note) => {
            const agent = note.authorId ? agentMap.get(note.authorId) : undefined
            const authorAvatar = agent?.avatar || '📝'
            const authorName = note.author || 'Unknown'
            const authorHandle = agent?.handle || `@${(note.author || 'user').toLowerCase().replace(/\s/g, '')}`
            const wordCount = note.content.trim().split(/\s+/).filter(Boolean).length

            return (
              <article key={note.id} className="feed-post">
                <div
                  className="feed-post__avatar"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (agent) onOpenProfile(agent.id)
                  }}
                  style={{ cursor: agent ? 'pointer' : 'default' }}
                >
                  {authorAvatar}
                </div>
                <div className="feed-post__body">
                  <div className="feed-post__header">
                    <span
                      className="feed-post__name"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (agent) onOpenProfile(agent.id)
                      }}
                    >
                      {authorName}
                    </span>
                    <span className="feed-post__handle">{authorHandle}</span>
                    <span className="feed-post__dot">&middot;</span>
                    <span className="feed-post__time">{formatRelative(note.updatedAt)}</span>
                  </div>
                  <div className="feed-post__content" onClick={() => onOpenNote(note.id)}>
                    <h3 className="feed-post__title">{note.title}</h3>
                    <p className="feed-post__text">{note.content.slice(0, 280)}</p>
                  </div>
                  <div className="feed-post__actions">
                    <button className="feed-post__action">
                      {Icons.messageCircle()}
                      <span>0</span>
                    </button>
                    <button className="feed-post__action">
                      {Icons.heart()}
                      <span>0</span>
                    </button>
                    <button className="feed-post__action">
                      {Icons.eye()}
                      <span>{wordCount}w</span>
                    </button>
                    <button className="feed-post__action">
                      {Icons.upload()}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
