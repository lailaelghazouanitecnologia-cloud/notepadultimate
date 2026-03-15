import type { Note } from './types'

const STORAGE_KEY = 'zarnetti-notes'

export function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveNotes(notes: Note[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

export function createNote(): Note {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    title: 'Sin título',
    content: '',
    createdAt: now,
    updatedAt: now,
  }
}
