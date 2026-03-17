import { useState, useRef, useEffect } from 'react'
import type { Project, Note, Folder, Workspace } from '../types'
import type { View } from '../contexts/UIContext'
import { ZarnettiLogo, Identicon, Icons } from '../lib/icons'
import { SidebarFiles } from './SidebarFiles'

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
  // Workspace (files)
  notes?: Note[]
  folders?: Folder[]
  activeNoteId?: string | null
  onOpenNote?: (id: string) => void
  onAddNote?: (folderId?: string) => void
  onDeleteNote?: (id: string) => void
  onRenameNote?: (id: string, newTitle: string) => void
  onDuplicateNote?: (id: string) => void
  onMoveNoteToFolder?: (noteId: string, folderId: string | null) => void
  onCreateFolder?: (name: string, parentId?: string) => void
  onRenameFolder?: (id: string, newName: string) => void
  onMoveFolderToParent?: (folderId: string, parentId: string | null) => void
  // Workspaces
  workspaces?: Workspace[]
  activeWorkspaceId?: string
  onSwitchWorkspace?: (id: string) => void
  onCreateWorkspace?: (name: string) => void
}

export function Sidebar({
  projects, activeProjectId, onSwitchProject, onCreateProject,
  collapsed, width,
  theme, onToggleTheme,
  view, onNavigate, onPost, unreadAlerts,
  onOpenAgents, onOpenContracts, onOpenPlugins,
  notes = [], folders = [], activeNoteId, onOpenNote,
  onAddNote, onDeleteNote, onRenameNote, onDuplicateNote,
  onMoveNoteToFolder, onCreateFolder, onRenameFolder, onMoveFolderToParent,
  workspaces = [], activeWorkspaceId = '', onSwitchWorkspace, onCreateWorkspace,
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

  const showNav = view !== 'chat' && view !== 'graph'
  const showWorkspace = true  // workspace panel always visible

  return (
    <aside className={`zw-sb ${collapsed ? 'collapsed' : ''}`} style={!collapsed && width ? { width } : undefined}>
      {/* Logo */}
      <div className="zw-sb-logo">
        <ZarnettiLogo className="zw-sb-logo__icon" />
      </div>

      {/* Navigation — feed/agents/plugins only */}
      {showNav && <nav className="zw-sb-nav">
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
          className="zw-sb-nav-item"
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
          className={`zw-sb-nav-item ${view === 'workspace' ? 'active' : ''}`}
          onClick={() => onNavigate?.('workspace')}
        >
          {Icons.folder()}
          <span>Workspace</span>
        </button>
      </nav>}

      {/* Post button — feed/agents/plugins only */}
      {showNav && (
        <button className="zw-sb-post-btn" onClick={onPost}>
          {Icons.edit()}
          <span>Post</span>
        </button>
      )}

      {/* ── Workspace panel: always visible ── */}
      {showWorkspace && onAddNote && onDeleteNote && onRenameNote && onCreateFolder && onMoveNoteToFolder && onMoveFolderToParent && onSwitchWorkspace && onCreateWorkspace && (
        <SidebarFiles
          notes={notes}
          activeId={activeNoteId || null}
          onSelect={onOpenNote || (() => {})}
          onAdd={onAddNote}
          onDelete={onDeleteNote}
          onRename={onRenameNote}
          onDuplicate={onDuplicateNote}
          onMoveNoteToFolder={onMoveNoteToFolder}
          folders={folders}
          onCreateFolder={onCreateFolder}
          onRenameFolder={onRenameFolder}
          onMoveFolderToParent={onMoveFolderToParent}
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          onSwitchWorkspace={onSwitchWorkspace}
          onCreateWorkspace={onCreateWorkspace}
        />
      )}

      {/* Spacer — fallback if workspace props missing */}
      {!(onAddNote && onDeleteNote && onRenameNote && onCreateFolder && onMoveNoteToFolder && onMoveFolderToParent && onSwitchWorkspace && onCreateWorkspace) && <div className="zw-sb-spacer" />}

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
