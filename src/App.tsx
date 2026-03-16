import { useState, useCallback } from 'react'
import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { HomeScreen } from './components/HomeScreen'
import { GraphView } from './components/GraphView'
import { useNotes } from './hooks/useNotes'
import { useTheme } from './hooks/useTheme'
import { ZarnettiLogo, Icons } from './lib/icons'
import { publishNote, loadPublished } from './store'

export type View = 'feed' | 'chat' | 'graph'

export interface ChatSession {
  id: string
  title: string
  messages: { id: string; role: 'user' | 'assistant'; content: string }[]
  createdAt: number
}

export default function App() {
  const { notes, activeNote, activeId, setActiveId, addNote, updateNote, deleteNote } = useNotes()
  useTheme()
  const [view, setView] = useState<View>('chat')
  const [openTabs, setOpenTabs] = useState<string[]>([])
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [publishedNotes, setPublishedNotes] = useState(() => loadPublished())

  const openNoteTab = useCallback((id: string) => {
    setActiveId(id)
    setView('feed')
    setOpenTabs((prev) => prev.includes(id) ? prev : [...prev, id])
  }, [setActiveId])

  const closeTab = useCallback((id: string) => {
    setOpenTabs((prev) => {
      const next = prev.filter((t) => t !== id)
      if (activeId === id) {
        if (next.length > 0) setActiveId(next[next.length - 1])
        else setActiveId(null as unknown as string)
      }
      return next
    })
  }, [activeId, setActiveId])

  const handleCreateFromChat = useCallback((title: string, content: string) => {
    const note = addNote()
    updateNote(note.id, { title, content })
    openNoteTab(note.id)
  }, [addNote, updateNote, openNoteTab])

  const handleOpenNote = useCallback((id: string) => { openNoteTab(id) }, [openNoteTab])

  const handleNavigate = useCallback((title: string) => {
    const existing = notes.find((n) => n.title.toLowerCase() === title.toLowerCase())
    if (existing) { openNoteTab(existing.id) }
    else { const note = addNote(); updateNote(note.id, { title }); openNoteTab(note.id) }
  }, [notes, addNote, updateNote, openNoteTab])

  const handleSidebarSelect = useCallback((id: string) => { openNoteTab(id) }, [openNoteTab])
  const handleAddNote = useCallback(() => { const note = addNote(); openNoteTab(note.id) }, [addNote, openNoteTab])

  const handleSaveChat = useCallback((session: ChatSession) => {
    setChatSessions((prev) => {
      const exists = prev.findIndex((s) => s.id === session.id)
      if (exists >= 0) {
        const next = [...prev]
        next[exists] = session
        return next
      }
      return [session, ...prev]
    })
  }, [])

  const handleNewChat = useCallback(() => {
    setActiveChatId(null)
    setShowHistory(false)
  }, [])

  const handleOpenChat = useCallback((id: string) => {
    setActiveChatId(id)
    setShowHistory(false)
  }, [])

  const handlePublish = useCallback(() => {
    if (!activeNote) return
    publishNote(activeNote, 'You')
    updateNote(activeNote.id, { published: true })
    setPublishedNotes(loadPublished())
  }, [activeNote, updateNote])

  const tabNotes = openTabs.map((id) => notes.find((n) => n.id === id)).filter(Boolean)

  const modes: { id: View; icon: (p?: object) => React.ReactNode; label: string }[] = [
    { id: 'feed', icon: Icons.rss, label: 'Feed' },
    { id: 'chat', icon: Icons.messageCircle, label: 'Chat' },
    { id: 'graph', icon: Icons.graph, label: 'Graph' },
  ]

  const activeSession = activeChatId ? chatSessions.find((s) => s.id === activeChatId) : undefined

  return (
    <div className="app">
      <Sidebar
        notes={notes}
        activeId={activeId}
        onSelect={handleSidebarSelect}
        onAdd={handleAddNote}
        onDelete={deleteNote}
      />

      <div className="app-main">
        {/* Header bar */}
        <header className="header">
          <div className="header__left">
            {/* Mode switcher pill */}
            <div className="zw-mode-switcher">
              {modes.map((m) => (
                <button
                  key={m.id}
                  className={`zw-mode-tab ${view === m.id ? 'active' : ''}`}
                  onClick={() => setView(m.id)}
                >
                  {m.icon()}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="header__center">
            <div className="header__search">
              {Icons.search()}
              <input type="text" className="header__search-input" placeholder="Search..." />
            </div>
          </div>

          <div className="header__right">
            {/* History button — visible in chat mode */}
            {view === 'chat' && (
              <button
                className={`header__icon-btn ${showHistory ? 'active' : ''}`}
                onClick={() => setShowHistory(!showHistory)}
                title="Chat history"
              >
                {Icons.clock()}
              </button>
            )}
            {/* Publish button — visible in feed mode when a note is active */}
            {view === 'feed' && activeNote && (
              <button
                className={`header__publish-btn ${activeNote.published ? 'published' : ''}`}
                onClick={handlePublish}
                title={activeNote.published ? 'Published' : 'Publish note'}
              >
                {activeNote.published ? Icons.check() : Icons.upload()}
                <span>{activeNote.published ? 'Published' : 'Publish'}</span>
              </button>
            )}
            <button className="header__invite-btn">
              {Icons.userPlus()}
              <span>Invite</span>
            </button>
          </div>
        </header>

        {/* File tabs bar (feed mode only) */}
        {view === 'feed' && tabNotes.length > 0 && (
          <div className="tabs-bar">
            <div className="tabs-bar__tabs">
              {tabNotes.map((note) => note && (
                <button
                  key={note.id}
                  className={`tab ${activeId === note.id ? 'active' : ''}`}
                  onClick={() => setActiveId(note.id)}
                >
                  <span className="tab__circle" />
                  <span className="tab__label">{note.title || 'Untitled'}</span>
                  <span className="tab__close" onClick={(e) => { e.stopPropagation(); closeTab(note.id) }}>
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

        {/* Content */}
        {view === 'feed' ? (
          <div className="content-area">
            {activeNote ? (
              <Editor note={activeNote} onUpdate={updateNote} onNavigate={handleNavigate} />
            ) : (
              <div className="chat-welcome">
                <div className="chat-welcome__inner">
                  <ZarnettiLogo className="welcome-logo" />
                  <p className="chat-welcome__sub">Select a note or create a new one</p>
                </div>
              </div>
            )}
          </div>
        ) : view === 'chat' ? (
          <div className="content-area" style={{ position: 'relative' }}>
            <HomeScreen
              notes={notes}
              publishedNotes={publishedNotes}
              onCreateNote={handleCreateFromChat}
              onOpenNote={handleOpenNote}
              onSaveChat={handleSaveChat}
              initialSession={activeSession}
              key={activeChatId || 'new'}
            />
            {/* History side panel */}
            {showHistory && (
              <div className="chat-history-panel">
                <div className="chat-history-panel__header">
                  <span className="chat-history-panel__title">History</span>
                  <button className="chat-history-panel__new" onClick={handleNewChat}>
                    {Icons.plus()}
                    <span>New</span>
                  </button>
                </div>
                <div className="chat-history-panel__list">
                  {chatSessions.length === 0 && (
                    <div className="chat-history-panel__empty">No conversations yet</div>
                  )}
                  {chatSessions.map((session) => (
                    <button
                      key={session.id}
                      className={`chat-history-panel__item ${activeChatId === session.id ? 'active' : ''}`}
                      onClick={() => handleOpenChat(session.id)}
                    >
                      <div className="chat-history-panel__item-title">
                        {session.title || 'Untitled chat'}
                      </div>
                      <div className="chat-history-panel__item-meta">
                        {session.messages.length} msgs
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : view === 'graph' ? (
          <GraphView notes={notes} onOpenNote={handleOpenNote} />
        ) : null}
      </div>
    </div>
  )
}
