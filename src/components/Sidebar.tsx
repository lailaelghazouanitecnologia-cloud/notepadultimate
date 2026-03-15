import { useState } from 'react'
import type { Note } from '../types'
import {
  Search,
  Plus,
  FileText,
  Trash2,
  Sun,
  Moon,
} from 'lucide-react'
import * as ContextMenu from '@radix-ui/react-context-menu'

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
    const d = new Date(ts)
    return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
  }

  return (
    <aside className="w-64 h-full flex flex-col bg-sidebar border-r border-border flex-shrink-0">
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b border-border">
        <h1 className="text-sm font-semibold text-foreground tracking-tight">
          Zarnetti
        </h1>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button
            onClick={onAdd}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="New note"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-2">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar notas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 rounded-md text-sm bg-muted border-0 pl-8 pr-3 text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-border"
          />
        </div>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {filtered.length === 0 && (
          <div className="text-center text-muted-foreground text-xs py-8">
            {notes.length === 0 ? 'Crea tu primera nota' : 'Sin resultados'}
          </div>
        )}
        <div className="flex flex-col gap-0.5">
          {filtered.map((note) => (
            <ContextMenu.Root key={note.id}>
              <ContextMenu.Trigger asChild>
                <button
                  onClick={() => onSelect(note.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-md text-sm transition-colors group ${
                    activeId === note.id
                      ? 'bg-sidebar-active text-foreground'
                      : 'text-sidebar-foreground hover:bg-accent/50 hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="flex-shrink-0 opacity-50" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-[13px]">
                        {note.title}
                      </div>
                      <div className="truncate text-xs text-muted-foreground mt-0.5">
                        {formatDate(note.updatedAt)}
                        {note.content && (
                          <span className="ml-2 opacity-60">
                            {note.content.slice(0, 40)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              </ContextMenu.Trigger>
              <ContextMenu.Portal>
                <ContextMenu.Content className="min-w-[160px] bg-card border border-border rounded-lg p-1 shadow-lg">
                  <ContextMenu.Item
                    className="flex items-center gap-2 px-2.5 py-1.5 text-sm rounded-md cursor-pointer outline-none text-red-500 hover:bg-accent focus:bg-accent"
                    onClick={() => onDelete(note.id)}
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </ContextMenu.Item>
                </ContextMenu.Content>
              </ContextMenu.Portal>
            </ContextMenu.Root>
          ))}
        </div>
      </div>
    </aside>
  )
}
