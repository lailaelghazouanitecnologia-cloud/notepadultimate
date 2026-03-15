import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import type { Note } from '../types'
import { renderMarkdown } from '../lib/markdown'
import '../lib/markdown.css'
import { Eye, Pencil, Columns2, Trash2 } from 'lucide-react'

type ViewMode = 'edit' | 'preview' | 'split'

interface EditorProps {
  note: Note
  onUpdate: (id: string, updates: Partial<Pick<Note, 'title' | 'content'>>) => void
  onDelete: (id: string) => void
}

export function Editor({ note, onUpdate, onDelete }: EditorProps) {
  const [mode, setMode] = useState<ViewMode>('edit')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if ((mode === 'edit' || mode === 'split') && textareaRef.current) {
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab support
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.currentTarget
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const value = ta.value
      onUpdate(note.id, {
        content: value.substring(0, start) + '  ' + value.substring(end),
      })
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2
      })
    }
  }

  const renderedHtml = useMemo(() => renderMarkdown(note.content), [note.content])

  const wordCount = useMemo(() => {
    const words = note.content.trim().split(/\s+/).filter(Boolean).length
    const chars = note.content.length
    return { words, chars }
  }, [note.content])

  return (
    <div className="flex-1 flex flex-col h-full" style={{ background: 'var(--editor-bg)' }}>
      {/* Header - centered title, like 21st.dev */}
      <div
        className="h-10 flex items-center justify-between px-2.5 relative flex-shrink-0"
        style={{ borderBottom: '0.5px solid var(--border-color)', background: 'var(--bg)' }}
      >
        {/* Left: mode toggles */}
        <div className="flex items-center gap-0.5 z-10">
          <button
            onClick={() => setMode('edit')}
            className="h-7 w-7 flex items-center justify-center rounded-md transition-colors"
            style={{
              color: mode === 'edit' ? 'var(--fg)' : 'var(--muted-fg)',
              background: mode === 'edit' ? 'var(--accent-bg)' : 'transparent',
            }}
            aria-label="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => setMode('split')}
            className="h-7 w-7 flex items-center justify-center rounded-md transition-colors"
            style={{
              color: mode === 'split' ? 'var(--fg)' : 'var(--muted-fg)',
              background: mode === 'split' ? 'var(--accent-bg)' : 'transparent',
            }}
            aria-label="Split"
          >
            <Columns2 size={14} />
          </button>
          <button
            onClick={() => setMode('preview')}
            className="h-7 w-7 flex items-center justify-center rounded-md transition-colors"
            style={{
              color: mode === 'preview' ? 'var(--fg)' : 'var(--muted-fg)',
              background: mode === 'preview' ? 'var(--accent-bg)' : 'transparent',
            }}
            aria-label="Preview"
          >
            <Eye size={14} />
          </button>
        </div>

        {/* Center: note title */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <span
            className="text-[13px] font-medium truncate max-w-[50%]"
            style={{ color: 'var(--fg)' }}
          >
            {note.title || 'Sin título'}
          </span>
        </div>

        {/* Right: meta + delete */}
        <div className="flex items-center gap-2 z-10">
          <span className="text-[11px] hidden sm:inline" style={{ color: 'var(--muted-fg)' }}>
            {wordCount.words}w · {wordCount.chars}c
          </span>
          <button
            onClick={() => onDelete(note.id)}
            className="h-7 w-7 flex items-center justify-center rounded-md transition-colors"
            style={{ color: 'var(--muted-fg)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted-fg)')}
            aria-label="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor pane */}
        {(mode === 'edit' || mode === 'split') && (
          <div
            className="flex-1 flex flex-col overflow-y-auto"
            style={mode === 'split' ? { borderRight: '1px solid var(--border-color)' } : {}}
          >
            <div className="max-w-3xl w-full mx-auto px-6 sm:px-8 py-5 flex-1 flex flex-col">
              <input
                type="text"
                value={note.title}
                onChange={handleTitleChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    textareaRef.current?.focus()
                  }
                }}
                placeholder="Título de la nota"
                className="w-full text-xl font-semibold border-0 outline-none mb-3"
                style={{
                  background: 'transparent',
                  color: 'var(--fg)',
                  letterSpacing: '-0.02em',
                }}
              />
              <textarea
                ref={textareaRef}
                value={note.content}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                placeholder="Escribe en Markdown..."
                className="w-full flex-1 border-0 outline-none resize-none font-mono text-sm"
                style={{
                  background: 'transparent',
                  color: 'var(--fg)',
                  lineHeight: '1.8',
                  minHeight: 'calc(100vh - 160px)',
                }}
                spellCheck={false}
              />
            </div>
          </div>
        )}

        {/* Preview pane */}
        {(mode === 'preview' || mode === 'split') && (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl w-full mx-auto px-6 sm:px-8 py-5">
              {note.content ? (
                <div
                  className="zn-preview"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              ) : (
                <p className="italic text-sm" style={{ color: 'var(--muted-fg)' }}>
                  Empieza a escribir para ver la vista previa...
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
