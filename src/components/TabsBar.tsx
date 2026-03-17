import { useState, useRef } from 'react'
import { Icons, FileTypeIcon } from '../lib/icons'
import type { Note } from '../types'

interface TabsBarProps {
  tabNotes: Note[]
  editingNoteId: string | null
  onSelectTab: (id: string) => void
  onCloseTab: (id: string) => void
  onAddTab: () => void
  onRenameNote: (id: string, title: string) => void
}

export function TabsBar({
  tabNotes, editingNoteId,
  onSelectTab, onCloseTab, onAddTab, onRenameNote,
}: TabsBarProps) {
  const [renamingTabId, setRenamingTabId] = useState<string | null>(null)
  const [tabRenameValue, setTabRenameValue] = useState('')
  const tabRenameRef = useRef<HTMLInputElement>(null)

  return (
    <div className="tabs-bar">
      <div className="tabs-bar__tabs">
        {tabNotes.map((note) => note && (
          <button
            key={note.id}
            className={`tab ${editingNoteId === note.id ? 'active' : ''}`}
            onClick={() => onSelectTab(note.id)}
            onDoubleClick={(e) => {
              e.preventDefault()
              setRenamingTabId(note.id)
              setTabRenameValue(note.title || 'Untitled')
              setTimeout(() => tabRenameRef.current?.focus(), 0)
            }}
          >
            {/\.\w+$/.test(note.title) ? (
              <FileTypeIcon filename={note.title} />
            ) : (
              <span className="tab__circle" />
            )}
            {renamingTabId === note.id ? (
              <input
                ref={tabRenameRef}
                className="tab__rename-input"
                value={tabRenameValue}
                onChange={(e) => setTabRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (tabRenameValue.trim()) onRenameNote(note.id, tabRenameValue.trim())
                    setRenamingTabId(null)
                  }
                  if (e.key === 'Escape') setRenamingTabId(null)
                }}
                onBlur={() => {
                  if (tabRenameValue.trim()) onRenameNote(note.id, tabRenameValue.trim())
                  setRenamingTabId(null)
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="tab__label">{note.title || 'Untitled'}</span>
            )}
            <span className="tab__close" onClick={(e) => { e.stopPropagation(); onCloseTab(note.id) }}>
              {Icons.x()}
            </span>
          </button>
        ))}
        <button className="tab-add" onClick={onAddTab} aria-label="New tab">
          {Icons.plus()}
        </button>
      </div>
    </div>
  )
}
