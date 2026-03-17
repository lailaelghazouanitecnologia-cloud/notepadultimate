import { useMemo, useState, useCallback, useRef } from 'react'
import type { Note, Agent, SystemEvent, Workspace, Folder } from '../types'
import { Icons, Identicon, FileTypeIcon } from '../lib/icons'
import { FollowButton } from './FollowButton'
import { detectFiles, extractImages } from '../lib/markdown'

type FeedFilter = 'global' | 'following'

interface FeedViewProps {
  mode: 'workspace' | 'home'
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
  // Filesystem
  workspaces: Workspace[]
  activeWorkspaceId: string
  onSwitchWorkspace: (id: string) => void
  onCreateWorkspace: (name: string) => void
  notes: Note[]
  folders: Folder[]
  onAddNote: (folderId?: string) => void
  onDeleteNote: (id: string) => void
  onCreateFolder: (name: string, parentId?: string) => void
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
  welcome: '👋', project_created: '📁', project_switched: '🔄',
  budget_alert: '💰', system_update: '✨',
}

function stripImages(text: string): string {
  return text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '').trim()
}

const FILE_TYPE_ICONS: Record<string, string> = {
  js: '📄', ts: '📄', tsx: '📄', jsx: '📄', py: '📄', md: '📝', txt: '📝',
  pdf: '📕', json: '📄', html: '📄', css: '📄', zip: '📦',
}
function getFileIcon(type: string): string {
  return FILE_TYPE_ICONS[type.toLowerCase()] || '📎'
}

export function FeedView({
  mode, publishedNotes, agents, systemEvents, onOpenNote, onOpenProfile, onCreatePost,
  isFollowing, onFollow, onUnfollow, followedAgentIds,
  workspaces, activeWorkspaceId, onSwitchWorkspace, onCreateWorkspace,
  notes, folders, onAddNote, onCreateFolder,
}: FeedViewProps) {
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('global')
  const [composerText, setComposerText] = useState('')
  const composerRef = useRef<HTMLTextAreaElement>(null)

  // Filesystem state
  const [browsePath, setBrowsePath] = useState<string[]>([])
  const [creatingWs, setCreatingWs] = useState(false)
  const [newWsName, setNewWsName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  // Current browsing context
  const currentWsId = browsePath[0] || null
  const currentFolderId = browsePath.length >= 2 ? browsePath[browsePath.length - 1] : null
  const currentWs = currentWsId ? workspaces.find(w => w.id === currentWsId) : null

  const currentFolders = useMemo(() => {
    if (!currentWsId) return []
    return folders.filter(f => {
      const matchesWs = !f.workspaceId || f.workspaceId === currentWsId
      if (currentFolderId) return matchesWs && f.parentId === currentFolderId
      return matchesWs && !f.parentId
    })
  }, [folders, currentWsId, currentFolderId])

  const currentNotes = useMemo(() => {
    if (!currentWsId) return []
    return notes.filter(n => {
      const matchesWs = !n.workspaceId || n.workspaceId === currentWsId
      if (currentFolderId) return matchesWs && n.folderId === currentFolderId
      return matchesWs && !n.folderId
    })
  }, [notes, currentWsId, currentFolderId])

  const breadcrumbs = useMemo(() => {
    const segs: { label: string; path: string[] }[] = [
      { label: 'workspace', path: [] },
    ]
    for (let i = 0; i < browsePath.length; i++) {
      const id = browsePath[i]
      const subPath = browsePath.slice(0, i + 1)
      if (i === 0) {
        const ws = workspaces.find(w => w.id === id)
        segs.push({ label: ws?.name || id, path: subPath })
      } else {
        const folder = folders.find(f => f.id === id)
        segs.push({ label: folder?.name || id, path: subPath })
      }
    }
    return segs
  }, [browsePath, workspaces, folders])

  const handleCreateWs = useCallback(() => {
    const name = newWsName.trim()
    if (!name) return
    onCreateWorkspace(name)
    setNewWsName('')
    setCreatingWs(false)
  }, [newWsName, onCreateWorkspace])

  const handleCreateFolder = useCallback(() => {
    const name = newFolderName.trim()
    if (!name) return
    onCreateFolder(name, currentFolderId || undefined)
    setNewFolderName('')
    setCreatingFolder(false)
  }, [newFolderName, onCreateFolder, currentFolderId])

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

  // Timeline for Home mode
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
    agents.forEach((a) => a.interests.forEach((i) => counts.set(i, (counts.get(i) || 0) + 1)))
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([topic, count]) => ({ topic, count }))
  }, [agents])

  const suggestions = useMemo(() => agents.filter((a) => a.isPreset).slice(0, 3), [agents])

  if (mode === 'workspace') {
    return (
      <div className="content-area">
        <div className="feed-view">
          <div className="fs">
            {/* Breadcrumb bar */}
            <div className="fs-breadcrumb">
              <div className="fs-breadcrumb__path">
                {breadcrumbs.map((seg, i) => (
                  <span key={i}>
                    {i > 0 && <span className="fs-breadcrumb__sep">/</span>}
                    <button
                      className={`fs-breadcrumb__seg ${i === breadcrumbs.length - 1 ? 'active' : ''}`}
                      onClick={() => setBrowsePath(seg.path)}
                    >
                      {seg.label}
                    </button>
                  </span>
                ))}
              </div>
              <div className="fs-breadcrumb__actions">
                {currentWsId && (
                  <>
                    <button className="fs-action-btn" onClick={() => setCreatingFolder(true)} title="New folder">
                      {Icons.folder()}
                    </button>
                    <button className="fs-action-btn" onClick={() => onAddNote(currentFolderId || undefined)} title="New file">
                      {Icons.plus()}
                    </button>
                  </>
                )}
                {!currentWsId && (
                  <button className="fs-action-btn" onClick={() => setCreatingWs(true)} title="New workspace">
                    {Icons.plus()}
                  </button>
                )}
              </div>
            </div>

            {/* Grid */}
            <div className="fs-grid-scroll">
              <div className="fs-grid">
                {/* Root: workspaces */}
                {!currentWsId && (
                  <>
                    {workspaces.map(ws => (
                      <button
                        key={ws.id}
                        className={`fs-item ${ws.id === activeWorkspaceId ? 'fs-item--active' : ''}`}
                        onClick={() => setBrowsePath([ws.id])}
                        onDoubleClick={() => { onSwitchWorkspace(ws.id); setBrowsePath([ws.id]) }}
                      >
                        <div className="fs-item__icon">{ws.isPublic ? '🌐' : '📁'}</div>
                        <div className="fs-item__name">{ws.name}</div>
                      </button>
                    ))}
                    {creatingWs && (
                      <div className="fs-item fs-item--creating">
                        <div className="fs-item__icon">📁</div>
                        <input
                          className="fs-item__input"
                          placeholder="Name..."
                          value={newWsName}
                          onChange={(e) => setNewWsName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateWs()
                            if (e.key === 'Escape') { setCreatingWs(false); setNewWsName('') }
                          }}
                          onBlur={() => { if (newWsName.trim()) handleCreateWs(); else { setCreatingWs(false); setNewWsName('') } }}
                          autoFocus
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Inside workspace: folders + files */}
                {currentWsId && (
                  <>
                    {currentFolders.map(folder => (
                      <button
                        key={folder.id}
                        className="fs-item"
                        onClick={() => setBrowsePath([...browsePath, folder.id])}
                      >
                        <div className="fs-item__icon">📁</div>
                        <div className="fs-item__name">{folder.name}</div>
                      </button>
                    ))}
                    {currentNotes.map(note => (
                      <button
                        key={note.id}
                        className="fs-item"
                        onClick={() => onOpenNote(note.id)}
                      >
                        <div className="fs-item__icon fs-item__icon--file">
                          {/\.\w+$/.test(note.title) ? <FileTypeIcon filename={note.title} /> : Icons.file()}
                        </div>
                        <div className="fs-item__name">{note.title || 'Untitled'}</div>
                      </button>
                    ))}
                    {creatingFolder && (
                      <div className="fs-item fs-item--creating">
                        <div className="fs-item__icon">📁</div>
                        <input
                          className="fs-item__input"
                          placeholder="Name..."
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateFolder()
                            if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName('') }
                          }}
                          onBlur={() => { if (newFolderName.trim()) handleCreateFolder(); else { setCreatingFolder(false); setNewFolderName('') } }}
                          autoFocus
                        />
                      </div>
                    )}
                    {currentFolders.length === 0 && currentNotes.length === 0 && !creatingFolder && (
                      <div className="fs-empty">
                        <div className="fs-empty__text">Empty</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Status bar */}
            <div className="fs-statusbar">
              {currentWsId ? (
                <>
                  <span>{currentFolders.length + currentNotes.length} items</span>
                  {currentWs && currentWs.id === activeWorkspaceId && (
                    <>
                      <span className="fs-statusbar__sep">&middot;</span>
                      <span className="fs-statusbar__active">Active</span>
                    </>
                  )}
                  {currentWs && currentWs.id !== activeWorkspaceId && (
                    <button className="fs-statusbar__set-active" onClick={() => onSwitchWorkspace(currentWs.id)}>
                      Set as active
                    </button>
                  )}
                </>
              ) : (
                <span>{workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── HOME mode: social timeline ──
  return (
    <div className="content-area">
      <div className="feed-view">
        <div className="feed-layout">
          <div className="feed-col">
            <div className="feed-filter-tabs">
              <button className={`feed-filter-tab ${feedFilter === 'global' ? 'active' : ''}`} onClick={() => setFeedFilter('global')}>Global</button>
              <button className={`feed-filter-tab ${feedFilter === 'following' ? 'active' : ''}`} onClick={() => setFeedFilter('following')}>Following</button>
            </div>
            <div className="feed-scroll">
              {timeline.length === 0 ? (
                <div className="feed-empty">
                  <div className="feed-empty__icon">{Icons.rss()}</div>
                  <h3 className="feed-empty__title">Welcome to your feed</h3>
                  <p className="feed-empty__sub">Publish notes to share with the community.</p>
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
                      <div className="feed-post__avatar" onClick={(e) => { e.stopPropagation(); if (agent) onOpenProfile(agent.id) }} style={{ cursor: agent ? 'pointer' : 'default' }}>{authorAvatar}</div>
                      <div className="feed-post__body">
                        <div className="feed-post__header">
                          <span className="feed-post__name" onClick={(e) => { e.stopPropagation(); if (agent) onOpenProfile(agent.id) }}>{authorName}</span>
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
                                <img src={img.url} alt={img.alt} className="feed-post__image" loading="lazy" onClick={(e) => e.stopPropagation()} />
                              </div>
                            ))}
                          </div>
                        )}
                        {files.length > 0 && (
                          <div className="feed-post__files">
                            {files.slice(0, 4).map((f) => (
                              <button key={f.name} className="feed-file-badge" onClick={(e) => { e.stopPropagation(); onOpenNote(note.id) }} title={f.name}>
                                <span className="feed-file-badge__icon">{getFileIcon(f.type)}</span>
                                <span className="feed-file-badge__name">{f.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="feed-post__actions">
                          <button className="feed-post__action" onClick={(e) => e.stopPropagation()}>{Icons.messageCircle()}<span>0</span></button>
                          <button className="feed-post__action" onClick={(e) => e.stopPropagation()}>{Icons.repeat()}<span>0</span></button>
                          <button className="feed-post__action" onClick={(e) => e.stopPropagation()}>{Icons.heart()}<span>0</span></button>
                          <button className="feed-post__action" onClick={(e) => e.stopPropagation()}>{Icons.share()}</button>
                        </div>
                      </div>
                    </article>
                  )
                })
              )}
            </div>
            {/* Floating composer */}
            <div className="feed-composer">
              <div className="feed-composer__avatar"><Identicon className="feed-composer__avatar-img" /></div>
              <textarea ref={composerRef} className="feed-composer__input" placeholder="What's happening?" value={composerText} onChange={handleComposerInput} onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost() }} rows={1} />
              <div className="feed-composer__tools">
                <button className="feed-composer__tool" title="Image">{Icons.image()}</button>
                <button className="feed-composer__tool" title="Attach">{Icons.paperclip()}</button>
                <button className="feed-composer__post-btn" disabled={composerText.trim().length === 0} onClick={handlePost}>Post</button>
              </div>
            </div>
          </div>
          {/* Context panel */}
          <aside className="feed-panel">
            <div className="feed-panel__search">
              {Icons.search()}
              <input type="text" className="feed-panel__search-input" placeholder="Search Zarnet..." />
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
                      <FollowButton isFollowing={isFollowing(agent.id)} onFollow={() => onFollow(agent.id)} onUnfollow={() => onUnfollow(agent.id)} />
                    )}
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
