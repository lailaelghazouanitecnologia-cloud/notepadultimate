import { useState } from 'react'
import type { Note } from '../types'
import type { View } from '../App'
import { ZarnettiLogo, Identicon, Icons } from '../lib/icons'

interface SidebarProps {
  notes: Note[]
  activeId: string | null
  onSelect: (id: string) => void
  onAdd: () => void
  onDelete: (id: string) => void
  activeView: View
  onViewChange: (view: View) => void
}

export function Sidebar({ notes, activeId, onSelect, onAdd, onDelete, activeView, onViewChange }: SidebarProps) {
  const [search, setSearch] = useState('')

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('es', { day: 'numeric', month: 'short' })

  const navItems: { id: View; icon: (p?: object) => React.ReactNode; label: string }[] = [
    { id: 'home', icon: Icons.sparkles, label: 'Chat' },
    { id: 'files', icon: Icons.files, label: 'Files' },
    { id: 'graph', icon: Icons.graph, label: 'Graph' },
  ]

  return (
    <aside className="zw-sb">
      {/* Left: icon rail */}
      <div className="zw-sb-rail">
        <div className="zw-sb-rail-top">
          <div className="zw-sb-rail-logo">
            <ZarnettiLogo className="zw-sb-rail-logo-svg" />
          </div>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`zw-sb-rail-btn ${activeView === item.id ? 'active' : ''}`}
              onClick={() => onViewChange(item.id)}
              title={item.label}
            >
              {item.icon()}
            </button>
          ))}
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

      {/* Right: content panel */}
      <div className="zw-sb-content">
        <div className="zw-ws-dropdown">
          <button className="zw-ws-trigger">
            {Icons.files()}
            <span>Zarnetti</span>
          </button>
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
                {Icons.file()}
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
