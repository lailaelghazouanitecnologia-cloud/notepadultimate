import { useState } from 'react'
import type { Note } from '../types'
import { Search, Plus, FileText, Trash2, Sun, Moon } from 'lucide-react'

interface SidebarProps {
  notes: Note[]
  activeId: string | null
  onSelect: (id: string) => void
  onAdd: () => void
  onDelete: (id: string) => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export function Sidebar({
  notes,
  activeId,
  onSelect,
  onAdd,
  onDelete,
  theme,
  onToggleTheme,
}: SidebarProps) {
  const [search, setSearch] = useState('')

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('es', { day: 'numeric', month: 'short' })

  return (
    <aside
      style={{
        width: 260,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border-color)',
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          borderBottom: '1px solid var(--border-color)',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)', letterSpacing: '-0.02em' }}>
          Zarnetti
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button
            onClick={onToggleTheme}
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              border: 'none',
              background: 'transparent',
              color: 'var(--muted-fg)',
              cursor: 'pointer',
            }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            onClick={onAdd}
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              border: 'none',
              background: 'transparent',
              color: 'var(--muted-fg)',
              cursor: 'pointer',
            }}
            aria-label="New note"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '8px 10px' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--muted-fg)',
              opacity: 0.6,
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Buscar notas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              height: 32,
              borderRadius: 8,
              fontSize: 13,
              paddingLeft: 32,
              paddingRight: 12,
              border: '1px solid var(--border-color)',
              background: 'var(--muted-bg)',
              color: 'var(--fg)',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Notes list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--muted-fg)', fontSize: 12, padding: '32px 0' }}>
            {notes.length === 0 ? 'Crea tu primera nota' : 'Sin resultados'}
          </div>
        )}
        {filtered.map((note) => (
          <div
            key={note.id}
            style={{ position: 'relative', marginBottom: 2 }}
            className="group"
          >
            <button
              onClick={() => onSelect(note.id)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 10px',
                borderRadius: 8,
                fontSize: 13,
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.15s',
                background: activeId === note.id ? 'var(--sidebar-active-bg)' : 'transparent',
                color: activeId === note.id ? 'var(--fg)' : 'var(--sidebar-fg)',
              }}
              onMouseEnter={(e) => {
                if (activeId !== note.id) e.currentTarget.style.background = 'var(--hover-bg)'
              }}
              onMouseLeave={(e) => {
                if (activeId !== note.id) e.currentTarget.style.background = 'transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={14} style={{ flexShrink: 0, opacity: 0.4 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {note.title}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: 'var(--muted-fg)',
                    marginTop: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {formatDate(note.updatedAt)}
                    {note.content && (
                      <span style={{ opacity: 0.5, marginLeft: 6 }}>
                        {note.content.slice(0, 30)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(note.id) }}
              className="group-hover:opacity-100"
              style={{
                position: 'absolute',
                right: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                color: 'var(--muted-fg)',
                cursor: 'pointer',
                opacity: 0,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted-fg)')}
              aria-label="Delete"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </aside>
  )
}
