import { useState, useRef, useEffect, useMemo } from 'react'
import type { Note, Project, Folder, Agent } from '../types'
import type { View, ChatSession } from '../contexts/UIContext'
import { ZarnettiLogo, Identicon, Icons } from '../lib/icons'
import { SidebarFeed } from './SidebarFeed'
import { SidebarChat } from './SidebarChat'
import { SidebarFiles } from './SidebarFiles'

interface SidebarProps {
  notes: Note[]
  activeId: string | null
  onSelect: (id: string) => void
  onAdd: (folderId?: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, newTitle: string) => void
  onDuplicate?: (id: string) => void
  onDragNote?: boolean
  projects: Project[]
  activeProjectId: string
  onSwitchProject: (id: string) => void
  onCreateProject: (name: string, emoji: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
  width?: number
  folders: Folder[]
  onCreateFolder: (name: string, parentId?: string) => void
  onDeleteFolder: (id: string) => void
  onRenameFolder?: (id: string, newName: string) => void
  onMoveNote: (noteId: string, folderId?: string) => void
  theme?: 'light' | 'dark'
  onToggleTheme?: () => void
  view?: View
  onNavigate?: (view: View) => void
  onPost?: () => void
  unreadAlerts?: number
  // Social props
  agents: Agent[]
  followedAgents: Agent[]
  suggestedAgents: Agent[]
  isFollowing: (id: string) => boolean
  onFollow: (id: string) => void
  onUnfollow: (id: string) => void
  onOpenProfile: (id: string) => void
  // Chat props
  chatSessions: ChatSession[]
  activeChatId: string | null
  onNewChat: () => void
  onOpenChat: (id: string) => void
  // Editor active
  showEditor?: boolean
}

export function Sidebar({
  notes, activeId, onSelect, onAdd, onDelete, onRename, onDuplicate, onDragNote,
  projects, activeProjectId, onSwitchProject, onCreateProject,
  collapsed, onToggleCollapse, width,
  folders, onCreateFolder, onDeleteFolder, onRenameFolder, onMoveNote: _onMoveNote,
  theme, onToggleTheme,
  view, onNavigate, onPost, unreadAlerts,
  agents, followedAgents, suggestedAgents,
  isFollowing, onFollow, onUnfollow, onOpenProfile,
  chatSessions, activeChatId, onNewChat, onOpenChat,
  showEditor,
}: SidebarProps) {
  void _onMoveNote
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

  // Trending topics from agent interests
  const trending = useMemo(() => {
    const counts = new Map<string, number>()
    agents.forEach(a => {
      a.interests.forEach(i => {
        counts.set(i, (counts.get(i) || 0) + 1)
      })
    })
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }))
  }, [agents])

  // Determine which panel to show based on view
  const currentView = showEditor ? 'editor' : view

  return (
    <aside className={`zw-sb ${collapsed ? 'collapsed' : ''}`} style={!collapsed && width ? { width } : undefined}>
      {/* Logo */}
      <div className="zw-sb-logo">
        <ZarnettiLogo className="zw-sb-logo__icon" />
      </div>

      {/* Space indicator */}
      <div className="sb-space-indicator">
        <span className="sb-space-indicator__emoji">{activeProject?.emoji || '📁'}</span>
        <span className="sb-space-indicator__name">{activeProject?.name || 'Zarnetti'}</span>
      </div>

      {/* Contextual panel */}
      <div className="sb-panel-container">
        {currentView === 'feed' && (
          <SidebarFeed
            agents={agents}
            followedAgents={followedAgents}
            suggestedAgents={suggestedAgents}
            isFollowing={isFollowing}
            onFollow={onFollow}
            onUnfollow={onUnfollow}
            onOpenProfile={onOpenProfile}
            trending={trending}
          />
        )}
        {currentView === 'chat' && (
          <SidebarChat
            chatSessions={chatSessions}
            activeChatId={activeChatId}
            onNewChat={onNewChat}
            onOpenChat={onOpenChat}
          />
        )}
        {(currentView === 'graph' || currentView === 'editor') && (
          <SidebarFiles
            notes={notes}
            activeId={activeId}
            onSelect={onSelect}
            onAdd={onAdd}
            onDelete={onDelete}
            onRename={onRename}
            onDuplicate={onDuplicate}
            onDragNote={onDragNote}
            folders={folders}
            onCreateFolder={onCreateFolder}
            onDeleteFolder={onDeleteFolder}
            onRenameFolder={onRenameFolder}
          />
        )}
      </div>

      {/* Post button (visible in feed mode) */}
      {currentView === 'feed' && (
        <button className="zw-sb-post-btn" onClick={onPost}>
          {Icons.edit()}
          <span>Post</span>
        </button>
      )}

      {/* Spacer */}
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
            <button className="zw-avatar-menu__item" onClick={() => setShowAvatarMenu(false)}>
              {Icons.settings()}
              <span>Settings</span>
            </button>
            <button className="zw-avatar-menu__item" onClick={() => { onToggleTheme?.(); setShowAvatarMenu(false) }}>
              {theme === 'dark' ? Icons.sun() : Icons.moon()}
              <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </button>
            <div className="zw-avatar-menu__divider" />
            {/* Space switcher */}
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
              <span>New space</span>
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
