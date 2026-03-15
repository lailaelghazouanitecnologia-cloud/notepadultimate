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

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('es', { day: 'numeric', month: 'short' })
  }

  return (
    <aside
      className="w-60 h-full flex flex-col flex-shrink-0"
      style={{
        background: 'var(--sidebar-bg)',
        borderRight: '0.5px solid var(--border-color)',
      }}
    >
      {/* Header */}
      <div
        className="h-10 flex items-center justify-between px-3 flex-shrink-0"
        style={{ borderBottom: '0.5px solid var(--border-color)' }}
      >
        <span className="text-[13px] font-semibold" style={{ color: 'var(--fg)', letterSpacing: '-0.02em' }}>
          Zarnetti
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={onToggleTheme}
            className="h-7 w-7 flex items-center justify-center rounded-md transition-colors"
            style={{ color: 'var(--muted-fg)' }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button
            onClick={onAdd}
            className="h-7 w-7 flex items-center justify-center rounded-md transition-colors"
            style={{ color: 'var(--muted-fg)' }}
            aria-label="New note"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-2 py-2">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--muted-fg)', opacity: 0.5 }}
          />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-7 rounded-lg text-[13px] pl-8 pr-3 outline-none"
            style={{
              background: 'var(--muted-bg)',
              color: 'var(--fg)',
              border: '0.5px solid transparent',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'transparent')}
          />
        </div>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {filtered.length === 0 && (
          <div className="text-center text-xs py-8" style={{ color: 'var(--muted-fg)' }}>
            {notes.length === 0 ? 'Crea tu primera nota' : 'Sin resultados'}
          </div>
        )}
        <div className="flex flex-col gap-px">
          {filtered.map((note) => (
            <div key={note.id} className="group relative">
              <button
                onClick={() => onSelect(note.id)}
                className="w-full text-left px-2.5 py-2 rounded-md text-[13px] transition-colors"
                style={{
                  background: activeId === note.id ? 'var(--sidebar-active-bg)' : 'transparent',
                  color: activeId === note.id ? 'var(--fg)' : 'var(--sidebar-fg)',
                }}
                onMouseEnter={(e) => {
                  if (activeId !== note.id) {
                    e.currentTarget.style.background = 'color-mix(in srgb, var(--muted-bg) 60%, transparent)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeId !== note.id) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <FileText size={14} className="flex-shrink-0" style={{ opacity: 0.4 }} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{note.title}</div>
                    <div className="truncate text-[11px] mt-0.5" style={{ color: 'var(--muted-fg)' }}>
                      {formatDate(note.updatedAt)}
                      {note.content && (
                        <span style={{ opacity: 0.6, marginLeft: '6px' }}>
                          {note.content.slice(0, 30)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
              {/* Delete button on hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(note.id)
                }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--muted-fg)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted-fg)')}
                aria-label="Delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
