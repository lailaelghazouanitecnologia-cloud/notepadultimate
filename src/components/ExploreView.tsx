import React, { useState, useMemo } from 'react'
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
  { id: 'foryou', label: 'For you', icon: 'zap' },
  { id: 'science', label: 'Science', icon: 'globe' },
  { id: 'technology', label: 'Technology', icon: 'monitor' },
  { id: 'philosophy', label: 'Philosophy', icon: 'book' },
  { id: 'security', label: 'Security', icon: 'shield' },
  { id: 'agents', label: 'Agents', icon: 'users' },
] as const

const CAT_ICONS: Record<string, () => React.JSX.Element> = {
  zap: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  globe: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  monitor: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  book: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>,
  shield: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  users: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

export function ExploreView({
  agents, publishedNotes, onOpenNote, onOpenProfile,
  isFollowing, onFollow, onUnfollow,
}: ExploreViewProps) {
  const [activeCategory, setActiveCategory] = useState('foryou')
  const [searchQuery, setSearchQuery] = useState('')

  const trending = useMemo(() => {
    const counts = new Map<string, number>()
    agents.forEach(a => a.interests.forEach(i => counts.set(i, (counts.get(i) || 0) + 1)))
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count], i) => ({ topic, count, rank: i + 1 }))
  }, [agents])

  const suggestedAgents = useMemo(() => agents.filter(a => a.isPreset).slice(0, 6), [agents])

  const popularPosts = useMemo(() => {
    return [...publishedNotes]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 5)
  }, [publishedNotes])

  const agentMap = useMemo(() => {
    const m = new Map<string, Agent>()
    agents.forEach(a => m.set(a.id, a))
    return m
  }, [agents])

  return (
    <div className="content-area">
      <div className="explore">
        <div className="explore-inner">
          {/* Search */}
          <div className="explore-search">
            {Icons.search()}
            <input
              type="text"
              placeholder="Search topics, agents, posts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <kbd>/</kbd>
          </div>

          {/* Category chips */}
          <div className="explore-cats">
            {CATEGORIES.map(cat => {
              const IconComp = CAT_ICONS[cat.icon]
              return (
                <button
                  key={cat.id}
                  className={`explore-cat ${activeCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {IconComp && <IconComp />}
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* Trending */}
          {trending.length > 0 && (
            <div className="explore-section">
              <div className="explore-section__head">
                <h2 className="explore-section__title">Trending</h2>
                <button className="explore-section__link">See all</button>
              </div>
              <div className="explore-trends">
                {trending.map((t, i) => (
                  <div key={t.topic} className="explore-trend">
                    <span className="explore-trend__rank">{t.rank}</span>
                    <div className="explore-trend__body">
                      <span className="explore-trend__topic">#{t.topic}</span>
                      <span className="explore-trend__meta">{t.count} interested</span>
                    </div>
                    {i === 0 && <span className="explore-trend__tag explore-trend__tag--hot">HOT</span>}
                    {i === 1 && <span className="explore-trend__tag explore-trend__tag--new">NEW</span>}
                    {i === 2 && <span className="explore-trend__tag explore-trend__tag--rising">RISING</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested agents */}
          {suggestedAgents.length > 0 && (
            <div className="explore-section">
              <div className="explore-section__head">
                <h2 className="explore-section__title">Suggested agents</h2>
                <button className="explore-section__link">See all</button>
              </div>
              <div className="explore-agents">
                {suggestedAgents.map(agent => (
                  <div key={agent.id} className="explore-agent" onClick={() => onOpenProfile(agent.id)}>
                    <div className="explore-agent__emoji">{agent.avatar}</div>
                    <span className="explore-agent__name">{agent.name}</span>
                    <span className="explore-agent__handle">{agent.handle}</span>
                    <span className="explore-agent__desc">{agent.bio.slice(0, 80)}</span>
                    {isFollowing && onFollow && onUnfollow && (
                      <div onClick={e => e.stopPropagation()}>
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

          {/* Popular posts */}
          {popularPosts.length > 0 && (
            <div className="explore-section">
              <div className="explore-section__head">
                <h2 className="explore-section__title">Popular</h2>
                <button className="explore-section__link">See all</button>
              </div>
              <div className="explore-posts">
                {popularPosts.map(note => {
                  const agent = note.authorId ? agentMap.get(note.authorId) : undefined
                  return (
                    <div key={note.id} className="explore-post" onClick={() => onOpenNote(note.id)}>
                      <div className="explore-post__avatar">{agent?.avatar || '📝'}</div>
                      <div className="explore-post__body">
                        <div className="explore-post__head">
                          <span className="explore-post__author" onClick={e => { e.stopPropagation(); if (agent) onOpenProfile(agent.id) }}>
                            {note.author || 'You'}
                          </span>
                          <span className="explore-post__handle">{agent?.handle || '@user'}</span>
                          <span className="explore-post__dot">&middot;</span>
                          <span className="explore-post__time">{formatRelative(note.updatedAt)}</span>
                        </div>
                        {note.title && <div className="explore-post__title">{note.title}</div>}
                        <div className="explore-post__text">{note.content.slice(0, 200)}</div>
                        <div className="explore-post__stats">
                          <span className="explore-post__stat">{Icons.messageCircle()}<span>0</span></span>
                          <span className="explore-post__stat">{Icons.repeat()}<span>0</span></span>
                          <span className="explore-post__stat">{Icons.heart()}<span>0</span></span>
                          <span className="explore-post__stat">{Icons.share()}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
