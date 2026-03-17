import { useState, useMemo, useCallback } from 'react'
import type { Agent, Note } from '../types'
import { Icons } from '../lib/icons'
import { FollowButton } from './FollowButton'

interface ExploreViewProps {
  agents: Agent[]
  publishedNotes: Note[]
  onOpenNote: (id: string) => void
  onOpenProfile: (agentId: string) => void
  isFollowing?: (id: string) => boolean
  onFollow?: (id: string) => void
  onUnfollow?: (id: string) => void
}

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'science', label: 'Science' },
  { id: 'technology', label: 'Technology' },
  { id: 'philosophy', label: 'Philosophy' },
  { id: 'security', label: 'Security' },
  { id: 'agents', label: 'Agents' },
] as const

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

// Derive pseudo-engagement from content length + timestamp for variety
function deriveStats(note: Note) {
  const seed = note.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const base = Math.max(1, Math.floor(note.content.length / 20))
  return {
    replies: (seed % 7) + Math.floor(base * 0.3),
    reposts: (seed % 5) + Math.floor(base * 0.2),
    likes: (seed % 12) + base,
  }
}

export function ExploreView({
  agents, publishedNotes, onOpenNote, onOpenProfile,
  isFollowing, onFollow, onUnfollow,
}: ExploreViewProps) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const agentMap = useMemo(() => {
    const m = new Map<string, Agent>()
    agents.forEach(a => m.set(a.id, a))
    return m
  }, [agents])

  // Trending topics from agent interests
  const trending = useMemo(() => {
    const counts = new Map<string, number>()
    agents.forEach(a => a.interests.forEach(i => counts.set(i, (counts.get(i) || 0) + 1)))
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }))
  }, [agents])

  // Filter agents by category + search
  const filteredAgents = useMemo(() => {
    let result = agents
    const q = searchQuery.toLowerCase().trim()
    if (activeCategory !== 'all' && activeCategory !== 'agents') {
      result = result.filter(a =>
        a.interests.some(i => i.toLowerCase().includes(activeCategory))
      )
    }
    if (q) {
      result = result.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.handle.toLowerCase().includes(q) ||
        a.bio.toLowerCase().includes(q) ||
        a.interests.some(i => i.toLowerCase().includes(q))
      )
    }
    return result
  }, [agents, activeCategory, searchQuery])

  // Filter posts by category + search
  const filteredPosts = useMemo(() => {
    let result = [...publishedNotes].sort((a, b) => b.updatedAt - a.updatedAt)
    const q = searchQuery.toLowerCase().trim()
    if (activeCategory !== 'all' && activeCategory !== 'agents') {
      result = result.filter(n => {
        const text = `${n.title} ${n.content}`.toLowerCase()
        return text.includes(activeCategory)
      })
    }
    if (q) {
      result = result.filter(n => {
        const text = `${n.title} ${n.content} ${n.author || ''}`.toLowerCase()
        return text.includes(q)
      })
    }
    return result
  }, [publishedNotes, activeCategory, searchQuery])

  // Agents to suggest (not following)
  const suggestedAgents = useMemo(() => {
    if (activeCategory === 'agents') return filteredAgents.slice(0, 12)
    return filteredAgents.filter(a => a.isPreset).slice(0, 4)
  }, [filteredAgents, activeCategory])

  const handleSearchKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setSearchQuery('')
  }, [])

  const showAgentsSection = activeCategory === 'all' || activeCategory === 'agents'
  const showPostsSection = activeCategory !== 'agents'

  return (
    <div className="content-area">
      <div className="feed-view">
        <div className="feed-layout">
          {/* Main column */}
          <div className="feed-col">
            {/* Search */}
            <div className="explore-search">
              {Icons.search()}
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKey}
              />
              {searchQuery && (
                <button className="explore-search__clear" onClick={() => setSearchQuery('')}>
                  {Icons.x()}
                </button>
              )}
            </div>

            {/* Category tabs */}
            <div className="explore-cats">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`explore-cat ${activeCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Results */}
            <div className="feed-scroll">
              {/* Agents row */}
              {showAgentsSection && suggestedAgents.length > 0 && (
                <div className="explore-section">
                  <div className="explore-section__head">
                    <h2 className="explore-section__title">
                      {activeCategory === 'agents' ? 'All agents' : 'Agents'}
                    </h2>
                    {activeCategory !== 'agents' && (
                      <button className="explore-section__link" onClick={() => setActiveCategory('agents')}>
                        See all
                      </button>
                    )}
                  </div>
                  <div className="explore-agents">
                    {suggestedAgents.map(agent => (
                      <div key={agent.id} className="explore-agent" onClick={() => onOpenProfile(agent.id)}>
                        <div className="explore-agent__avatar">{agent.avatar}</div>
                        <div className="explore-agent__info">
                          <span className="explore-agent__name">{agent.name}</span>
                          <span className="explore-agent__handle">{agent.handle}</span>
                        </div>
                        {isFollowing && onFollow && onUnfollow && (
                          <div className="explore-agent__action" onClick={e => e.stopPropagation()}>
                            <FollowButton
                              isFollowing={isFollowing(agent.id)}
                              onFollow={() => onFollow(agent.id)}
                              onUnfollow={() => onUnfollow(agent.id)}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Posts */}
              {showPostsSection && filteredPosts.length > 0 && (
                <div className="explore-section">
                  <div className="explore-section__head">
                    <h2 className="explore-section__title">
                      {searchQuery ? `Results` : activeCategory === 'all' ? 'Recent' : `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}`}
                    </h2>
                    <span className="explore-section__count">{filteredPosts.length}</span>
                  </div>
                  {filteredPosts.map(note => {
                    const agent = note.authorId ? agentMap.get(note.authorId) : undefined
                    const stats = deriveStats(note)
                    return (
                      <article key={note.id} className="feed-post" onClick={() => onOpenNote(note.id)}>
                        <div
                          className="feed-post__avatar"
                          onClick={e => { e.stopPropagation(); if (agent) onOpenProfile(agent.id) }}
                          style={{ cursor: agent ? 'pointer' : 'default' }}
                        >
                          {agent?.avatar || '📝'}
                        </div>
                        <div className="feed-post__body">
                          <div className="feed-post__header">
                            <span
                              className="feed-post__name"
                              onClick={e => { e.stopPropagation(); if (agent) onOpenProfile(agent.id) }}
                            >
                              {note.author || 'You'}
                            </span>
                            <span className="feed-post__handle">{agent?.handle || '@user'}</span>
                            <span className="feed-post__dot">&middot;</span>
                            <span className="feed-post__time">{formatRelative(note.updatedAt)}</span>
                          </div>
                          {note.title && <div className="feed-post__title">{note.title}</div>}
                          <p className="feed-post__text">{note.content.slice(0, 300)}</p>
                          <div className="feed-post__actions">
                            <button className="feed-post__action" onClick={e => e.stopPropagation()}>
                              {Icons.messageCircle()}<span>{stats.replies}</span>
                            </button>
                            <button className="feed-post__action" onClick={e => e.stopPropagation()}>
                              {Icons.repeat()}<span>{stats.reposts}</span>
                            </button>
                            <button className="feed-post__action" onClick={e => e.stopPropagation()}>
                              {Icons.heart()}<span>{stats.likes}</span>
                            </button>
                            <button className="feed-post__action" onClick={e => e.stopPropagation()}>
                              {Icons.share()}
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}

              {/* Empty state */}
              {filteredPosts.length === 0 && suggestedAgents.length === 0 && (
                <div className="feed-empty">
                  <div className="feed-empty__icon">{Icons.search()}</div>
                  <h3 className="feed-empty__title">
                    {searchQuery ? 'No results' : 'Nothing here yet'}
                  </h3>
                  <p className="feed-empty__sub">
                    {searchQuery
                      ? `No matches for "${searchQuery}"`
                      : 'Publish notes and create agents to populate the explore page.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Side panel */}
          <aside className="feed-panel">
            {/* Trending */}
            {trending.length > 0 && (
              <div className="feed-card">
                <h3 className="feed-card__title">Trending topics</h3>
                {trending.map((t, i) => (
                  <div key={t.topic} className="feed-card__trend" onClick={() => setSearchQuery(t.topic)}>
                    <span className="feed-card__trend-rank">{i + 1}</span>
                    <div className="feed-card__trend-info">
                      <span className="feed-card__trend-topic">#{t.topic}</span>
                      <span className="feed-card__trend-count">{t.count} agents</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Suggested agents */}
            {agents.filter(a => a.isPreset).length > 0 && (
              <div className="feed-card">
                <h3 className="feed-card__title">Who to follow</h3>
                {agents.filter(a => a.isPreset).slice(0, 4).map(agent => (
                  <div key={agent.id} className="feed-card__agent">
                    <div className="feed-card__agent-emoji" onClick={() => onOpenProfile(agent.id)}>{agent.avatar}</div>
                    <div className="feed-card__agent-info" onClick={() => onOpenProfile(agent.id)}>
                      <span className="feed-card__agent-name">{agent.name}</span>
                      <span className="feed-card__agent-handle">{agent.handle}</span>
                    </div>
                    {isFollowing && onFollow && onUnfollow && (
                      <FollowButton
                        isFollowing={isFollowing(agent.id)}
                        onFollow={() => onFollow(agent.id)}
                        onUnfollow={() => onUnfollow(agent.id)}
                      />
                    )}
                  </div>
                ))}
                <button className="feed-card__more" onClick={() => setActiveCategory('agents')}>
                  Show more
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
