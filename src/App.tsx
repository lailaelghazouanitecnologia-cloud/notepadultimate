import { useState, useCallback, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { HomeScreen } from './components/HomeScreen'
import { FeedView } from './components/FeedView'
import { AgentsView } from './components/AgentsView'
import { ProfileView } from './components/ProfileView'
import { useNotes } from './hooks/useNotes'
import { useTheme } from './hooks/useTheme'
import { Icons, FileTypeIcon } from './lib/icons'
import {
  publishNote, loadPublished, loadAgents, saveAgent, deleteAgent as deleteAgentStore,
  loadAlerts, saveAlerts, generateAlerts,
  loadProjects, saveProjects, getActiveProjectId, setActiveProjectId,
} from './store'
import type { Agent, Alert, Project } from './types'

export type View = 'feed' | 'chat'

export interface ChatSession {
  id: string
  title: string
  messages: { id: string; role: 'user' | 'assistant'; content: string }[]
  createdAt: number
}

export default function App() {
  const { notes, activeId, setActiveId, addNote, updateNote, deleteNote } = useNotes()
  useTheme()
  const [view, setView] = useState<View>('feed')
  const [openTabs, setOpenTabs] = useState<string[]>([])
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [publishedNotes, setPublishedNotes] = useState(() => loadPublished())
  const [agents, setAgents] = useState<Agent[]>(() => loadAgents())
  const [alerts, setAlerts] = useState<Alert[]>(() => loadAlerts())
  const [profileAgentId, setProfileAgentId] = useState<string | null>(null)
  const [showAgents, setShowAgents] = useState(false)

  // Projects
  const [projects, setProjects] = useState<Project[]>(() => loadProjects())
  const [activeProjectId, setActiveProjectIdState] = useState(() => getActiveProjectId())

  // Editing mode
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const editingNote = editingNoteId ? notes.find((n) => n.id === editingNoteId) : null

  // Regenerate alerts when published notes change
  useEffect(() => {
    const updated = generateAlerts(agents, publishedNotes)
    setAlerts(updated)
  }, [agents, publishedNotes])

  const openNoteInEditor = useCallback((id: string) => {
    setEditingNoteId(id)
    setActiveId(id)
    setOpenTabs((prev) => prev.includes(id) ? prev : [...prev, id])
  }, [setActiveId])

  const closeTab = useCallback((id: string) => {
    setOpenTabs((prev) => {
      const next = prev.filter((t) => t !== id)
      if (editingNoteId === id) {
        if (next.length > 0) { setEditingNoteId(next[next.length - 1]); setActiveId(next[next.length - 1]) }
        else { setEditingNoteId(null); setActiveId(null as unknown as string) }
      }
      return next
    })
  }, [editingNoteId, setActiveId])

  const handleCreateFromChat = useCallback((title: string, content: string) => {
    const note = addNote()
    updateNote(note.id, { title, content })
    openNoteInEditor(note.id)
  }, [addNote, updateNote, openNoteInEditor])

  const handleOpenNote = useCallback((id: string) => { openNoteInEditor(id) }, [openNoteInEditor])

  const handleNavigate = useCallback((title: string) => {
    const existing = notes.find((n) => n.title.toLowerCase() === title.toLowerCase())
    if (existing) { openNoteInEditor(existing.id) }
    else { const note = addNote(); updateNote(note.id, { title }); openNoteInEditor(note.id) }
  }, [notes, addNote, updateNote, openNoteInEditor])

  const handleSidebarSelect = useCallback((id: string) => { openNoteInEditor(id) }, [openNoteInEditor])
  const handleAddNote = useCallback(() => { const note = addNote(); openNoteInEditor(note.id) }, [addNote, openNoteInEditor])

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

  const handleNewChat = useCallback(() => { setActiveChatId(null); setShowHistory(false) }, [])
  const handleOpenChat = useCallback((id: string) => { setActiveChatId(id); setShowHistory(false) }, [])

  const handlePublish = useCallback(() => {
    if (!editingNote) return
    publishNote(editingNote, 'You')
    updateNote(editingNote.id, { published: true })
    setPublishedNotes(loadPublished())
  }, [editingNote, updateNote])

  // Agent handlers
  const handleCreateAgent = useCallback((data: Omit<Agent, 'id' | 'createdAt' | 'notes' | 'followers' | 'following'>) => {
    const agent: Agent = {
      ...data, id: `agent-${Date.now()}`, createdAt: Date.now(),
      notes: [], followers: 0, following: 0,
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
    setShowAgents(true)
  }, [])

  const handleMarkAlertRead = useCallback((alertId: string) => {
    setAlerts((prev) => {
      const updated = prev.map((a) => a.id === alertId ? { ...a, read: true } : a)
      saveAlerts(updated)
      return updated
    })
  }, [])

  // Project handlers
  const handleSwitchProject = useCallback((id: string) => {
    setActiveProjectIdState(id)
    setActiveProjectId(id)
  }, [])

  const handleCreateProject = useCallback((name: string, emoji: string) => {
    const project: Project = { id: `proj-${Date.now()}`, name, emoji, createdAt: Date.now() }
    const updated = [...projects, project]
    setProjects(updated)
    saveProjects(updated)
    handleSwitchProject(project.id)
  }, [projects, handleSwitchProject])

  const tabNotes = openTabs.map((id) => notes.find((n) => n.id === id)).filter(Boolean)
  const unreadAlerts = alerts.filter((a) => !a.read).length

  const modes: { id: View; icon: (p?: object) => React.ReactNode; label: string }[] = [
    { id: 'feed', icon: Icons.rss, label: 'Feed' },
    { id: 'chat', icon: Icons.messageCircle, label: 'Chat' },
  ]

  const activeSession = activeChatId ? chatSessions.find((s) => s.id === activeChatId) : undefined
  const profileAgent = profileAgentId ? agents.find((a) => a.id === profileAgentId) : undefined
  const showEditor = editingNoteId !== null && editingNote !== undefined

  return (
    <div className="app">
      <Sidebar
        notes={notes}
        activeId={activeId}
        onSelect={handleSidebarSelect}
        onAdd={handleAddNote}
        onDelete={deleteNote}
        projects={projects}
        activeProjectId={activeProjectId}
        onSwitchProject={handleSwitchProject}
        onCreateProject={handleCreateProject}
      />

      <div className="app-main">
        <header className="header">
          <div className="header__left">
            <div className="zw-mode-switcher">
              {modes.map((m) => (
                <button
                  key={m.id}
                  className={`zw-mode-tab ${view === m.id && !showEditor && !showAgents ? 'active' : ''}`}
                  onClick={() => { setView(m.id); setEditingNoteId(null); setShowAgents(false); setProfileAgentId(null) }}
                >
                  {m.icon()}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div className="header__right">
            {view === 'chat' && !showEditor && !showAgents && (
              <button
                className={`header__icon-btn ${showHistory ? 'active' : ''}`}
                onClick={() => setShowHistory(!showHistory)}
                title="Chat history"
              >
                {Icons.clock()}
              </button>
            )}

            {/* Agents toggle */}
            <button
              className={`header__icon-btn ${showAgents ? 'active' : ''}`}
              onClick={() => { setShowAgents(!showAgents); setProfileAgentId(null); setEditingNoteId(null) }}
              title="Agents"
            >
              {Icons.bot()}
              {unreadAlerts > 0 && <span className="header__icon-badge">{unreadAlerts}</span>}
            </button>

            {/* Publish — only when editing */}
            {showEditor && editingNote && (
              <button
                className={`header__publish-btn ${editingNote.published ? 'published' : ''}`}
                onClick={handlePublish}
                title={editingNote.published ? 'Published' : 'Publish note'}
              >
                {editingNote.published ? Icons.check() : Icons.upload()}
                <span>{editingNote.published ? 'Published' : 'Publish'}</span>
              </button>
            )}
          </div>
        </header>

        {/* Editor tabs bar */}
        {showEditor && tabNotes.length > 0 && (
          <div className="tabs-bar">
            <div className="tabs-bar__tabs">
              {tabNotes.map((note) => note && (
                <button
                  key={note.id}
                  className={`tab ${editingNoteId === note.id ? 'active' : ''}`}
                  onClick={() => { setEditingNoteId(note.id); setActiveId(note.id) }}
                >
                  {/\.\w+$/.test(note.title) ? (
                    <FileTypeIcon filename={note.title} />
                  ) : (
                    <span className="tab__circle" />
                  )}
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
        {showEditor ? (
          <div className="content-area">
            <Editor note={editingNote!} onUpdate={updateNote} onNavigate={handleNavigate} />
          </div>
        ) : showAgents ? (
          profileAgent ? (
            <ProfileView
              agent={profileAgent}
              publishedNotes={publishedNotes}
              allAgents={agents}
              onBack={() => setProfileAgentId(null)}
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
        ) : view === 'feed' ? (
          <FeedView
            publishedNotes={publishedNotes}
            agents={agents}
            onOpenNote={handleOpenNote}
            onOpenProfile={handleOpenProfile}
          />
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
                      <div className="chat-history-panel__item-title">{session.title || 'Untitled chat'}</div>
                      <div className="chat-history-panel__item-meta">{session.messages.length} msgs</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
