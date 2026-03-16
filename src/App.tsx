import { useState, useCallback } from 'react'
import { ActivityBar, type View } from './components/ActivityBar'
import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { HomeScreen } from './components/HomeScreen'
import { GraphView } from './components/GraphView'
import { useNotes } from './hooks/useNotes'
import { useTheme } from './hooks/useTheme'

export default function App() {
  const { notes, activeNote, activeId, setActiveId, addNote, updateNote, deleteNote } = useNotes()
  useTheme() // applies dark class
  const [view, setView] = useState<View>('home')

  const handleCreateFromChat = useCallback((title: string, content: string) => {
    const note = addNote()
    updateNote(note.id, { title, content })
    setView('files')
    setActiveId(note.id)
  }, [addNote, updateNote, setActiveId])

  const handleOpenNote = useCallback((id: string) => {
    setActiveId(id)
    setView('files')
  }, [setActiveId])

  const handleNavigate = useCallback((title: string) => {
    const existing = notes.find((n) => n.title.toLowerCase() === title.toLowerCase())
    if (existing) {
      setActiveId(existing.id)
    } else {
      // Create the linked note
      const note = addNote()
      updateNote(note.id, { title })
      setActiveId(note.id)
    }
  }, [notes, addNote, updateNote, setActiveId])

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <span className="header__title">Zarnetti</span>
        <div className="header__spacer" />
        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
          {notes.length} notes
        </span>
      </header>

      <div className="main-layout">
        <ActivityBar activeView={view} onViewChange={setView} />

        {view === 'files' && (
          <Sidebar
            notes={notes}
            activeId={activeId}
            onSelect={setActiveId}
            onAdd={() => { addNote(); }}
            onDelete={deleteNote}
          />
        )}

        {view === 'home' && (
          <HomeScreen
            notes={notes}
            onCreateNote={handleCreateFromChat}
            onOpenNote={handleOpenNote}
          />
        )}

        {view === 'files' && activeNote && (
          <Editor
            note={activeNote}
            onUpdate={updateNote}
            onNavigate={handleNavigate}
          />
        )}

        {view === 'files' && !activeNote && (
          <div className="content-area">
            <div className="home">
              <div style={{ textAlign: 'center' }}>
                <div className="home__brand"><strong>Zarnetti</strong></div>
                <div className="home__sub">Select a note or create a new one</div>
              </div>
            </div>
          </div>
        )}

        {view === 'graph' && (
          <GraphView notes={notes} onOpenNote={handleOpenNote} />
        )}
      </div>
    </div>
  )
}
