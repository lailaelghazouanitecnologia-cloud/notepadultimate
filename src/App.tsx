import { useState, useCallback, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { HomeScreen } from './components/HomeScreen'
import { GraphView } from './components/GraphView'
import { AgentsView } from './components/AgentsView'
import { ProfileView } from './components/ProfileView'
import { useNotes } from './hooks/useNotes'
import { useTheme } from './hooks/useTheme'
import { ZarnettiLogo, Icons } from './lib/icons'
import {
  publishNote, loadPublished, loadAgents, saveAgent, deleteAgent as deleteAgentStore,
  loadAlerts, saveAlerts, generateAlerts,
} from './store'
import type { Agent, Alert } from './types'

export type View = 'feed' | 'chat' | 'graph' | 'agents'

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
  const [agents, setAgents] = useState<Agent[]>(() => loadAgents())
  const [alerts, setAlerts] = useState<Alert[]>(() => loadAlerts())
  const [profileAgentId, setProfileAgentId] = useState<string | null>(null)

  // Regenerate alerts when published notes change
  useEffect(() => {
    const updated = generateAlerts(agents, publishedNotes)
    setAlerts(updated)
  }, [agents, publishedNotes])

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

  // Agent handlers
  const handleCreateAgent = useCallback((data: Omit<Agent, 'id' | 'createdAt' | 'notes' | 'followers' | 'following'>) => {
    const agent: Agent = {
      ...data,
      id: `agent-${Date.now()}`,
      createdAt: Date.now(),
      notes: [],
      followers: Math.floor(Math.random() * 500) + 10,
      following: Math.floor(Math.random() * 50) + 1,
    }
    saveAgent(agent)
    setAgents(loadAgents())
  }, [])

  const handleDeleteAgent = useCallback((id: string) => {
    deleteAgentStore(id)
    setAgents(loadAgents())
    if (profileAgentId === id) setProfileAgentId(null)
  }, [profileAgentId])

  const handleOpenProfile = useCallback((agentId: string) => {
    setProfileAgentId(agentId)
  }, [])

  const handleBackFromProfile = useCallback(() => {
    setProfileAgentId(null)
  }, [])

  const handleMarkAlertRead = useCallback((alertId: string) => {
    setAlerts((prev) => {
      const updated = prev.map((a) => a.id === alertId ? { ...a, read: true } : a)
      saveAlerts(updated)
      return updated
    })
  }, [])

  const tabNotes = openTabs.map((id) => notes.find((n) => n.id === id)).filter(Boolean)

  const unreadAlerts = alerts.filter((a) => !a.read).length

  const modes: { id: View; icon: (p?: object) => React.ReactNode; label: string; badge?: number }[] = [
    { id: 'feed', icon: Icons.rss, label: 'Feed' },
    { id: 'chat', icon: Icons.messageCircle, label: 'Chat' },
    { id: 'agents', icon: Icons.bot, label: 'Agents', badge: unreadAlerts },
    { id: 'graph', icon: Icons.graph, label: 'Graph' },
  ]

  const activeSession = activeChatId ? chatSessions.find((s) => s.id === activeChatId) : undefined
  const profileAgent = profileAgentId ? agents.find((a) => a.id === profileAgentId) : undefined

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
            <div className="zw-mode-switcher">
              {modes.map((m) => (
                <button
                  key={m.id}
                  className={`zw-mode-tab ${view === m.id ? 'active' : ''}`}
                  onClick={() => { setView(m.id); setProfileAgentId(null) }}
                >
                  {m.icon()}
                  <span>{m.label}</span>
                  {m.badge && m.badge > 0 ? <span className="zw-mode-tab__badge">{m.badge}</span> : null}
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
            {view === 'chat' && (
              <button
                className={`header__icon-btn ${showHistory ? 'active' : ''}`}
                onClick={() => setShowHistory(!showHistory)}
                title="Chat history"
              >
                {Icons.clock()}
              </button>
            )}
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
        ) : view === 'agents' ? (
          profileAgent ? (
            <ProfileView
              agent={profileAgent}
              publishedNotes={publishedNotes}
              allAgents={agents}
              onBack={handleBackFromProfile}
              onOpenProfile={handleOpenProfile}
              onOpenNote={handleOpenNote}
            />
          ) : (
            <AgentsView
              agents={agents}
              alerts={alerts}
              publishedNotes={publishedNotes}
              onCreateAgent={handleCreateAgent}
              onDeleteAgent={handleDeleteAgent}
              onOpenProfile={handleOpenProfile}
              onMarkAlertRead={handleMarkAlertRead}
            />
          )
        ) : view === 'graph' ? (
          <GraphView notes={notes} onOpenNote={handleOpenNote} />
        ) : null}
      </div>
    </div>
  )
}
