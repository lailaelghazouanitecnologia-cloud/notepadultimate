import { useState, useRef, useEffect } from 'react'
import type { Note, Project } from '../types'
import { ZarnettiLogo, Identicon, Icons, FileTypeIcon } from '../lib/icons'

interface SidebarProps {
  notes: Note[]
  activeId: string | null
  onSelect: (id: string) => void
  onAdd: () => void
  onDelete: (id: string) => void
  projects: Project[]
  activeProjectId: string
  onSwitchProject: (id: string) => void
  onCreateProject: (name: string, emoji: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({
  notes, activeId, onSelect, onAdd, onDelete,
  projects, activeProjectId, onSwitchProject, onCreateProject,
  collapsed, onToggleCollapse,
}: SidebarProps) {
  const [search, setSearch] = useState('')
  const [showProjects, setShowProjects] = useState(false)
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0]

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('es', { day: 'numeric', month: 'short' })

  // Close avatar menu on outside click
  useEffect(() => {
    if (!showAvatarMenu) return
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setShowAvatarMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showAvatarMenu])

  return (
    <aside className={`zw-sb ${collapsed ? 'collapsed' : ''}`}>
      {/* Icon rail */}
      <div className="zw-sb-rail">
        <div className="zw-sb-rail-top">
          <div className="zw-sb-rail-logo">
            <ZarnettiLogo className="zw-sb-rail-logo-svg" />
          </div>
          <button className="zw-sb-rail-btn active" title="Files">
            {Icons.files()}
          </button>
          <button className="zw-sb-rail-btn" title="Search">
            {Icons.search()}
          </button>
        </div>
        <div style={{ flex: 1 }} />
        <div className="zw-sb-rail-bottom" ref={avatarRef} style={{ position: 'relative' }}>
          <button
            className="zw-sb-toggle"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? Icons.panelLeft() : Icons.panelLeftClose()}
          </button>
          <button
            className="zw-sb-avatar-btn"
            title="Account"
            onClick={() => setShowAvatarMenu(!showAvatarMenu)}
          >
            <div className="zw-sb-avatar">
              <Identicon className="zw-sb-avatar-img" />
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
              <button className="zw-avatar-menu__item" onClick={() => setShowAvatarMenu(false)}>
                {Icons.moon()}
                <span>Appearance</span>
              </button>
              <div className="zw-avatar-menu__divider" />
              <button className="zw-avatar-menu__item" onClick={() => setShowAvatarMenu(false)}>
                {Icons.logOut()}
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content panel */}
      <div className="zw-sb-content">
        {/* Project switcher */}
        <div className="zw-ws-dropdown">
          <button
            className="zw-ws-trigger"
            onClick={() => setShowProjects(!showProjects)}
          >
            {Icons.folder()}
            <span className="truncate">{activeProject?.name || 'Zarnetti'}</span>
            {Icons.chevronDown()}
          </button>
          {showProjects && (
            <div className="zw-ws-menu">
              {projects.map((p) => (
                <button
                  key={p.id}
                  className={`zw-ws-menu-item ${p.id === activeProjectId ? 'active' : ''}`}
                  onClick={() => { onSwitchProject(p.id); setShowProjects(false) }}
                >
                  <span className="truncate">{p.name}</span>
                  {p.id === activeProjectId && (
                    <span className="zw-ws-menu-check">{Icons.check()}</span>
                  )}
                </button>
              ))}
              <div className="zw-ws-menu-divider" />
              <button
                className="zw-ws-menu-item"
                onClick={() => {
                  onCreateProject(`Project ${projects.length + 1}`, '📁')
                  setShowProjects(false)
                }}
              >
                {Icons.plus()}
                <span>New project</span>
              </button>
            </div>
          )}
        </div>

        <div className="zw-sb-content-top">
          <span className="zw-sb-label">Files</span>
          <button className="zw-sb-icon-btn" onClick={onAdd} title="New file">
            {Icons.plus()}
          </button>
        </div>

        <div className="zw-sb-search">
          <div className="zw-sb-search-input">
            {Icons.search()}
            <input
              type="text"
              className="zw-sb-search-field"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="zw-sb-content-scroll">
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 11, padding: '24px 0' }}>
              {notes.length === 0 ? 'No notes yet' : 'No results'}
            </div>
          )}
          <div className="zw-sb-items">
            {filtered.map((note) => (
              <button
                key={note.id}
                className={`zw-sb-item ${activeId === note.id ? 'active' : ''}`}
                onClick={() => onSelect(note.id)}
              >
                {/\.\w+$/.test(note.title) ? <FileTypeIcon filename={note.title} /> : Icons.file()}
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {note.title || 'Untitled'}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 1 }}>
                    {formatDate(note.updatedAt)}
                  </div>
                </div>
                <span className="zw-sb-item-trailing">
                  <button
                    className="zw-sb-item-menu"
                    onClick={(e) => { e.stopPropagation(); onDelete(note.id) }}
                    title="Delete"
                  >
                    {Icons.x()}
                  </button>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
