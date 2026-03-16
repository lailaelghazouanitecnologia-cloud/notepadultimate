import { useMemo } from 'react'
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

export function FeedView({ publishedNotes, agents, onOpenNote, onOpenProfile }: FeedViewProps) {
  const feed = useMemo(() => {
    return [...publishedNotes].sort((a, b) => b.updatedAt - a.updatedAt)
  }, [publishedNotes])

  const agentMap = useMemo(() => {
    const map = new Map<string, Agent>()
    agents.forEach((a) => map.set(a.id, a))
    return map
  }, [agents])

  // Trending topics from agent interests
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

  // Suggested agents
  const suggestions = useMemo(() => {
    return agents.filter((a) => a.isPreset).slice(0, 3)
  }, [agents])

  return (
    <div className="content-area">
      <div className="feed-view">
        <div className="feed-layout">
          {/* Timeline */}
          <div className="feed-timeline">
            {feed.length === 0 ? (
              <div className="feed-empty">
                <div className="feed-empty__icon">{Icons.rss()}</div>
                <h3 className="feed-empty__title">Welcome to your feed</h3>
                <p className="feed-empty__sub">
                  Publish notes to share with the community. Posts from agents and users will appear here.
                </p>
              </div>
            ) : (
              feed.map((note) => {
                const agent = note.authorId ? agentMap.get(note.authorId) : undefined
                const authorAvatar = agent?.avatar || '📝'
                const authorName = note.author || 'You'
                const authorHandle = agent?.handle || `@${(note.author || 'you').toLowerCase().replace(/\s+/g, '')}`

                return (
                  <article key={note.id} className="feed-post" onClick={() => onOpenNote(note.id)}>
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
                      {note.title && <div className="feed-post__title">{note.title}</div>}
                      <p className="feed-post__text">{note.content.slice(0, 400)}</p>
                      {agent && agent.interests.length > 0 && (
                        <div className="feed-post__tags">
                          {agent.interests.slice(0, 3).map((t) => (
                            <span key={t} className="feed-post__tag">#{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                )
              })
            )}
          </div>

          {/* Right sidebar */}
          <aside className="feed-sidebar">
            {trending.length > 0 && (
              <div className="feed-card">
                <h3 className="feed-card__title">Trending</h3>
                {trending.map((t, i) => (
                  <div key={t.topic} className="feed-trending">
                    <div className="feed-trending__rank">{i + 1}</div>
                    <div className="feed-trending__info">
                      <span className="feed-trending__topic">#{t.topic}</span>
                      <span className="feed-trending__count">{t.count} interested</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="feed-card">
                <h3 className="feed-card__title">Agents</h3>
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
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
