import { useState, useCallback, useEffect } from 'react'
import type { Note } from '../types'
import { loadNotes, saveNotes, createNote } from '../store'

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes())
  const [activeId, setActiveId] = useState<string | null>(() => {
    const loaded = loadNotes()
    return loaded.length > 0 ? loaded[0].id : null
  })

  useEffect(() => {
    saveNotes(notes)
  }, [notes])

  const activeNote = notes.find((n) => n.id === activeId) ?? null

  const addNote = useCallback(() => {
    const note = createNote()
    setNotes((prev) => [note, ...prev])
    setActiveId(note.id)
    return note
  }, [])

  const updateNote = useCallback((id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'published'>>) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
      )
    )
  }, [])

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => {
      const filtered = prev.filter((n) => n.id !== id)
      if (activeId === id) {
        setActiveId(filtered.length > 0 ? filtered[0].id : null)
      }
      return filtered
    })
  }, [activeId])

  return {
    notes,
    activeNote,
    activeId,
    setActiveId,
    addNote,
    updateNote,
    deleteNote,
  }
}
