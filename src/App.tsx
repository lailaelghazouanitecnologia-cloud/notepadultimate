import { useState, useCallback, useEffect, useRef } from 'react'
import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { HomeScreen } from './components/HomeScreen'
import { FeedView } from './components/FeedView'
import { GraphView } from './components/GraphView'
import { AgentsView } from './components/AgentsView'
import { ProfileView } from './components/ProfileView'
import { useNotes } from './hooks/useNotes'
import { useTheme } from './hooks/useTheme'
import { Icons, FileTypeIcon } from './lib/icons'
import {
  publishNote, loadPublished, loadAgents, saveAgent, deleteAgent as deleteAgentStore,
  loadAlerts, saveAlerts, generateAlerts,
  loadProjects, saveProjects, getActiveProjectId, setActiveProjectId,
  loadContracts, saveContract, deleteContract as deleteContractStore, getContractsForProject,
  loadFolders, createFolder as createFolderStore, deleteFolder as deleteFolderStore,
  loadSystemEvents, addSystemEvent,
} from './store'
import type { Agent, Alert, Project, Contract, Folder, SystemEvent } from './types'

export type View = 'feed' | 'chat' | 'graph'
type PluginPanel = 'agents' | null

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
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [publishMessage, setPublishMessage] = useState('')
  const [publishState, setPublishState] = useState<'idle' | 'loading' | 'done'>('idle')
  const [agents, setAgents] = useState<Agent[]>(() => loadAgents())
  const [alerts, setAlerts] = useState<Alert[]>(() => loadAlerts())
  const [profileAgentId, setProfileAgentId] = useState<string | null>(null)
  const [pluginPanel, setPluginPanel] = useState<PluginPanel>(null)
  const [showPlugins, setShowPlugins] = useState(false)
  const pluginsRef = useRef<HTMLDivElement>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [folders, setFolders] = useState<Folder[]>(() => loadFolders())

  // Projects
  const [projects, setProjects] = useState<Project[]>(() => loadProjects())
  const [activeProjectId, setActiveProjectIdState] = useState(() => getActiveProjectId())
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>(() => {
    const existing = loadSystemEvents()
    if (existing.length === 0) {
      const evt = addSystemEvent('welcome', 'Welcome to Zarnetti', 'Your workspace is ready. Create notes, publish to the feed, and explore agents.')
      return [evt]
    }
    return existing
  })

  // Editing mode
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const editingNote = editingNoteId ? notes.find((n) => n.id === editingNoteId) : null

  // Close plugins dropdown on outside click
  useEffect(() => {
    if (!showPlugins) return
    const handler = (e: MouseEvent) => {
      if (pluginsRef.current && !pluginsRef.current.contains(e.target as Node)) setShowPlugins(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showPlugins])

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
  const handleAddNote = useCallback((folderId?: string) => {
    const note = addNote()
    if (folderId) updateNote(note.id, { folderId } as Partial<import('./types').Note>)
    openNoteInEditor(note.id)
  }, [addNote, updateNote, openNoteInEditor])
  const handleCreateFolder = useCallback((name: string, parentId?: string) => {
    createFolderStore(name, parentId)
    setFolders(loadFolders())
  }, [])
  const handleDeleteFolder = useCallback((id: string) => {
    deleteFolderStore(id)
    setFolders(loadFolders())
  }, [])
  const handleMoveNote = useCallback((noteId: string, folderId?: string) => {
    updateNote(noteId, { folderId } as Partial<import('./types').Note>)
  }, [updateNote])

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
    if (editingNote.published) return
    setPublishMessage('')
    setPublishState('idle')
    setShowPublishModal(true)
  }, [editingNote])

  const handleConfirmPublish = useCallback(() => {
    if (!editingNote || publishState !== 'idle') return
    setPublishState('loading')
    setTimeout(() => {
      publishNote(editingNote, 'You')
      updateNote(editingNote.id, { published: true })
      setPublishedNotes(loadPublished())
      const evt = addSystemEvent('update', `"${editingNote.title || 'Untitled'}" published`, publishMessage || undefined)
      setSystemEvents(prev => [...prev, evt])
      setPublishState('done')
      setTimeout(() => {
        setShowPublishModal(false)
        setPublishState('idle')
      }, 1200)
    }, 600)
  }, [editingNote, updateNote, publishMessage, publishState])

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
    setPluginPanel('agents')
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
    const proj = projects.find(p => p.id === id)
    if (proj) {
      const evt = addSystemEvent('project_switched', `Switched to ${proj.name}`, `You are now working in "${proj.name}"`)
      setSystemEvents(prev => [...prev, evt])
    }
  }, [projects])

  const handleCreateProject = useCallback((name: string, emoji: string) => {
    const project: Project = { id: `proj-${Date.now()}`, name, emoji, createdAt: Date.now() }
    const updated = [...projects, project]
    setProjects(updated)
    saveProjects(updated)
    const evt = addSystemEvent('project_created', `Project "${name}" created`, 'A new project has been added to your workspace.')
    setSystemEvents(prev => [...prev, evt])
    handleSwitchProject(project.id)
  }, [projects, handleSwitchProject])

  // Contracts
  const [contracts, setContracts] = useState<Contract[]>(() => loadContracts())

  const handleCreateContract = useCallback((agentId: string, name: string, description: string) => {
    const contract: Contract = {
      id: `contract-${Date.now()}`, agentId, projectId: activeProjectId,
      name, description, status: 'active', createdAt: Date.now(),
    }
    saveContract(contract)
    setContracts(loadContracts())
  }, [activeProjectId])

  const handleDeleteContract = useCallback((id: string) => {
    deleteContractStore(id)
    setContracts(loadContracts())
  }, [])

  const projectContracts = getContractsForProject(activeProjectId)

  const tabNotes = openTabs.map((id) => notes.find((n) => n.id === id)).filter(Boolean)
  const unreadAlerts = alerts.filter((a) => !a.read).length

  const modes: { id: View; icon: (p?: object) => React.ReactNode; label: string }[] = [
    { id: 'feed', icon: Icons.rss, label: 'Feed' },
    { id: 'chat', icon: Icons.messageCircle, label: 'Chat' },
    { id: 'graph', icon: Icons.network, label: 'Graph' },
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
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        folders={folders}
        onCreateFolder={handleCreateFolder}
        onDeleteFolder={handleDeleteFolder}
        onMoveNote={handleMoveNote}
      />

      <div className="app-main">
        <header className="header">
          <div className="header__left">
            <button
              className={`zw-sb-toggle ${sidebarCollapsed ? '' : 'hidden'}`}
              onClick={() => setSidebarCollapsed(false)}
              title="Open sidebar"
            >
              {Icons.menu()}
            </button>
            <div className="zw-mode-switcher">
              {modes.map((m) => (
                <button
                  key={m.id}
                  className={`zw-mode-tab ${view === m.id && !showEditor && !pluginPanel ? 'active' : ''}`}
                  onClick={() => { setView(m.id); setEditingNoteId(null); setPluginPanel(null); setProfileAgentId(null) }}
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
              <input type="text" className="header__search-input" placeholder="Search Zarnet..." />
            </div>
          </div>

          <div className="header__right">
            <button
              className={`header__icon-btn ${showHistory ? 'active' : ''} ${!(view === 'chat' && !showEditor && !pluginPanel) ? 'header__icon-btn--hidden' : ''}`}
              onClick={() => setShowHistory(!showHistory)}
              title="Chat history"
              tabIndex={view === 'chat' && !showEditor && !pluginPanel ? 0 : -1}
            >
              {Icons.clock()}
            </button>

            {/* Plugins dropdown */}
            <div style={{ position: 'relative' }} ref={pluginsRef}>
              <button
                className={`header__icon-btn ${pluginPanel ? 'active' : ''}`}
                onClick={() => setShowPlugins(!showPlugins)}
                title="Plugins"
              >
                {Icons.puzzle()}
                {unreadAlerts > 0 && <span className="header__icon-badge">{unreadAlerts}</span>}
              </button>
              {showPlugins && (
                <div className="header__plugins-menu">
                  <div className="header__plugins-menu-title">Plugins</div>
                  <button
                    className={`header__plugins-item ${pluginPanel === 'agents' ? 'active' : ''}`}
                    onClick={() => {
                      setPluginPanel(pluginPanel === 'agents' ? null : 'agents')
                      setShowPlugins(false)
                      setProfileAgentId(null)
                      setEditingNoteId(null)
                    }}
                  >
                    {Icons.bot()}
                    <div className="header__plugins-item-info">
                      <span>Agents</span>
                      <span className="header__plugins-item-desc">Characters & contracts</span>
                    </div>
                    {unreadAlerts > 0 && <span className="header__plugins-badge">{unreadAlerts}</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Publish — always present for layout stability */}
            <button
              className={`header__publish-btn ${editingNote?.published ? 'published' : ''} ${!(showEditor && editingNote) ? 'header__publish-btn--hidden' : ''}`}
              onClick={handlePublish}
              title={editingNote?.published ? 'Published' : 'Publish note'}
              tabIndex={showEditor && editingNote ? 0 : -1}
            >
              {editingNote?.published ? Icons.check() : Icons.upload()}
              <span>{editingNote?.published ? 'Published' : 'Publish'}</span>
            </button>

            {/* Add people — far right, borderless */}
            <button
              className="header__icon-btn header__icon-btn--borderless"
              title="Add people"
            >
              {Icons.userPlus()}
            </button>
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
        ) : pluginPanel === 'agents' ? (
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
              contracts={projectContracts}
              onCreateAgent={handleCreateAgent}
              onDeleteAgent={handleDeleteAgent}
              onOpenProfile={handleOpenProfile}
              onMarkAlertRead={handleMarkAlertRead}
              onCreateContract={handleCreateContract}
              onDeleteContract={handleDeleteContract}
            />
          )
        ) : view === 'feed' ? (
          <FeedView
            publishedNotes={publishedNotes}
            agents={agents}
            systemEvents={systemEvents}
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
        ) : view === 'graph' ? (
          <GraphView notes={notes} onOpenNote={handleOpenNote} onCreateNote={handleCreateFromChat} />
        ) : null}
      </div>

      {/* Publish modal */}
      {showPublishModal && editingNote && (
        <div className="publish-overlay" onClick={() => publishState === 'idle' && setShowPublishModal(false)}>
          <div className="publish-card" onClick={(e) => e.stopPropagation()}>
            <div className="publish-card__header">
              <h3>Publish with thread</h3>
              <button className="publish-card__close" onClick={() => publishState === 'idle' && setShowPublishModal(false)}>
                {Icons.x()}
              </button>
            </div>
            <div className="publish-card__tweet">
              <div className="publish-card__avatar">Y</div>
              <textarea
                className="publish-card__input"
                placeholder="What's happening?"
                value={publishMessage}
                onChange={(e) => setPublishMessage(e.target.value)}
                maxLength={280}
              />
            </div>
            <div className="publish-card__attached">
              <div className="publish-card__doc-icon">{Icons.file()}</div>
              <div className="publish-card__doc-meta">
                <span className="publish-card__doc-name">{editingNote.title || 'Untitled'}</span>
                <span className="publish-card__doc-size">{editingNote.content.length} chars</span>
              </div>
            </div>
            <div className="publish-card__footer">
              <span className="publish-card__count">{publishMessage.length} / 280</span>
              <button
                className={`publish-card__btn ${publishState}`}
                onClick={handleConfirmPublish}
                disabled={publishState !== 'idle'}
              >
                {publishState === 'loading' ? (
                  <span className="publish-card__spinner" />
                ) : publishState === 'done' ? (
                  Icons.check()
                ) : (
                  Icons.upload()
                )}
                <span>{publishState === 'done' ? 'Published' : 'Publish'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
