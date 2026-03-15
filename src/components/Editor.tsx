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

function ModeButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: 28,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        border: 'none',
        cursor: 'pointer',
        transition: 'background 0.15s, color 0.15s',
        color: active ? 'var(--fg)' : 'var(--muted-fg)',
        background: active ? 'var(--accent-bg)' : 'transparent',
      }}
    >
      {children}
    </button>
  )
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
    (e: React.ChangeEvent<HTMLInputElement>) => onUpdate(note.id, { title: e.target.value }),
    [note.id, onUpdate]
  )

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => onUpdate(note.id, { content: e.target.value }),
    [note.id, onUpdate]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.currentTarget
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const value = ta.value
      onUpdate(note.id, { content: value.substring(0, start) + '  ' + value.substring(end) })
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 2 })
    }
  }

  const renderedHtml = useMemo(() => renderMarkdown(note.content), [note.content])

  const wordCount = useMemo(() => {
    const words = note.content.trim().split(/\s+/).filter(Boolean).length
    return { words, chars: note.content.length }
  }, [note.content])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--editor-bg)' }}>
      {/* Header */}
      <div
        style={{
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg)',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {/* Left: mode toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, zIndex: 1 }}>
          <ModeButton active={mode === 'edit'} onClick={() => setMode('edit')} label="Edit">
            <Pencil size={14} />
          </ModeButton>
          <ModeButton active={mode === 'split'} onClick={() => setMode('split')} label="Split">
            <Columns2 size={14} />
          </ModeButton>
          <ModeButton active={mode === 'preview'} onClick={() => setMode('preview')} label="Preview">
            <Eye size={14} />
          </ModeButton>
        </div>

        {/* Center: note title */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)', maxWidth: '50%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {note.title || 'Sin título'}
          </span>
        </div>

        {/* Right: meta + delete */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, zIndex: 1 }}>
          <span style={{ fontSize: 11, color: 'var(--muted-fg)' }}>
            {wordCount.words}w · {wordCount.chars}c
          </span>
          <button
            onClick={() => onDelete(note.id)}
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
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted-fg)')}
            aria-label="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Editor pane */}
        {(mode === 'edit' || mode === 'split') && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              ...(mode === 'split' ? { borderRight: '1px solid var(--border-color)' } : {}),
            }}
          >
            <div style={{ maxWidth: 768, width: '100%', margin: '0 auto', padding: '20px 32px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <input
                type="text"
                value={note.title}
                onChange={handleTitleChange}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); textareaRef.current?.focus() } }}
                placeholder="Título de la nota"
                style={{
                  width: '100%',
                  fontSize: 22,
                  fontWeight: 600,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: 'var(--fg)',
                  letterSpacing: '-0.02em',
                  marginBottom: 12,
                }}
              />
              <textarea
                ref={textareaRef}
                value={note.content}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                placeholder="Escribe en Markdown..."
                spellCheck={false}
                style={{
                  width: '100%',
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  background: 'transparent',
                  color: 'var(--fg)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 14,
                  lineHeight: 1.8,
                  minHeight: 'calc(100vh - 160px)',
                }}
              />
            </div>
          </div>
        )}

        {/* Preview pane */}
        {(mode === 'preview' || mode === 'split') && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ maxWidth: 768, width: '100%', margin: '0 auto', padding: '20px 32px' }}>
              {note.content ? (
                <div
                  className="zn-preview"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              ) : (
                <p style={{ color: 'var(--muted-fg)', fontStyle: 'italic', fontSize: 14 }}>
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
