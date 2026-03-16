import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import type { Note } from '../types'
import { renderMarkdown, extractLinks } from '../lib/markdown'
import '../lib/markdown.css'
import { Icons } from '../lib/icons'

type ViewMode = 'edit' | 'preview' | 'split'

interface EditorProps {
  note: Note
  allNotes: Note[]
  onUpdate: (id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'published'>>) => void
  onNavigate: (title: string) => void
}

export function Editor({ note, allNotes, onUpdate, onNavigate }: EditorProps) {
  const [mode, setMode] = useState<ViewMode>('edit')
  const [splitPct, setSplitPct] = useState(50) // editor % in split mode
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const splitContainerRef = useRef<HTMLDivElement>(null)

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

  const insertAtCursor = useCallback((text: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const before = note.content.substring(0, start)
    const after = note.content.substring(end)
    onUpdate(note.id, { content: before + text + after })
    requestAnimationFrame(() => {
      ta.focus()
      ta.selectionStart = ta.selectionEnd = start + text.length
    })
  }, [note.id, note.content, onUpdate])

  const handleInsertImage = useCallback(() => {
    insertAtCursor('![description](https://example.com/image.png)')
  }, [insertAtCursor])

  const handleInsertReference = useCallback(() => {
    insertAtCursor('[[]]')
    // Place cursor inside the brackets
    requestAnimationFrame(() => {
      const ta = textareaRef.current
      if (ta) {
        ta.selectionStart = ta.selectionEnd = ta.selectionStart - 2
      }
    })
  }, [insertAtCursor])

  // Backlinks: notes that reference this note
  const backlinks = useMemo(() => {
    return allNotes.filter(n => {
      if (n.id === note.id) return false
      const links = extractLinks(n.content)
      return links.includes(note.id) || links.includes(note.title)
    })
  }, [allNotes, note.id, note.title])

  const handleSplitDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const container = splitContainerRef.current
    if (!container) return
    const startX = e.clientX
    const containerRect = container.getBoundingClientRect()
    const startPct = splitPct

    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX
      const deltaPct = (delta / containerRect.width) * 100
      const newPct = Math.max(20, Math.min(80, startPct + deltaPct))
      setSplitPct(newPct)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [splitPct])

  const renderedHtml = useMemo(() => renderMarkdown(note.content), [note.content])
  const wordCount = useMemo(() => note.content.trim().split(/\s+/).filter(Boolean).length, [note.content])

  return (
    <>
      {/* Toolbar */}
      <div className="breadcrumb">
        <div className="breadcrumb__toolbar">
          <button className="icon-btn" onClick={handleInsertImage} title="Insert image">
            {Icons.image()}
          </button>
          <button className="icon-btn" onClick={handleInsertReference} title="Insert reference [[]]">
            {Icons.link()}
          </button>
          <span className="breadcrumb__sep" />
        </div>
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
      <div ref={splitContainerRef} className="editor-split-container">
        {(mode === 'edit' || mode === 'split') && (
          <div
            className="editor-area"
            style={mode === 'split' ? { width: `${splitPct}%`, flex: 'none' } : { flex: 1 }}
          >
            <div className="editor-area__inner">
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

        {mode === 'split' && (
          <div className="editor-split-handle" onMouseDown={handleSplitDrag}>
            <div className="editor-split-handle__line" />
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

              {/* Backlinks */}
              {backlinks.length > 0 && (
                <div className="editor-backlinks">
                  <div className="editor-backlinks__title">
                    {Icons.link()}
                    <span>{backlinks.length} reference{backlinks.length !== 1 ? 's' : ''}</span>
                  </div>
                  {backlinks.map(bl => (
                    <button
                      key={bl.id}
                      className="editor-backlinks__item"
                      onClick={() => onNavigate(bl.id)}
                    >
                      <span className="editor-backlinks__name">{bl.title || 'Untitled'}</span>
                      <span className="editor-backlinks__snippet">
                        {bl.content.slice(0, 80)}...
                      </span>
                    </button>
                  ))}
                </div>
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
        {backlinks.length > 0 && (
          <>
            <span className="notch__divider" />
            <span><span className="notch__value">{backlinks.length}</span> refs</span>
          </>
        )}
      </div>
    </>
  )
}
