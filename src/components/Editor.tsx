import { useState, useCallback, useRef, useEffect } from 'react'
import type { Note } from '../types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Eye, Pencil, Trash2 } from 'lucide-react'

interface EditorProps {
  note: Note
  onUpdate: (id: string, updates: Partial<Pick<Note, 'title' | 'content'>>) => void
  onDelete: (id: string) => void
}

export function Editor({ note, onUpdate, onDelete }: EditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (mode === 'edit' && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [note.id, mode])

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate(note.id, { title: e.target.value })
    },
    [note.id, onUpdate]
  )

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onUpdate(note.id, { content: e.target.value })
    },
    [note.id, onUpdate]
  )

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      textareaRef.current?.focus()
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-editor">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMode('edit')}
            className={`p-1.5 rounded-md text-sm transition-colors ${
              mode === 'edit'
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
            aria-label="Edit mode"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => setMode('preview')}
            className={`p-1.5 rounded-md text-sm transition-colors ${
              mode === 'preview'
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
            aria-label="Preview mode"
          >
            <Eye size={14} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {new Date(note.updatedAt).toLocaleString('es', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <button
            onClick={() => onDelete(note.id)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-accent/50 transition-colors"
            aria-label="Delete note"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-6">
          {/* Title */}
          <input
            ref={titleRef}
            type="text"
            value={note.title}
            onChange={handleTitleChange}
            onKeyDown={handleTitleKeyDown}
            placeholder="Título de la nota"
            className="w-full text-2xl font-bold bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground/40 mb-4"
          />

          {mode === 'edit' ? (
            <textarea
              ref={textareaRef}
              value={note.content}
              onChange={handleContentChange}
              placeholder="Escribe en Markdown..."
              className="w-full min-h-[calc(100vh-200px)] bg-transparent border-0 outline-none resize-none text-sm leading-7 text-foreground placeholder:text-muted-foreground/40 font-mono"
              spellCheck={false}
            />
          ) : (
            <div className="markdown-body text-sm text-foreground">
              {note.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {note.content}
                </ReactMarkdown>
              ) : (
                <p className="text-muted-foreground italic">Nota vacía</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
