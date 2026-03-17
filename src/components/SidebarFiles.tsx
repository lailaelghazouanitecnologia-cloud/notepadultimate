import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import type { Note, Folder, Workspace } from '../types'
import { Icons, FileTypeIcon } from '../lib/icons'

interface SidebarFilesProps {
  notes: Note[]
  activeId: string | null
  onSelect: (id: string) => void
  onAdd: (folderId?: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, newTitle: string) => void
  onDuplicate?: (id: string) => void
  onMoveNoteToFolder: (noteId: string, folderId: string | null) => void
  folders: Folder[]
  onCreateFolder: (name: string, parentId?: string) => void
  onRenameFolder?: (id: string, newName: string) => void
  onMoveFolderToParent: (folderId: string, parentId: string | null) => void
  // Workspace support
  workspaces: Workspace[]
  activeWorkspaceId: string
  onSwitchWorkspace: (id: string) => void
  onCreateWorkspace: (name: string) => void
}

export function SidebarFiles({
  notes, activeId, onSelect, onAdd, onDelete, onRename, onDuplicate,
  onMoveNoteToFolder,
  folders, onCreateFolder, onRenameFolder, onMoveFolderToParent,
  workspaces, activeWorkspaceId, onSwitchWorkspace, onCreateWorkspace,
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
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)

  // Workspace selector state
  const [showWsMenu, setShowWsMenu] = useState(false)
  const [creatingWs, setCreatingWs] = useState(false)
  const [newWsName, setNewWsName] = useState('')
  const wsMenuRef = useRef<HTMLDivElement>(null)
  const wsInputRef = useRef<HTMLInputElement>(null)

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId)

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

  // --- Drag & Drop ---
  const handleDragStart = useCallback((e: React.DragEvent, id: string, type: 'note' | 'folder') => {
    e.dataTransfer.setData('application/x-item-id', id)
    e.dataTransfer.setData('application/x-item-type', type)
    if (type === 'note') {
      const note = notes.find(n => n.id === id)
      e.dataTransfer.setData('text/note-id', id)
      e.dataTransfer.setData('text/note-title', note?.title || 'Untitled')
    }
    e.dataTransfer.effectAllowed = 'move'
  }, [notes])

  const handleDragOver = useCallback((e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const draggedId = e.dataTransfer.types.includes('application/x-item-id')
    if (draggedId) {
      e.dataTransfer.dropEffect = 'move'
      setDropTargetId(targetFolderId)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.stopPropagation()
    setDropTargetId(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDropTargetId(null)
    const itemId = e.dataTransfer.getData('application/x-item-id')
    const itemType = e.dataTransfer.getData('application/x-item-type')
    if (!itemId) return
    if (itemType === 'note') {
      onMoveNoteToFolder(itemId, targetFolderId)
    } else if (itemType === 'folder') {
      // Prevent dropping folder into itself or its own children
      if (itemId === targetFolderId) return
      if (isDescendant(itemId, targetFolderId)) return
      onMoveFolderToParent(itemId, targetFolderId)
    }
  }, [onMoveNoteToFolder, onMoveFolderToParent])

  const handleDropOnRoot = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDropTargetId(null)
    const itemId = e.dataTransfer.getData('application/x-item-id')
    const itemType = e.dataTransfer.getData('application/x-item-type')
    if (!itemId) return
    if (itemType === 'note') {
      onMoveNoteToFolder(itemId, null)
    } else if (itemType === 'folder') {
      onMoveFolderToParent(itemId, null)
    }
  }, [onMoveNoteToFolder, onMoveFolderToParent])

  // Check if possibleChild is a descendant of possibleParent
  const isDescendant = (possibleParentId: string, folderId: string): boolean => {
    const folder = folders.find(f => f.id === folderId)
    if (!folder?.parentId) return false
    if (folder.parentId === possibleParentId) return true
    return isDescendant(possibleParentId, folder.parentId)
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

  useEffect(() => {
    if (!showWsMenu) return
    const handler = (e: MouseEvent) => {
      if (wsMenuRef.current && !wsMenuRef.current.contains(e.target as Node)) {
        setShowWsMenu(false)
        setCreatingWs(false)
        setNewWsName('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showWsMenu])

  useEffect(() => {
    if (creatingWs) wsInputRef.current?.focus()
  }, [creatingWs])

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

  const handleCreateWs = () => {
    const trimmed = newWsName.trim()
    if (!trimmed) return
    onCreateWorkspace(trimmed)
    setNewWsName('')
    setCreatingWs(false)
    setShowWsMenu(false)
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
      draggable
      onDragStart={(e) => handleDragStart(e, note.id, 'note')}
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
    const isDragOver = dropTargetId === folder.id

    return (
      <div key={folder.id} className="zw-sb-folder">
        <button
          className={`zw-sb-item zw-sb-item--folder ${isDragOver ? 'zw-sb-item--drop-target' : ''}`}
          onClick={() => toggleFolder(folder.id)}
          onDoubleClick={(e) => { e.preventDefault(); startRename(folder.id, folder.name) }}
          onContextMenu={(e) => handleContextMenu(e, folder.id, 'folder')}
          draggable
          onDragStart={(e) => handleDragStart(e, folder.id, 'folder')}
          onDragOver={(e) => handleDragOver(e, folder.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, folder.id)}
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
        {/* Workspace selector */}
        <div className="zw-ws-selector" ref={wsMenuRef}>
          <button className="zw-ws-selector__btn" onClick={() => setShowWsMenu(!showWsMenu)}>
            <span className="zw-ws-selector__name">{activeWorkspace?.name || 'Workspace'}</span>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {showWsMenu && (
            <div className="zw-ws-menu">
              {workspaces.map(ws => (
                <button
                  key={ws.id}
                  className={`zw-ws-menu__item ${ws.id === activeWorkspaceId ? 'active' : ''}`}
                  onClick={() => { onSwitchWorkspace(ws.id); setShowWsMenu(false) }}
                >
                  {ws.id === activeWorkspaceId ? Icons.check() : Icons.folder()}
                  <span>{ws.name}</span>
                </button>
              ))}
              <div className="zw-ws-menu__divider" />
              {creatingWs ? (
                <div className="zw-ws-menu__item" style={{ cursor: 'default' }}>
                  {Icons.plus()}
                  <input
                    ref={wsInputRef}
                    className="zw-sb-rename-input"
                    placeholder="Workspace name..."
                    value={newWsName}
                    onChange={(e) => setNewWsName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateWs()
                      if (e.key === 'Escape') { setCreatingWs(false); setNewWsName('') }
                    }}
                    onBlur={() => { if (newWsName.trim()) handleCreateWs(); else { setCreatingWs(false); setNewWsName('') } }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              ) : (
                <button className="zw-ws-menu__item" onClick={() => setCreatingWs(true)}>
                  {Icons.plus()}
                  <span>New workspace</span>
                </button>
              )}
            </div>
          )}
        </div>

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

        <div
          className="zw-sb-files-scroll"
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
          onDrop={handleDropOnRoot}
        >
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
          {ctxMenu.type === 'note' && (
            <>
              <div className="zw-sb-ctx-divider" />
              <button className="zw-sb-ctx-item zw-sb-ctx-item--danger" onClick={() => {
                onDelete(ctxMenu.id)
                setCtxMenu(null)
              }}>
                {Icons.x()}
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
