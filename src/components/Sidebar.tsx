import { useState, useRef, useEffect } from 'react'
import type { Project } from '../types'
import type { View } from '../contexts/UIContext'
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
  onOpenPlugins?: () => void
  onLogoClick?: () => void
}

export function Sidebar({
  projects, activeProjectId, onSwitchProject, onCreateProject,
  collapsed, width,
  theme, onToggleTheme,
  view, onNavigate, onPost, unreadAlerts,
  onOpenAgents, onOpenPlugins, onLogoClick,
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

  const showNav = view !== 'graph'

  return (
    <aside className={`zw-sb ${collapsed ? 'collapsed' : ''}`} style={!collapsed && width ? { width } : undefined}>
      {/* Logo — opens start menu */}
      <div className="zw-sb-logo" onClick={onLogoClick} style={{ cursor: 'pointer' }}>
        <ZarnettiLogo className="zw-sb-logo__icon" />
      </div>

      {/* Navigation */}
      {showNav && <nav className="zw-sb-nav">
        <button
          className={`zw-sb-nav-item ${view === 'feed' ? 'active' : ''}`}
          onClick={() => onNavigate?.('feed')}
        >
          {Icons.rss()}
          <span>Home</span>
        </button>
        <button
          className={`zw-sb-nav-item ${view === 'explore' ? 'active' : ''}`}
          onClick={() => onNavigate?.('explore')}
        >
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
          className={`zw-sb-nav-item ${view === 'messages' ? 'active' : ''}`}
          onClick={() => onNavigate?.('messages')}
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
          className={`zw-sb-nav-item ${view === 'workspace' ? 'active' : ''}`}
          onClick={() => onNavigate?.('workspace')}
        >
          {Icons.folder()}
          <span>Workspace</span>
        </button>
      </nav>}

      {/* Post button */}
      {showNav && (
        <button className="zw-sb-post-btn" onClick={onPost}>
          {Icons.edit()}
          <span>Post</span>
        </button>
      )}

      {/* Spacer — push avatar to bottom */}
      <div className="zw-sb-spacer" />

      {/* Account row */}
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
