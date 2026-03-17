import { useState, useRef, useEffect } from 'react'
import type { Project, Note } from '../types'
import type { View, ChatSession } from '../contexts/UIContext'
import { ZarnettiLogo, Identicon, Icons } from '../lib/icons'

interface SidebarProps {
  projects: Project[]
  activeProjectId: string
  onSwitchProject: (id: string) => void
  onCreateProject: (name: string, emoji: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
  width?: number
  theme?: 'light' | 'dark'
  onToggleTheme?: () => void
  view?: View
  onNavigate?: (view: View) => void
  onPost?: () => void
  unreadAlerts?: number
  onOpenAgents?: () => void
  onOpenContracts?: () => void
  onOpenPlugins?: () => void
  // Chat sidebar
  chatSessions?: ChatSession[]
  activeChatId?: string | null
  onNewChat?: () => void
  onOpenChat?: (id: string) => void
  // Graph sidebar
  notes?: Note[]
  onOpenNote?: (id: string) => void
}

export function Sidebar({
  projects, activeProjectId, onSwitchProject, onCreateProject,
  collapsed, width,
  theme, onToggleTheme,
  view, onNavigate, onPost, unreadAlerts,
  onOpenAgents, onOpenContracts, onOpenPlugins,
  chatSessions = [], activeChatId, onNewChat, onOpenChat,
  notes = [], onOpenNote,
}: SidebarProps) {
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0]

  useEffect(() => {
    if (!showAvatarMenu) return
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setShowAvatarMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showAvatarMenu])

  return (
    <aside className={`zw-sb ${collapsed ? 'collapsed' : ''}`} style={!collapsed && width ? { width } : undefined}>
      {/* Logo */}
      <div className="zw-sb-logo">
        <ZarnettiLogo className="zw-sb-logo__icon" />
      </div>

      {/* Navigation */}
      <nav className="zw-sb-nav">
        <button
          className={`zw-sb-nav-item ${view === 'feed' ? 'active' : ''}`}
          onClick={() => onNavigate?.('feed')}
        >
          {Icons.rss()}
          <span>Home</span>
        </button>
        <button className="zw-sb-nav-item">
          {Icons.search()}
          <span>Explore</span>
        </button>
        <button className="zw-sb-nav-item">
          {Icons.bell()}
          <span>Notifications</span>
          {unreadAlerts != null && unreadAlerts > 0 && (
            <span className="zw-sb-nav-badge">{unreadAlerts}</span>
          )}
        </button>
        <button
          className={`zw-sb-nav-item ${view === 'chat' ? 'active' : ''}`}
          onClick={() => onNavigate?.('chat')}
        >
          {Icons.messageCircle()}
          <span>Messages</span>
        </button>
        <button
          className={`zw-sb-nav-item ${view === 'agents' ? 'active' : ''}`}
          onClick={onOpenAgents}
        >
          {Icons.users()}
          <span>Agents</span>
          {unreadAlerts != null && unreadAlerts > 0 && (
            <span className="zw-sb-nav-badge">{unreadAlerts}</span>
          )}
        </button>
        <button
          className="zw-sb-nav-item"
          onClick={onOpenContracts}
        >
          {Icons.file()}
          <span>Contracts</span>
        </button>
        <button
          className={`zw-sb-nav-item ${view === 'plugins' ? 'active' : ''}`}
          onClick={onOpenPlugins}
        >
          {Icons.puzzle()}
          <span>Plugins</span>
        </button>
      </nav>

      {/* Post button */}
      <button className="zw-sb-post-btn" onClick={onPost}>
        {Icons.edit()}
        <span>Post</span>
      </button>

      {/* ── Contextual panel per view ── */}
      {view === 'chat' && (
        <div className="zw-sb-panel">
          <div className="zw-sb-panel__header">
            <span className="zw-sb-panel__title">Conversations</span>
            <button className="zw-sb-panel__action" onClick={onNewChat} title="New chat">
              {Icons.plus()}
            </button>
          </div>
          <div className="zw-sb-panel__list">
            {chatSessions.length === 0 ? (
              <div className="zw-sb-panel__empty">No conversations yet</div>
            ) : chatSessions.map(s => (
              <button
                key={s.id}
                className={`zw-sb-panel__item ${s.id === activeChatId ? 'active' : ''}`}
                onClick={() => onOpenChat?.(s.id)}
              >
                {Icons.messageCircle()}
                <div className="zw-sb-panel__item-info">
                  <span className="zw-sb-panel__item-title">{s.title}</span>
                  <span className="zw-sb-panel__item-meta">{s.messages.length} messages</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {view === 'graph' && (
        <div className="zw-sb-panel">
          <div className="zw-sb-panel__header">
            <span className="zw-sb-panel__title">Notes</span>
            <span className="zw-sb-panel__count">{notes.length}</span>
          </div>
          <div className="zw-sb-panel__list">
            {notes.length === 0 ? (
              <div className="zw-sb-panel__empty">No notes yet</div>
            ) : notes.slice(0, 30).map(n => (
              <button
                key={n.id}
                className="zw-sb-panel__item"
                onClick={() => onOpenNote?.(n.id)}
              >
                {Icons.file()}
                <div className="zw-sb-panel__item-info">
                  <span className="zw-sb-panel__item-title">{n.title || 'Untitled'}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="zw-sb-spacer" />

      {/* Account row — centered */}
      <div className="zw-sb-account" ref={avatarRef}>
        <button className="zw-sb-account-btn" onClick={() => setShowAvatarMenu(!showAvatarMenu)}>
          <div className="zw-sb-account__avatar">
            <Identicon className="zw-sb-avatar-img" />
          </div>
          <div className="zw-sb-account__info">
            <span className="zw-sb-account__name">{activeProject?.name || 'Zarnetti'}</span>
            <span className="zw-sb-account__handle">@user</span>
          </div>
          <div className="zw-sb-account__more">
            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14 }}>
              <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
            </svg>
          </div>
        </button>

        {showAvatarMenu && (
          <div className="zw-avatar-menu">
            <div className="zw-avatar-menu__header">
              <div className="zw-avatar-menu__name">User</div>
              <div className="zw-avatar-menu__handle">@user</div>
            </div>
            <button className="zw-avatar-menu__item" onClick={() => { onOpenPlugins?.(); setShowAvatarMenu(false) }}>
              {Icons.puzzle()}
              <span>Plugins</span>
            </button>
            <button className="zw-avatar-menu__item" onClick={() => setShowAvatarMenu(false)}>
              {Icons.download()}
              <span>Download</span>
            </button>
            <button className="zw-avatar-menu__item" onClick={() => setShowAvatarMenu(false)}>
              {Icons.settings()}
              <span>Settings</span>
            </button>
            <button className="zw-avatar-menu__item" onClick={() => { onToggleTheme?.(); setShowAvatarMenu(false) }}>
              {theme === 'dark' ? Icons.sun() : Icons.moon()}
              <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </button>
            <div className="zw-avatar-menu__divider" />
            <div className="zw-avatar-menu__section">Spaces</div>
            {projects.map(p => (
              <button
                key={p.id}
                className={`zw-avatar-menu__item ${p.id === activeProjectId ? 'zw-avatar-menu__item--active' : ''}`}
                onClick={() => { onSwitchProject(p.id); setShowAvatarMenu(false) }}
              >
                {p.id === activeProjectId ? Icons.check() : Icons.folder()}
                <span>{p.emoji} {p.name}</span>
              </button>
            ))}
            <button
              className="zw-avatar-menu__item"
              onClick={() => { onCreateProject(`Space ${projects.length}`, '🚀'); setShowAvatarMenu(false) }}
            >
              {Icons.plus()}
              <span>Create new space</span>
            </button>
            <div className="zw-avatar-menu__divider" />
            <button className="zw-avatar-menu__item zw-avatar-menu__item--upgrade" onClick={() => setShowAvatarMenu(false)}>
              {Icons.crown()}
              <span>Upgrade plan</span>
            </button>
            <div className="zw-avatar-menu__divider" />
            <button className="zw-avatar-menu__item" onClick={() => setShowAvatarMenu(false)}>
              {Icons.logOut()}
              <span>Log out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
