import { useState, useCallback } from 'react'
import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { HomeScreen } from './components/HomeScreen'
import { GraphView } from './components/GraphView'
import { useNotes } from './hooks/useNotes'
import { useTheme } from './hooks/useTheme'
import { ZarnettiLogo, Identicon, Icons } from './lib/icons'

export type View = 'home' | 'files' | 'graph'

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

  const tabNotes = openTabs.map((id) => notes.find((n) => n.id === id)).filter(Boolean)

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header__left">
          <div className="header__avatar">
            <Identicon className="header__avatar-img" />
          </div>
          <ZarnettiLogo className="header__logo" />
          <button className="header__project-btn">
            <span className="header__title">Zarnetti</span>
            {Icons.chevronDown()}
          </button>
        </div>

        <div className="header__center">
          <div className="header__search">
            {Icons.search()}
            <input
              type="text"
              className="header__search-input"
              placeholder="Search..."
            />
          </div>
        </div>

        <div className="header__right">
          <button className="header__invite-btn">
            {Icons.userPlus()}
            <span>Invite</span>
          </button>
        </div>
      </header>

      <div className="main-layout">
        <Sidebar
          notes={notes}
          activeId={activeId}
          onSelect={handleSidebarSelect}
          onAdd={handleAddNote}
          onDelete={deleteNote}
          activeView={view}
          onViewChange={setView}
        />

        {/* Content area */}
        {view === 'files' ? (
          <div className="content-area">
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
