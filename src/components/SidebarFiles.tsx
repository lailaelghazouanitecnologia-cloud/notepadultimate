import { useState, useRef, useEffect, useMemo } from 'react'
import type { Note, Folder } from '../types'
import { Icons, FileTypeIcon } from '../lib/icons'

interface SidebarFilesProps {
  notes: Note[]
  activeId: string | null
  onSelect: (id: string) => void
  onAdd: (folderId?: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, newTitle: string) => void
  onDuplicate?: (id: string) => void
  onDragNote?: boolean
  folders: Folder[]
  onCreateFolder: (name: string, parentId?: string) => void
  onDeleteFolder: (id: string) => void
  onRenameFolder?: (id: string, newName: string) => void
}

export function SidebarFiles({
  notes, activeId, onSelect, onAdd, onDelete, onRename, onDuplicate, onDragNote,
  folders, onCreateFolder, onDeleteFolder, onRenameFolder,
}: SidebarFilesProps) {
  const [search, setSearch] = useState('')
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [creatingFolder, setCreatingFolder] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const createMenuRef = useRef<HTMLDivElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; id: string; type: 'note' | 'folder' } | null>(null)

  const startRename = (id: string, currentName: string) => {
    setRenamingId(id)
    setRenameValue(currentName)
    setCtxMenu(null)
    setTimeout(() => renameInputRef.current?.focus(), 0)
  }

  const commitRename = () => {
    if (!renamingId) return
    const trimmed = renameValue.trim()
    if (trimmed) {
      const isFolder = folders.some(f => f.id === renamingId)
      if (isFolder) onRenameFolder?.(renamingId, trimmed)
      else onRename(renamingId, trimmed)
    }
    setRenamingId(null)
    setRenameValue('')
  }

  const cancelRename = () => {
    setRenamingId(null)
    setRenameValue('')
  }

  const handleContextMenu = (e: React.MouseEvent, id: string, type: 'note' | 'folder') => {
    e.preventDefault()
    e.stopPropagation()
    setCtxMenu({ x: e.clientX, y: e.clientY, id, type })
  }

  useEffect(() => {
    if (!ctxMenu) return
    const handler = () => setCtxMenu(null)
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ctxMenu])

  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus()
  }, [renamingId])

  useEffect(() => {
    if (!showCreateMenu) return
    const handler = (e: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) setShowCreateMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showCreateMenu])

  useEffect(() => {
    if (creatingFolder !== null) folderInputRef.current?.focus()
  }, [creatingFolder])

  const filtered = useMemo(() => {
    if (!search) return notes
    const q = search.toLowerCase()
    return notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
  }, [notes, search])

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
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

  const rootNotes = filtered.filter(n => !n.folderId)
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

  const rootFolders = folders.filter(f => !f.parentId)

  const renderNote = (note: Note) => (
    <button
      key={note.id}
      className={`zw-sb-item ${activeId === note.id ? 'active' : ''}`}
      onClick={() => onSelect(note.id)}
      onDoubleClick={(e) => { e.preventDefault(); startRename(note.id, note.title || 'Untitled') }}
      onContextMenu={(e) => handleContextMenu(e, note.id, 'note')}
      draggable={!!onDragNote}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/note-id', note.id)
        e.dataTransfer.setData('text/note-title', note.title || 'Untitled')
        e.dataTransfer.effectAllowed = 'copy'
      }}
    >
      {/\.\w+$/.test(note.title) ? <FileTypeIcon filename={note.title} /> : Icons.file()}
      {renamingId === note.id ? (
        <input
          ref={renameInputRef}
          className="zw-sb-rename-input"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename()
            if (e.key === 'Escape') cancelRename()
          }}
          onBlur={commitRename}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="zw-sb-item__label">{note.title || 'Untitled'}</span>
      )}
      <span className="zw-sb-item-trailing">
        <button className="zw-sb-item-menu" onClick={(e) => { e.stopPropagation(); onDelete(note.id) }} title="Delete">
          {Icons.x()}
        </button>
      </span>
    </button>
  )

  const renderFolder = (folder: Folder) => {
    const isExpanded = expandedFolders.has(folder.id)
    const folderNotes = notesByFolder.get(folder.id) || []
    const childFolders = folders.filter(f => f.parentId === folder.id)

    return (
      <div key={folder.id} className="zw-sb-folder">
        <button
          className="zw-sb-item zw-sb-item--folder"
          onClick={() => toggleFolder(folder.id)}
          onDoubleClick={(e) => { e.preventDefault(); startRename(folder.id, folder.name) }}
          onContextMenu={(e) => handleContextMenu(e, folder.id, 'folder')}
        >
          <svg viewBox="0 0 24 24" style={{ width: 12, height: 12, transition: 'transform 0.12s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
          {Icons.folder()}
          {renamingId === folder.id ? (
            <input
              ref={renameInputRef}
              className="zw-sb-rename-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') cancelRename()
              }}
              onBlur={commitRename}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="zw-sb-item__label">{folder.name}</span>
          )}
          <span className="zw-sb-item-trailing">
            <button className="zw-sb-item-menu" onClick={(e) => { e.stopPropagation(); onAdd(folder.id) }} title="New file">
              {Icons.plus()}
            </button>
            <button className="zw-sb-item-menu" onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id) }} title="Delete folder">
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
    <div className="sb-panel sb-panel--files">
      <div className="sb-section">
        <div className="sb-section__header">
          <span className="sb-section__title">Files</span>
          <div ref={createMenuRef} style={{ position: 'relative' }}>
            <button className="sb-section__action" onClick={() => setShowCreateMenu(!showCreateMenu)} title="New...">
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

        {/* Search */}
        <div className="zw-sb-search">
          <div className="zw-sb-search-wrap">
            <span className="zw-sb-search-icon">{Icons.search()}</span>
            <input
              type="text"
              className="zw-sb-search-field"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="zw-sb-files-scroll">
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
            <div style={{ textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 11, padding: '12px 0' }}>
              {notes.length === 0 ? 'No notes yet' : 'No results'}
            </div>
          )}
          <div className="zw-sb-items">
            {rootFolders.map(renderFolder)}
            {rootNotes.map(renderNote)}
          </div>
        </div>
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <div
          className="zw-sb-ctx-menu"
          style={{ position: 'fixed', left: ctxMenu.x, top: ctxMenu.y, zIndex: 9999 }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button className="zw-sb-ctx-item" onClick={() => {
            const item = ctxMenu.type === 'note'
              ? notes.find(n => n.id === ctxMenu.id)
              : folders.find(f => f.id === ctxMenu.id)
            if (item) startRename(ctxMenu.id, ctxMenu.type === 'note' ? (item as Note).title || 'Untitled' : (item as Folder).name)
          }}>
            {Icons.edit()}
            <span>Rename</span>
          </button>
          {ctxMenu.type === 'note' && onDuplicate && (
            <button className="zw-sb-ctx-item" onClick={() => { onDuplicate(ctxMenu.id); setCtxMenu(null) }}>
              {Icons.copy()}
              <span>Duplicate</span>
            </button>
          )}
          {ctxMenu.type === 'note' && (
            <button className="zw-sb-ctx-item" onClick={() => { onAdd(undefined); setCtxMenu(null) }}>
              {Icons.plus()}
              <span>New file</span>
            </button>
          )}
          {ctxMenu.type === 'folder' && (
            <button className="zw-sb-ctx-item" onClick={() => { onAdd(ctxMenu.id); setCtxMenu(null) }}>
              {Icons.plus()}
              <span>New file in folder</span>
            </button>
          )}
          <div className="zw-sb-ctx-divider" />
          <button className="zw-sb-ctx-item zw-sb-ctx-item--danger" onClick={() => {
            if (ctxMenu.type === 'note') onDelete(ctxMenu.id)
            else onDeleteFolder(ctxMenu.id)
            setCtxMenu(null)
          }}>
            {Icons.x()}
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  )
}
