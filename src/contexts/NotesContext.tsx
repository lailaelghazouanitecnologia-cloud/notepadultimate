import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react'
import type { Note, Folder, Workspace } from '../types'
import {
  loadNotes, saveNotes, createNote,
  publishNote as publishNoteStore, loadPublished,
  loadFolders, createFolder as createFolderStore, deleteFolder as deleteFolderStore, saveFolders,
  loadWorkspaces, createWorkspace as createWorkspaceStore,
  getActiveWorkspaceId, setActiveWorkspaceId as setActiveWsStore,
} from '../store'

interface NotesContextValue {
  notes: Note[]
  activeId: string | null
  setActiveId: (id: string | null) => void
  activeNote: Note | null
  addNote: () => Note
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  moveNoteToFolder: (noteId: string, folderId: string | null) => void
  publishedNotes: Note[]
  publishNote: (note: Note, author: string, authorId?: string) => void
  folders: Folder[]
  createFolder: (name: string, parentId?: string) => Folder
  deleteFolder: (id: string) => void
  moveFolderToParent: (folderId: string, parentId: string | null) => void
  workspaces: Workspace[]
  activeWorkspaceId: string
  setActiveWorkspaceId: (id: string) => void
  createWorkspace: (name: string, spaceId: string) => void
  workspaceNotes: Note[]
  workspaceFolders: Folder[]
}

const NotesContext = createContext<NotesContextValue | null>(null)

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes())
  const [activeId, setActiveId] = useState<string | null>(() => {
    const loaded = loadNotes()
    return loaded.length > 0 ? loaded[0].id : null
  })
  const [publishedNotes, setPublishedNotes] = useState<Note[]>(() => loadPublished())
  const [folders, setFolders] = useState<Folder[]>(() => loadFolders())
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => loadWorkspaces())
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string>(() => getActiveWorkspaceId())

  useEffect(() => { saveNotes(notes) }, [notes])

  const activeNote = notes.find((n) => n.id === activeId) ?? null

  // Contract folder IDs (excluded from workspace views)
  const contractFolderIds = useMemo(() => {
    const ids = new Set<string>()
    const root = folders.find(f => f.name === 'contract' && !f.parentId)
    if (!root) return ids
    ids.add(root.id)
    // Add all descendants
    const addChildren = (parentId: string) => {
      folders.filter(f => f.parentId === parentId).forEach(f => { ids.add(f.id); addChildren(f.id) })
    }
    addChildren(root.id)
    return ids
  }, [folders])

  // Filter notes/folders by active workspace, excluding contract tree
  const workspaceNotes = useMemo(() =>
    notes.filter(n =>
      (!n.workspaceId || n.workspaceId === activeWorkspaceId) &&
      (!n.folderId || !contractFolderIds.has(n.folderId))
    ),
    [notes, activeWorkspaceId, contractFolderIds]
  )
  const workspaceFolders = useMemo(() =>
    folders.filter(f =>
      (!f.workspaceId || f.workspaceId === activeWorkspaceId) &&
      !contractFolderIds.has(f.id)
    ),
    [folders, activeWorkspaceId, contractFolderIds]
  )

  const addNote = useCallback(() => {
    const note = createNote()
    note.workspaceId = activeWorkspaceId
    setNotes((prev) => [note, ...prev])
    setActiveId(note.id)
    return note
  }, [activeWorkspaceId])

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n)
    )
  }, [])

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => {
      const filtered = prev.filter((n) => n.id !== id)
      setActiveId((currentId) => currentId === id ? (filtered[0]?.id ?? null) : currentId)
      return filtered
    })
  }, [])

  const moveNoteToFolder = useCallback((noteId: string, folderId: string | null) => {
    setNotes(prev =>
      prev.map(n => n.id === noteId ? { ...n, folderId: folderId || undefined, updatedAt: Date.now() } : n)
    )
  }, [])

  const publishNote = useCallback((note: Note, author: string, authorId?: string) => {
    publishNoteStore(note, author, authorId)
    setPublishedNotes(loadPublished())
  }, [])

  const createFolder = useCallback((name: string, parentId?: string): Folder => {
    const folder = createFolderStore(name, parentId)
    // Assign workspace to the new folder
    const all = loadFolders()
    const idx = all.findIndex(f => f.id === folder.id)
    if (idx >= 0) { all[idx].workspaceId = activeWorkspaceId; saveFolders(all) }
    setFolders(loadFolders())
    return folder
  }, [activeWorkspaceId])

  const deleteFolder = useCallback((id: string) => {
    deleteFolderStore(id)
    setFolders(loadFolders())
  }, [])

  const moveFolderToParent = useCallback((folderId: string, parentId: string | null) => {
    setFolders(prev => {
      const next = prev.map(f => f.id === folderId ? { ...f, parentId: parentId || undefined } : f)
      saveFolders(next)
      return next
    })
  }, [])

  const setActiveWorkspaceId = useCallback((id: string) => {
    setActiveWorkspaceIdState(id)
    setActiveWsStore(id)
  }, [])

  const createWorkspace = useCallback((name: string, spaceId: string) => {
    const ws = createWorkspaceStore(name, spaceId)
    setWorkspaces(loadWorkspaces())
    setActiveWorkspaceId(ws.id)
  }, [setActiveWorkspaceId])

  return (
    <NotesContext.Provider value={{
      notes, activeId, setActiveId, activeNote,
      addNote, updateNote, deleteNote, moveNoteToFolder,
      publishedNotes, publishNote,
      folders, createFolder, deleteFolder, moveFolderToParent,
      workspaces, activeWorkspaceId, setActiveWorkspaceId, createWorkspace,
      workspaceNotes, workspaceFolders,
    }}>
      {children}
    </NotesContext.Provider>
  )
}

export function useNotesContext() {
  const ctx = useContext(NotesContext)
  if (!ctx) throw new Error('useNotesContext must be used within NotesProvider')
  return ctx
}
