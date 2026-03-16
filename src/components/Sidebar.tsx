import { useState, useRef, useEffect, useMemo } from 'react'
import type { Note, Project, Folder } from '../types'
import { ZarnettiLogo, Identicon, Icons, FileTypeIcon } from '../lib/icons'

interface SidebarProps {
  notes: Note[]
  activeId: string | null
  onSelect: (id: string) => void
  onAdd: (folderId?: string) => void
  onDelete: (id: string) => void
  projects: Project[]
  activeProjectId: string
  onSwitchProject: (id: string) => void
  onCreateProject: (name: string, emoji: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
  folders: Folder[]
  onCreateFolder: (name: string, parentId?: string) => void
  onDeleteFolder: (id: string) => void
  onMoveNote: (noteId: string, folderId?: string) => void
}

export function Sidebar({
  notes, activeId, onSelect, onAdd, onDelete,
  projects, activeProjectId, onSwitchProject, onCreateProject,
  collapsed, onToggleCollapse,
  folders, onCreateFolder, onDeleteFolder, onMoveNote,
}: SidebarProps) {
  const [search, setSearch] = useState('')
  const [showProjects, setShowProjects] = useState(false)
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const createMenuRef = useRef<HTMLDivElement>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [creatingFolder, setCreatingFolder] = useState<string | null>(null) // null = root, or parentId
  const [newFolderName, setNewFolderName] = useState('')
  const avatarRef = useRef<HTMLDivElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0]

  const filtered = useMemo(() => {
    if (!search) return notes
    const q = search.toLowerCase()
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
    )
  }, [notes, search])

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('es', { day: 'numeric', month: 'short' })

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return
    onCreateFolder(newFolderName.trim(), creatingFolder === '__root__' ? undefined : creatingFolder || undefined)
    setNewFolderName('')
    setCreatingFolder(null)
  }

  useEffect(() => {
    if (creatingFolder !== null) folderInputRef.current?.focus()
  }, [creatingFolder])

  // Close avatar menu / projects on outside click
  useEffect(() => {
    if (!showAvatarMenu && !showProjects) return
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setShowAvatarMenu(false)
        setShowProjects(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showAvatarMenu, showProjects])

  // Close create menu on outside click
  useEffect(() => {
    if (!showCreateMenu) return
    const handler = (e: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) setShowCreateMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showCreateMenu])

  // Group notes by folder
  const rootNotes = filtered.filter((n) => !n.folderId)
  const notesByFolder = useMemo(() => {
    const map = new Map<string, Note[]>()
    for (const n of filtered) {
      if (n.folderId) {
        const arr = map.get(n.folderId) || []
        arr.push(n)
        map.set(n.folderId, arr)
      }
    }
    return map
  }, [filtered])

  const rootFolders = folders.filter((f) => !f.parentId)

  const renderNote = (note: Note) => (
    <button
      key={note.id}
      className={`zw-sb-item ${activeId === note.id ? 'active' : ''}`}
      onClick={() => onSelect(note.id)}
    >
      {/\.\w+$/.test(note.title) ? <FileTypeIcon filename={note.title} /> : Icons.file()}
      <span className="zw-sb-item__label">{note.title || 'Untitled'}</span>
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
  )

  const renderFolder = (folder: Folder) => {
    const isExpanded = expandedFolders.has(folder.id)
    const folderNotes = notesByFolder.get(folder.id) || []
    const childFolders = folders.filter((f) => f.parentId === folder.id)

    return (
      <div key={folder.id} className="zw-sb-folder">
        <button className="zw-sb-item zw-sb-item--folder" onClick={() => toggleFolder(folder.id)}>
          <svg viewBox="0 0 24 24" style={{ width: 12, height: 12, transition: 'transform 0.12s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
          {Icons.folder()}
          <span className="zw-sb-item__label">{folder.name}</span>
          <span className="zw-sb-item-trailing">
            <button
              className="zw-sb-item-menu"
              onClick={(e) => { e.stopPropagation(); onAdd(folder.id) }}
              title="New file"
            >
              {Icons.plus()}
            </button>
            <button
              className="zw-sb-item-menu"
              onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id) }}
              title="Delete folder"
            >
              {Icons.x()}
            </button>
          </span>
        </button>
        {isExpanded && (
          <div className="zw-sb-folder__children">
            {childFolders.map(renderFolder)}
            {folderNotes.map(renderNote)}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside className={`zw-sb ${collapsed ? 'collapsed' : ''}`}>
      {/* Top bar: logo + close */}
      <div className="zw-sb-topbar">
        <div className="zw-sb-topbar__team">
          <ZarnettiLogo className="zw-sb-topbar__logo" />
          <span className="zw-sb-topbar__name">Zarnetti</span>
        </div>
        <button
          className="zw-sb-topbar__close"
          onClick={onToggleCollapse}
          title="Close sidebar"
        >
          {Icons.panelLeftClose()}
        </button>
      </div>

      {/* Search */}
      <div className="zw-sb-search">
        <div className="zw-sb-search-wrap">
          <span className="zw-sb-search-icon">{Icons.search()}</span>
          <input
            type="text"
            className="zw-sb-search-field"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="zw-sb-search-kbd">
            {Icons.command()}K
          </span>
        </div>
      </div>

      {/* Files header */}
      <div className="zw-sb-content-top">
        <span className="zw-sb-label">Files</span>
        <div ref={createMenuRef} style={{ position: 'relative' }}>
          <button className="zw-sb-icon-btn" onClick={() => setShowCreateMenu(!showCreateMenu)} title="New...">
            {Icons.plus()}
          </button>
          {showCreateMenu && (
            <div className="zw-create-menu">
              <button className="zw-create-menu__item" onClick={() => { onAdd(); setShowCreateMenu(false) }}>
                {Icons.file()}
                <span>New file</span>
                <span className="zw-create-menu__shortcut">&#8984;N</span>
              </button>
              <button className="zw-create-menu__item" onClick={() => { setCreatingFolder('__root__'); setShowCreateMenu(false) }}>
                {Icons.folder()}
                <span>New folder</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* File tree */}
      <div className="zw-sb-content-scroll">
        {creatingFolder !== null && (
          <div style={{ padding: '2px 4px' }}>
            <div className="zw-sb-item" style={{ gap: 4 }}>
              {Icons.folder()}
              <input
                ref={folderInputRef}
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder()
                  if (e.key === 'Escape') { setCreatingFolder(null); setNewFolderName('') }
                }}
                onBlur={() => { if (newFolderName.trim()) handleCreateFolder(); else { setCreatingFolder(null); setNewFolderName('') } }}
                placeholder="Folder name..."
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 11, color: 'var(--foreground)', fontFamily: 'var(--font-sans)' }}
              />
            </div>
          </div>
        )}

        {filtered.length === 0 && folders.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 11, padding: '24px 0' }}>
            {notes.length === 0 ? 'No notes yet' : 'No results'}
          </div>
        )}
        <div className="zw-sb-items">
          {rootFolders.map(renderFolder)}
          {rootNotes.map(renderNote)}
        </div>
      </div>

      {/* Bottom: avatar + project switcher */}
      <div className="zw-sb-bottom" ref={avatarRef} style={{ position: 'relative' }}>
        <button
          className="zw-sb-avatar-btn"
          title="Account"
          onClick={() => setShowAvatarMenu(!showAvatarMenu)}
        >
          <div className="zw-sb-avatar">
            <Identicon className="zw-sb-avatar-img" />
          </div>
        </button>

        <button
          className="zw-sb-project-btn"
          onClick={() => setShowProjects(!showProjects)}
        >
          <span className="truncate">{activeProject?.name || 'Zarnetti'}</span>
          {Icons.chevronDown()}
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

        {showProjects && (
          <div className="zw-ws-menu zw-ws-menu--bottom">
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
    </aside>
  )
}
