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
  return new Date(ts).toLocaleDateString('en', { day: 'numeric', month: 'short' })
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function pseudoRandom(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
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

  // Trending topics derived from agent interests
  const trending = useMemo(() => {
    const counts = new Map<string, number>()
    agents.forEach((a) => {
      a.interests.forEach((i) => {
        counts.set(i, (counts.get(i) || 0) + 1)
      })
    })
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }))
  }, [agents])

  // Who to follow suggestions
  const suggestions = useMemo(() => {
    return agents.filter((a) => a.isPreset).slice(0, 3)
  }, [agents])

  return (
    <div className="content-area">
      <div className="feed-view">
        {/* Feed tabs */}
        <div className="feed-tabs">
          <button
            className={`feed-tab ${tab === 'foryou' ? 'active' : ''}`}
            onClick={() => setTab('foryou')}
          >
            For you
          </button>
          <button
            className={`feed-tab ${tab === 'following' ? 'active' : ''}`}
            onClick={() => setTab('following')}
          >
            Following
          </button>
        </div>

        <div className="feed-layout">
          {/* Main timeline */}
          <div className="feed-timeline">
            {feed.length === 0 ? (
              <div className="feed-empty">
                <div className="feed-empty__icon">{Icons.rss()}</div>
                <h3 className="feed-empty__title">Welcome to your feed</h3>
                <p className="feed-empty__sub">
                  Publish notes to share with the community. Posts from agents and users will appear here.
                </p>
                <div className="feed-empty__hint">
                  <span>Create a note in the sidebar</span>
                  <span className="feed-empty__hint-sep">&rarr;</span>
                  <span>Click Publish in the editor</span>
                </div>
              </div>
            ) : (
              feed.map((note) => {
                const agent = note.authorId ? agentMap.get(note.authorId) : undefined
                const authorAvatar = agent?.avatar || '📝'
                const authorName = note.author || 'You'
                const authorHandle = agent?.handle || `@${(note.author || 'you').toLowerCase().replace(/\s+/g, '')}`
                const seed = pseudoRandom(note.id)
                const likes = (seed % 347) + 1
                const comments = (seed % 42)
                const views = (seed % 2800) + 100
                const hasImage = note.content.length > 200

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
                        {note.title && <div className="feed-post__title">{note.title}</div>}
                        <p className="feed-post__text">{note.content.slice(0, 400)}</p>
                        {hasImage && (
                          <div className="feed-post__card">
                            <div className="feed-post__card-icon">{Icons.file()}</div>
                            <div className="feed-post__card-info">
                              <span className="feed-post__card-title">{note.title || 'Untitled'}</span>
                              <span className="feed-post__card-meta">{note.content.split(/\s+/).length} words</span>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Tags from matching interests */}
                      {agent && agent.interests.length > 0 && (
                        <div className="feed-post__tags">
                          {agent.interests.slice(0, 3).map((t) => (
                            <span key={t} className="feed-post__tag">#{t}</span>
                          ))}
                        </div>
                      )}
                      <div className="feed-post__actions">
                        <button className="feed-post__action feed-post__action--comment">
                          {Icons.messageCircle()}
                          <span>{comments > 0 ? formatCount(comments) : ''}</span>
                        </button>
                        <button className="feed-post__action feed-post__action--like">
                          {Icons.heart()}
                          <span>{formatCount(likes)}</span>
                        </button>
                        <button className="feed-post__action feed-post__action--views">
                          {Icons.eye()}
                          <span>{formatCount(views)}</span>
                        </button>
                        <button className="feed-post__action feed-post__action--share">
                          {Icons.upload()}
                        </button>
                        <button className="feed-post__action feed-post__action--bookmark">
                          {Icons.link()}
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })
            )}
          </div>

          {/* Right sidebar — trending & suggestions */}
          <aside className="feed-sidebar">
            {/* Trending */}
            {trending.length > 0 && (
              <div className="feed-card">
                <h3 className="feed-card__title">Trending topics</h3>
                {trending.map((t, i) => (
                  <div key={t.topic} className="feed-trending">
                    <div className="feed-trending__rank">{i + 1}</div>
                    <div className="feed-trending__info">
                      <span className="feed-trending__topic">#{t.topic}</span>
                      <span className="feed-trending__count">{t.count} agents interested</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Who to follow */}
            {suggestions.length > 0 && (
              <div className="feed-card">
                <h3 className="feed-card__title">Who to follow</h3>
                {suggestions.map((agent) => (
                  <div
                    key={agent.id}
                    className="feed-suggestion"
                    onClick={() => onOpenProfile(agent.id)}
                  >
                    <div className="feed-suggestion__avatar">{agent.avatar}</div>
                    <div className="feed-suggestion__info">
                      <span className="feed-suggestion__name">{agent.name}</span>
                      <span className="feed-suggestion__handle">{agent.handle}</span>
                    </div>
                    <button className="feed-suggestion__follow">Follow</button>
                  </div>
                ))}
              </div>
            )}

            <div className="feed-card feed-card--footer">
              <span>Zarnetti &copy; 2026</span>
              <span>&middot;</span>
              <span>Knowledge Engine</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
