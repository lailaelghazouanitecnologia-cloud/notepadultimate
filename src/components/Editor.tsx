import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import type { Note } from '../types'
import { renderMarkdown } from '../lib/markdown'
import '../lib/markdown.css'
import { Icons } from '../lib/icons'

type ViewMode = 'edit' | 'preview' | 'split'

interface EditorProps {
  note: Note
  onUpdate: (id: string, updates: Partial<Pick<Note, 'title' | 'content'>>) => void
  onNavigate: (title: string) => void
}

export function Editor({ note, onUpdate, onNavigate }: EditorProps) {
  const [mode, setMode] = useState<ViewMode>('edit')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if ((mode === 'edit' || mode === 'split') && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [note.id, mode])

  // Handle wiki-link clicks
  useEffect(() => {
    const el = previewRef.current
    if (!el) return
    const handler = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.classList.contains('zn-wikilink')) {
        const link = target.getAttribute('data-link')
        if (link) onNavigate(link)
      }
    }
    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
  }, [onNavigate])

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
      onUpdate(note.id, { content: ta.value.substring(0, start) + '  ' + ta.value.substring(end) })
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 2 })
    }
  }

  const renderedHtml = useMemo(() => renderMarkdown(note.content), [note.content])
  const wordCount = useMemo(() => note.content.trim().split(/\s+/).filter(Boolean).length, [note.content])

  return (
    <div className="content-area">
      {/* Breadcrumb / toolbar */}
      <div className="breadcrumb">
        <span>{note.title}</span>
        <div className="breadcrumb__modes">
          <button className={`icon-btn ${mode === 'edit' ? 'active' : ''}`} onClick={() => setMode('edit')} aria-label="Edit">
            {Icons.edit()}
          </button>
          <button className={`icon-btn ${mode === 'split' ? 'active' : ''}`} onClick={() => setMode('split')} aria-label="Split">
            {Icons.columns()}
          </button>
          <button className={`icon-btn ${mode === 'preview' ? 'active' : ''}`} onClick={() => setMode('preview')} aria-label="Preview">
            {Icons.eye()}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {(mode === 'edit' || mode === 'split') && (
          <div
            className="editor-area"
            style={mode === 'split' ? { borderRight: '1px solid var(--border-subtle)', flex: 1 } : { flex: 1 }}
          >
            <div className="editor-area__inner">
              <input
                type="text"
                className="editor-title"
                value={note.title}
                onChange={(e) => onUpdate(note.id, { title: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); textareaRef.current?.focus() } }}
                placeholder="Untitled"
              />
              <textarea
                ref={textareaRef}
                className="editor-textarea"
                value={note.content}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                placeholder="Start writing in Markdown..."
                spellCheck={false}
              />
            </div>
          </div>
        )}

        {(mode === 'preview' || mode === 'split') && (
          <div className="editor-area" style={{ flex: 1 }}>
            <div className="editor-area__inner">
              {note.content ? (
                <div
                  ref={previewRef}
                  className="zn-preview"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              ) : (
                <p style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>
                  Start writing to see preview...
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status notch */}
      <div className="notch">
        <span><span className="notch__value">{wordCount}</span> words</span>
        <span className="notch__divider" />
        <span><span className="notch__value">{note.content.length}</span> chars</span>
      </div>
    </div>
  )
}
