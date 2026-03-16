import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { Note, Folder } from '../types'
import {
  loadNotes, saveNotes, createNote,
  publishNote as publishNoteStore, loadPublished,
  loadFolders, createFolder as createFolderStore, deleteFolder as deleteFolderStore,
} from '../store'

interface NotesContextValue {
  notes: Note[]
  activeId: string | null
  setActiveId: (id: string | null) => void
  activeNote: Note | null
  addNote: () => Note
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  publishedNotes: Note[]
  publishNote: (note: Note, author: string, authorId?: string) => void
  folders: Folder[]
  createFolder: (name: string, parentId?: string) => void
  deleteFolder: (id: string) => void
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

  useEffect(() => { saveNotes(notes) }, [notes])

  const activeNote = notes.find((n) => n.id === activeId) ?? null

  const addNote = useCallback(() => {
    const note = createNote()
    setNotes((prev) => [note, ...prev])
    setActiveId(note.id)
    return note
  }, [])

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

  const publishNote = useCallback((note: Note, author: string, authorId?: string) => {
    publishNoteStore(note, author, authorId)
    setPublishedNotes(loadPublished())
  }, [])

  const createFolder = useCallback((name: string, parentId?: string) => {
    createFolderStore(name, parentId)
    setFolders(loadFolders())
  }, [])

  const deleteFolder = useCallback((id: string) => {
    deleteFolderStore(id)
    setFolders(loadFolders())
  }, [])

  return (
    <NotesContext.Provider value={{
      notes, activeId, setActiveId, activeNote,
      addNote, updateNote, deleteNote,
      publishedNotes, publishNote,
      folders, createFolder, deleteFolder,
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
