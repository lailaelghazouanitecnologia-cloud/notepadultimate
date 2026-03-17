import { useState, useRef, useEffect } from 'react'
import type { Project, Note, Folder, Workspace } from '../types'
import type { View } from '../contexts/UIContext'
import { ZarnettiLogo, Identicon, Icons } from '../lib/icons'
import { SidebarFiles } from './SidebarFiles'

interface WorkSidebarProps {
  projects: Project[]
  activeProjectId: string
  onSwitchProject: (id: string) => void
  onCreateProject: (name: string, emoji: string) => void
  collapsed: boolean
  width?: number
  theme?: 'light' | 'dark'
  onToggleTheme?: () => void
  onNavigate?: (view: View) => void
  onOpenPlugins?: () => void
  onLogoClick?: () => void
  // Workspace file tree
  notes: Note[]
  folders: Folder[]
  activeNoteId?: string | null
  onOpenNote: (id: string) => void
  onAddNote: (folderId?: string) => void
  onDeleteNote: (id: string) => void
  onRenameNote: (id: string, newTitle: string) => void
  onMoveNoteToFolder: (noteId: string, folderId: string | null) => void
  onCreateFolder: (name: string, parentId?: string) => void
  onMoveFolderToParent: (folderId: string, parentId: string | null) => void
  workspaces: Workspace[]
  activeWorkspaceId: string
  onSwitchWorkspace: (id: string) => void
  onCreateWorkspace: (name: string) => void
}

export function WorkSidebar({
  projects, activeProjectId, onSwitchProject, onCreateProject,
  collapsed, width,
  theme, onToggleTheme,
  onOpenPlugins, onLogoClick,
  notes, folders, activeNoteId, onOpenNote,
  onAddNote, onDeleteNote, onRenameNote,
  onMoveNoteToFolder, onCreateFolder, onMoveFolderToParent,
  workspaces, activeWorkspaceId, onSwitchWorkspace, onCreateWorkspace,
}: WorkSidebarProps) {
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
      {/* Logo — opens start menu */}
      <div className="zw-sb-logo" onClick={onLogoClick} style={{ cursor: 'pointer' }}>
        <ZarnettiLogo className="zw-sb-logo__icon" />
      </div>

      {/* Workspace file tree */}
      <SidebarFiles
        notes={notes}
        activeId={activeNoteId || null}
        onSelect={onOpenNote}
        onAdd={onAddNote}
        onDelete={onDeleteNote}
        onRename={onRenameNote}
        onMoveNoteToFolder={onMoveNoteToFolder}
        folders={folders}
        onCreateFolder={onCreateFolder}
        onMoveFolderToParent={onMoveFolderToParent}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSwitchWorkspace={onSwitchWorkspace}
        onCreateWorkspace={onCreateWorkspace}
      />

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
