import { useState } from 'react'
import type { Note } from '../types'
import { Icons } from '../lib/icons'

interface SidebarProps {
  notes: Note[]
  activeId: string | null
  onSelect: (id: string) => void
  onAdd: () => void
  onDelete: (id: string) => void
}

export function Sidebar({ notes, activeId, onSelect, onAdd, onDelete }: SidebarProps) {
  const [search, setSearch] = useState('')

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('es', { day: 'numeric', month: 'short' })

  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <button className="icon-btn" onClick={onAdd} aria-label="New note">
          {Icons.plus()}
        </button>
      </header>

      <div className="sidebar__search" style={{ position: 'relative' }}>
        <svg className="sidebar__search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
        </svg>
        <input
          type="text"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="sidebar__title">Notes</div>

      <nav className="sidebar__content">
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: 12, padding: '24px 0' }}>
            {notes.length === 0 ? 'No notes yet' : 'No results'}
          </div>
        )}
        {filtered.map((note) => (
          <button
            key={note.id}
            className={`note-item ${activeId === note.id ? 'active' : ''}`}
            onClick={() => onSelect(note.id)}
          >
            <svg className="note-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
            </svg>
            <div className="note-item__text">
              <div className="note-item__title">{note.title}</div>
              <div className="note-item__meta">{formatDate(note.updatedAt)}</div>
            </div>
            <button
              className="note-item__delete"
              onClick={(e) => { e.stopPropagation(); onDelete(note.id) }}
              aria-label="Delete"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </button>
        ))}
      </nav>
    </aside>
  )
}
