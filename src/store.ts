import type { Note } from './types'

const STORAGE_KEY = 'zarnetti-notes'
const PUBLISHED_KEY = 'zarnetti-published'

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

export function loadPublished(): Note[] {
  try {
    const raw = localStorage.getItem(PUBLISHED_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function publishNote(note: Note, author: string): void {
  const published = loadPublished()
  const existing = published.findIndex((n) => n.id === note.id)
  const entry: Note = { ...note, published: true, author }
  if (existing >= 0) published[existing] = entry
  else published.push(entry)
  localStorage.setItem(PUBLISHED_KEY, JSON.stringify(published))
}
