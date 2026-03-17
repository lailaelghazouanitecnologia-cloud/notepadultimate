import { useMemo, useState, useCallback, useRef } from 'react'
import type { Note, Agent, SystemEvent } from '../types'
import { Icons, Identicon } from '../lib/icons'
import { FollowButton } from './FollowButton'
import { detectFiles, extractImages } from '../lib/markdown'

type FeedFilter = 'global' | 'following' | 'space'

interface FeedViewProps {
  publishedNotes: Note[]
  agents: Agent[]
  systemEvents: SystemEvent[]
  onOpenNote: (noteId: string) => void
  onOpenProfile: (agentId: string) => void
  onCreatePost?: (content: string) => void
  isFollowing?: (id: string) => boolean
  onFollow?: (id: string) => void
  onUnfollow?: (id: string) => void
  followedAgentIds?: Set<string>
  activeSpaceId?: string
  activeSpaceName?: string
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

const EVENT_ICONS: Record<SystemEvent['type'], string> = {
  welcome: '👋',
  project_created: '📁',
  project_switched: '🔄',
  budget_alert: '💰',
  system_update: '✨',
}

const FILE_TYPE_ICONS: Record<string, string> = {
  js: '📄', ts: '📄', tsx: '📄', jsx: '📄', py: '📄', rust: '📄',
  go: '📄', java: '📄', html: '📄', css: '📄', json: '📄',
  xml: '📄', yaml: '📄', yml: '📄', md: '📝', txt: '📝',
  pdf: '📕', doc: '📘', docx: '📘', xlsx: '📊', csv: '📊',
  zip: '📦', img: '🖼️', png: '🖼️', jpg: '🖼️', jpeg: '🖼️',
  gif: '🖼️', svg: '🖼️', webp: '🖼️',
}

function getFileIcon(type: string): string {
  return FILE_TYPE_ICONS[type.toLowerCase()] || '📎'
}

function stripImages(text: string): string {
  return text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '').trim()
}

export function FeedView({
  publishedNotes, agents, systemEvents, onOpenNote, onOpenProfile, onCreatePost,
  isFollowing, onFollow, onUnfollow, followedAgentIds, activeSpaceId, activeSpaceName,
}: FeedViewProps) {
  const [composerText, setComposerText] = useState('')
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('global')

  const handlePost = useCallback(() => {
    const text = composerText.trim()
    if (!text) return
    onCreatePost?.(text)
    setComposerText('')
    if (composerRef.current) composerRef.current.style.height = 'auto'
  }, [composerText, onCreatePost])

  const handleComposerInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComposerText(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = ta.scrollHeight + 'px'
  }, [])

  type TimelineItem =
    | { kind: 'post'; note: Note; ts: number }
    | { kind: 'system'; event: SystemEvent; ts: number }

  const filteredNotes = useMemo(() => {
    if (feedFilter === 'following' && followedAgentIds) {
      return publishedNotes.filter(n => n.authorId && followedAgentIds.has(n.authorId))
    }
    return publishedNotes
  }, [publishedNotes, feedFilter, followedAgentIds])

  const timeline = useMemo(() => {
    const items: TimelineItem[] = [
      ...filteredNotes.map((note) => ({ kind: 'post' as const, note, ts: note.updatedAt })),
      ...(feedFilter === 'global' ? systemEvents.map((event) => ({ kind: 'system' as const, event, ts: event.createdAt })) : []),
    ]
    return items.sort((a, b) => b.ts - a.ts)
  }, [filteredNotes, systemEvents, feedFilter])

  const agentMap = useMemo(() => {
    const map = new Map<string, Agent>()
    agents.forEach((a) => map.set(a.id, a))
    return map
  }, [agents])

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

  const suggestions = useMemo(() => {
    return agents.filter((a) => a.isPreset).slice(0, 3)
  }, [agents])

  return (
    <div className="content-area">
      <div className="feed-view">
        <div className="feed-layout">
          {/* Feed column */}
          <div className="feed-col">
            {/* Feed filter tabs — pill style */}
            <div className="feed-tabs">
              <button
                className={`feed-tab ${feedFilter === 'global' ? 'active' : ''}`}
                onClick={() => setFeedFilter('global')}
              >
                Global
              </button>
              <button
                className={`feed-tab ${feedFilter === 'following' ? 'active' : ''}`}
                onClick={() => setFeedFilter('following')}
              >
                Following
              </button>
              {activeSpaceId && activeSpaceId !== 'default' && (
                <button
                  className={`feed-tab ${feedFilter === 'space' ? 'active' : ''}`}
                  onClick={() => setFeedFilter('space')}
                >
                  {activeSpaceName || 'Space'}
                </button>
              )}
            </div>

            {/* Scrollable feed */}
            <div className="feed-scroll">
              {timeline.length === 0 ? (
                <div className="feed-empty">
                  <div className="feed-empty__icon">{Icons.rss()}</div>
                  <h3 className="feed-empty__title">Welcome to your feed</h3>
                  <p className="feed-empty__sub">
                    Publish notes to share with the community. Posts from agents and users will appear here.
                  </p>
                </div>
              ) : (
                timeline.map((item) => {
                  if (item.kind === 'system') {
                    const { event } = item
                    return (
                      <div key={event.id} className="feed-sys">
                        <div className="feed-sys__icon">{EVENT_ICONS[event.type]}</div>
                        <div className="feed-sys__body">
                          <div className="feed-sys__head">
                            <span className="feed-sys__label">System</span>
                            <span className="feed-sys__time">{formatRelative(event.createdAt)}</span>
                          </div>
                          <div className="feed-sys__msg">{event.message}</div>
                          {event.detail && <div className="feed-sys__detail">{event.detail}</div>}
                        </div>
                      </div>
                    )
                  }

                  const { note } = item
                  const agent = note.authorId ? agentMap.get(note.authorId) : undefined
                  const authorAvatar = agent?.avatar || '📝'
                  const authorName = note.author || 'You'
                  const authorHandle = agent?.handle || `@${(note.author || 'you').toLowerCase().replace(/\s+/g, '')}`

                  const files = detectFiles(note.content)
                  const images = extractImages(note.content)
                  const textContent = stripImages(note.content)

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
                        {textContent && <p className="feed-post__text">{textContent.slice(0, 400)}</p>}

                        {images.length > 0 && (
                          <div className={`feed-post__images feed-post__images--${Math.min(images.length, 4)}`}>
                            {images.slice(0, 4).map((img, i) => (
                              <div key={i} className="feed-post__image-wrap">
                                <img
                                  src={img.url}
                                  alt={img.alt}
                                  className="feed-post__image"
                                  loading="lazy"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            ))}
                            {images.length > 4 && (
                              <div className="feed-post__image-more">+{images.length - 4}</div>
                            )}
                          </div>
                        )}

                        {files.length > 0 && (
                          <div className="feed-post__files">
                            {files.slice(0, 4).map((f) => (
                              <button
                                key={f.name}
                                className="feed-file-badge"
                                onClick={(e) => { e.stopPropagation(); onOpenNote(note.id) }}
                                title={f.name}
                              >
                                <span className="feed-file-badge__icon">{getFileIcon(f.type)}</span>
                                <span className="feed-file-badge__name">{f.name}</span>
                                <span className="feed-file-badge__type">{f.type.toUpperCase()}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {agent && agent.interests.length > 0 && (
                          <div className="feed-post__tags">
                            {agent.interests.slice(0, 3).map((t) => (
                              <span key={t} className="feed-post__tag">#{t}</span>
                            ))}
                          </div>
                        )}

                        <div className="feed-post__actions">
                          <button className="feed-post__action" onClick={(e) => e.stopPropagation()} title="Reply">
                            {Icons.messageCircle()}
                            <span>0</span>
                          </button>
                          <button className="feed-post__action" onClick={(e) => e.stopPropagation()} title="Repost">
                            {Icons.repeat()}
                            <span>0</span>
                          </button>
                          <button className="feed-post__action" onClick={(e) => e.stopPropagation()} title="Like">
                            {Icons.heart()}
                            <span>0</span>
                          </button>
                          <button className="feed-post__action" onClick={(e) => e.stopPropagation()} title="Share">
                            {Icons.share()}
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })
              )}
            </div>

            {/* Floating composer at bottom */}
            <div className="feed-composer">
              <div className="feed-composer__avatar">
                <Identicon className="feed-composer__avatar-img" />
              </div>
              <textarea
                ref={composerRef}
                className="feed-composer__input"
                placeholder="What's happening?"
                value={composerText}
                onChange={handleComposerInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost()
                }}
                rows={1}
              />
              <div className="feed-composer__tools">
                <button className="feed-composer__tool" title="Add image">
                  {Icons.image()}
                </button>
                <button className="feed-composer__tool" title="Attach file">
                  {Icons.paperclip()}
                </button>
                <button className="feed-composer__tool" title="Add link">
                  {Icons.link()}
                </button>
                <button
                  className="feed-composer__post-btn"
                  disabled={composerText.trim().length === 0}
                  onClick={handlePost}
                >
                  Post
                </button>
              </div>
            </div>
          </div>

          {/* Context panel (right side) */}
          <aside className="feed-panel">
            <div className="feed-panel__search">
              {Icons.search()}
              <input
                type="text"
                className="feed-panel__search-input"
                placeholder="Search Zarnet..."
              />
            </div>

            {trending.length > 0 && (
              <div className="feed-card">
                <h3 className="feed-card__title">Trending</h3>
                {trending.map((t, i) => (
                  <div key={t.topic} className="feed-card__trend">
                    <span className="feed-card__trend-rank">{i + 1}</span>
                    <div className="feed-card__trend-info">
                      <span className="feed-card__trend-topic">#{t.topic}</span>
                      <span className="feed-card__trend-count">{t.count} interested</span>
                    </div>
                  </div>
                ))}
                <button className="feed-card__more">Show more</button>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="feed-card">
                <h3 className="feed-card__title">Agents</h3>
                {suggestions.map((agent) => (
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
                <button className="feed-card__more">Show more</button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
