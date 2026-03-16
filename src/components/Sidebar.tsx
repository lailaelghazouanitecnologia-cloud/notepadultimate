import { useState } from 'react'
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
}

export function Sidebar({
  notes, activeId, onSelect, onAdd, onDelete,
  projects, activeProjectId, onSwitchProject, onCreateProject,
}: SidebarProps) {
  const [search, setSearch] = useState('')
  const [showProjects, setShowProjects] = useState(false)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('📁')

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0]

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('es', { day: 'numeric', month: 'short' })

  const handleCreate = () => {
    if (!newName.trim()) return
    onCreateProject(newName.trim(), newEmoji)
    setNewName('')
    setNewEmoji('📁')
    setShowNewProject(false)
    setShowProjects(false)
  }

  const PROJECT_EMOJIS = ['📁', '🚀', '📚', '🎨', '💡', '🔬', '🎵', '🌍', '⚡', '🎯']

  return (
    <aside className="zw-sb">
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
        <div className="zw-sb-rail-bottom">
          <button className="zw-sb-avatar-btn" title="Account">
            <div className="zw-sb-avatar">
              <Identicon className="zw-sb-avatar-img" />
            </div>
          </button>
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
            <span className="zw-ws-emoji">{activeProject?.emoji || '📁'}</span>
            <span>{activeProject?.name || 'Zarnetti'}</span>
            {Icons.chevronDown()}
          </button>
          {showProjects && (
            <div className="zw-ws-menu">
              <div className="zw-ws-menu__label">Projects</div>
              {projects.map((p) => (
                <button
                  key={p.id}
                  className={`zw-ws-menu__item ${p.id === activeProjectId ? 'active' : ''}`}
                  onClick={() => { onSwitchProject(p.id); setShowProjects(false) }}
                >
                  <span className="zw-ws-menu__emoji">{p.emoji}</span>
                  <span>{p.name}</span>
                  {p.id === activeProjectId && (
                    <span className="zw-ws-menu__check">{Icons.check()}</span>
                  )}
                </button>
              ))}
              <div className="zw-ws-menu__divider" />
              {!showNewProject ? (
                <button
                  className="zw-ws-menu__item zw-ws-menu__new"
                  onClick={() => setShowNewProject(true)}
                >
                  {Icons.plus()}
                  <span>New project</span>
                </button>
              ) : (
                <div className="zw-ws-menu__create">
                  <div className="zw-ws-menu__create-emojis">
                    {PROJECT_EMOJIS.map((e) => (
                      <button
                        key={e}
                        className={`zw-ws-menu__create-emoji ${newEmoji === e ? 'active' : ''}`}
                        onClick={() => setNewEmoji(e)}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    className="zw-ws-menu__create-input"
                    placeholder="Project name..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
                    autoFocus
                  />
                  <div className="zw-ws-menu__create-actions">
                    <button className="zw-ws-menu__create-cancel" onClick={() => setShowNewProject(false)}>
                      Cancel
                    </button>
                    <button
                      className="zw-ws-menu__create-submit"
                      onClick={handleCreate}
                      disabled={!newName.trim()}
                    >
                      Create
                    </button>
                  </div>
                </div>
              )}
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
