import { useState, useCallback } from 'react'
import { ActivityBar, type View } from './components/ActivityBar'
import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { HomeScreen } from './components/HomeScreen'
import { GraphView } from './components/GraphView'
import { useNotes } from './hooks/useNotes'
import { useTheme } from './hooks/useTheme'
import { ZarnettiLogo, Icons } from './lib/icons'

export default function App() {
  const { notes, activeNote, activeId, setActiveId, addNote, updateNote, deleteNote } = useNotes()
  useTheme()
  const [view, setView] = useState<View>('home')

  // Track open tabs
  const [openTabs, setOpenTabs] = useState<string[]>([])

  const openNoteTab = useCallback((id: string) => {
    setActiveId(id)
    setView('files')
    setOpenTabs((prev) => prev.includes(id) ? prev : [...prev, id])
  }, [setActiveId])

  const closeTab = useCallback((id: string) => {
    setOpenTabs((prev) => {
      const next = prev.filter((t) => t !== id)
      if (activeId === id) {
        // Switch to another tab or deselect
        if (next.length > 0) {
          setActiveId(next[next.length - 1])
        } else {
          setActiveId(null as unknown as string)
        }
      }
      return next
    })
  }, [activeId, setActiveId])

  const handleCreateFromChat = useCallback((title: string, content: string) => {
    const note = addNote()
    updateNote(note.id, { title, content })
    openNoteTab(note.id)
  }, [addNote, updateNote, openNoteTab])

  const handleOpenNote = useCallback((id: string) => {
    openNoteTab(id)
  }, [openNoteTab])

  const handleNavigate = useCallback((title: string) => {
    const existing = notes.find((n) => n.title.toLowerCase() === title.toLowerCase())
    if (existing) {
      openNoteTab(existing.id)
    } else {
      const note = addNote()
      updateNote(note.id, { title })
      openNoteTab(note.id)
    }
  }, [notes, addNote, updateNote, openNoteTab])

  const handleSidebarSelect = useCallback((id: string) => {
    openNoteTab(id)
  }, [openNoteTab])

  const handleAddNote = useCallback(() => {
    const note = addNote()
    openNoteTab(note.id)
  }, [addNote, openNoteTab])

  // Get note titles for tabs
  const tabNotes = openTabs.map((id) => notes.find((n) => n.id === id)).filter(Boolean)

  return (
    <div className="app">
      {/* Header — Zarhwell style with logo */}
      <header className="header">
        <div className="header__left">
          <ZarnettiLogo className="header__logo" />
          <span className="header__title">Zarnetti</span>
        </div>
        <div className="header__spacer" />
        <div className="header__right">
          <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>
            {notes.length} notes
          </span>
        </div>
      </header>

      <div className="main-layout">
        <ActivityBar activeView={view} onViewChange={setView} />

        {view === 'files' && (
          <Sidebar
            notes={notes}
            activeId={activeId}
            onSelect={handleSidebarSelect}
            onAdd={handleAddNote}
            onDelete={deleteNote}
          />
        )}

        {/* Content area with tabs */}
        {view === 'files' ? (
          <div className="content-area">
            {/* Tabs bar (Zarhwell ContentTabsBar) */}
            {tabNotes.length > 0 && (
              <div className="tabs-bar">
                <div className="tabs-bar__tabs">
                  {tabNotes.map((note) => note && (
                    <button
                      key={note.id}
                      className={`tab ${activeId === note.id ? 'active' : ''}`}
                      onClick={() => { setActiveId(note.id) }}
                    >
                      <span className="tab__circle" />
                      <span className="tab__label">{note.title || 'Untitled'}</span>
                      <span
                        className="tab__close"
                        onClick={(e) => { e.stopPropagation(); closeTab(note.id) }}
                      >
                        {Icons.x()}
                      </span>
                    </button>
                  ))}
                  <button className="tab-add" onClick={handleAddNote} aria-label="New tab">
                    {Icons.plus()}
                  </button>
                </div>
              </div>
            )}

            {activeNote ? (
              <Editor
                note={activeNote}
                onUpdate={updateNote}
                onNavigate={handleNavigate}
              />
            ) : (
              <div className="chat-welcome">
                <div className="chat-welcome__inner">
                  <ZarnettiLogo className="welcome-logo" />
                  <p className="chat-welcome__sub">Select a note or create a new one</p>
                </div>
              </div>
            )}
          </div>
        ) : view === 'home' ? (
          <HomeScreen
            notes={notes}
            onCreateNote={handleCreateFromChat}
            onOpenNote={handleOpenNote}
          />
        ) : view === 'graph' ? (
          <GraphView notes={notes} onOpenNote={handleOpenNote} />
        ) : null}
      </div>
    </div>
  )
}
