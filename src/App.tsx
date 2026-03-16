import { useCallback, useEffect, useRef, memo } from 'react'
import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { HomeScreen } from './components/HomeScreen'
import { FeedView } from './components/FeedView'
import { GraphView } from './components/GraphView'
import { AgentsView } from './components/AgentsView'
import { ProfileView } from './components/ProfileView'
import { useTheme } from './hooks/useTheme'
import { Icons, FileTypeIcon } from './lib/icons'
import { useNotesContext } from './contexts/NotesContext'
import { useAgentsContext } from './contexts/AgentsContext'
import { useProjectContext } from './contexts/ProjectContext'
import { useUIContext } from './contexts/UIContext'
import type { View } from './contexts/UIContext'
// store utilities available if needed
// import { addSystemEvent } from './store'

const MemoizedSidebar = memo(Sidebar)
const MemoizedEditor = memo(Editor)
const MemoizedFeedView = memo(FeedView)
const MemoizedHomeScreen = memo(HomeScreen)
const MemoizedGraphView = memo(GraphView)
const MemoizedAgentsView = memo(AgentsView)
const MemoizedProfileView = memo(ProfileView)

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const {
    notes, activeId, setActiveId, addNote, updateNote, deleteNote,
    publishedNotes, publishNote, folders, createFolder, deleteFolder,
  } = useNotesContext()
  const {
    agents, alerts, unreadAlerts,
    createAgent, deleteAgent, markAlertRead,
    createContract, deleteContract, getProjectContracts,
  } = useAgentsContext()
  const { projects, activeProjectId, systemEvents, switchProject, createProject } = useProjectContext()
  const {
    view, setView,
    sidebarCollapsed, toggleSidebar, setSidebarCollapsed,
    pluginPanel, setPluginPanel,
    editingNoteId, setEditingNoteId,
    openTabs, openTab, closeTab,
    profileAgentId, setProfileAgentId,
    chatSessions, activeChatId,
    showHistory, setShowHistory,
    saveChat, newChat, openChat,
  } = useUIContext()

  const [showPlugins, setShowPlugins] = useLocalState(false)
  const [showPublishModal, setShowPublishModal] = useLocalState(false)
  const [publishMessage, setPublishMessage] = useLocalState('')
  const [publishState, setPublishState] = useLocalState<'idle' | 'loading' | 'done'>('idle')
  const [renamingTabId, setRenamingTabId] = useLocalState<string | null>(null)
  const [tabRenameValue, setTabRenameValue] = useLocalState('')
  const pluginsRef = useRef<HTMLDivElement>(null)
  const tabRenameRef = useRef<HTMLInputElement>(null)

  const editingNote = editingNoteId ? notes.find((n) => n.id === editingNoteId) : null

  // Close plugins dropdown on outside click
  useClickOutside(pluginsRef, showPlugins, () => setShowPlugins(false))

  const openNoteInEditor = useCallback((id: string) => {
    setEditingNoteId(id)
    setActiveId(id)
    openTab(id)
  }, [setActiveId, setEditingNoteId, openTab])

  const handleCloseTab = useCallback((id: string) => {
    closeTab(id)
  }, [closeTab])

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
    if (folderId) updateNote(note.id, { folderId })
    openNoteInEditor(note.id)
  }, [addNote, updateNote, openNoteInEditor])

  const handleMoveNote = useCallback((noteId: string, folderId?: string) => {
    updateNote(noteId, { folderId })
  }, [updateNote])

  const handleRenameNote = useCallback((id: string, newTitle: string) => {
    updateNote(id, { title: newTitle })
  }, [updateNote])

  const handleDuplicateNote = useCallback((id: string) => {
    const source = notes.find((n) => n.id === id)
    if (!source) return
    const note = addNote()
    updateNote(note.id, { title: `${source.title} (copy)`, content: source.content, folderId: source.folderId })
  }, [notes, addNote, updateNote])

  const handlePublish = useCallback(() => {
    if (!editingNote || editingNote.published) return
    setPublishMessage('')
    setPublishState('idle')
    setShowPublishModal(true)
  }, [editingNote, setPublishMessage, setPublishState, setShowPublishModal])

  const handleConfirmPublish = useCallback(() => {
    if (!editingNote || publishState !== 'idle') return
    setPublishState('loading')
    setTimeout(() => {
      publishNote(editingNote, 'You')
      updateNote(editingNote.id, { published: true })
      setPublishState('done')
      setTimeout(() => {
        setShowPublishModal(false)
        setPublishState('idle')
      }, 1200)
    }, 600)
  }, [editingNote, updateNote, publishMessage, publishState, publishNote, setPublishState, setShowPublishModal])

  const handleDeleteAgent = useCallback((id: string) => {
    deleteAgent(id)
    if (profileAgentId === id) setProfileAgentId(null)
  }, [deleteAgent, profileAgentId, setProfileAgentId])

  const handleOpenProfile = useCallback((agentId: string) => {
    setProfileAgentId(agentId)
    setPluginPanel('agents')
  }, [setProfileAgentId, setPluginPanel])

  const handleCreateContract = useCallback((agentId: string, name: string, description: string) => {
    createContract(agentId, name, description, activeProjectId)
  }, [createContract, activeProjectId])

  const projectContracts = getProjectContracts(activeProjectId)
  const tabNotes = openTabs.map((id) => notes.find((n) => n.id === id)).filter(Boolean)

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
      <MemoizedSidebar
        notes={notes}
        activeId={activeId}
        onSelect={handleSidebarSelect}
        onAdd={handleAddNote}
        onDelete={deleteNote}
        onRename={handleRenameNote}
        onDuplicate={handleDuplicateNote}
        projects={projects}
        activeProjectId={activeProjectId}
        onSwitchProject={switchProject}
        onCreateProject={createProject}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        folders={folders}
        onCreateFolder={createFolder}
        onDeleteFolder={deleteFolder}
        onMoveNote={handleMoveNote}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className="app-main">
        <header className="header">
          {/* LEFT: mode switcher */}
          <div className="header__left">
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

          {/* CENTER: search input */}
          <div className="header__center">
            <div className="header__search">
              {Icons.search()}
              <input type="text" className="header__search-input" placeholder="Search Zarnet..." />
            </div>
          </div>

          {/* RIGHT: sidebar toggle + icon buttons + publish */}
          <div className="header__right">
            <button
              className={`header__icon-btn ${sidebarCollapsed ? '' : 'header__icon-btn--hidden'}`}
              onClick={() => setSidebarCollapsed(false)}
              title="Open sidebar"
              tabIndex={sidebarCollapsed ? 0 : -1}
            >
              {Icons.menu()}
            </button>

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

            <button
              className="header__icon-btn header__icon-btn--borderless"
              title="Add people"
            >
              {Icons.userPlus()}
            </button>

            {/* Publish — only when editing a note */}
            <button
              className={`header__publish-btn ${editingNote?.published ? 'published' : ''} ${!(showEditor && editingNote) ? 'header__publish-btn--hidden' : ''}`}
              onClick={handlePublish}
              title={editingNote?.published ? 'Published' : 'Publish note'}
              tabIndex={showEditor && editingNote ? 0 : -1}
            >
              {editingNote?.published ? Icons.check() : Icons.upload()}
              <span>{editingNote?.published ? 'Published' : 'Publish'}</span>
            </button>
          </div>
        </header>

        {/* Tabs bar — open files (only in editor) */}
        {showEditor && tabNotes.length > 0 && (
          <div className="tabs-bar">
            <div className="tabs-bar__tabs">
              {tabNotes.map((note) => note && (
                <button
                  key={note.id}
                  className={`tab ${editingNoteId === note.id ? 'active' : ''}`}
                  onClick={() => { setEditingNoteId(note.id); setActiveId(note.id) }}
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
                          if (tabRenameValue.trim()) updateNote(note.id, { title: tabRenameValue.trim() })
                          setRenamingTabId(null)
                        }
                        if (e.key === 'Escape') setRenamingTabId(null)
                      }}
                      onBlur={() => {
                        if (tabRenameValue.trim()) updateNote(note.id, { title: tabRenameValue.trim() })
                        setRenamingTabId(null)
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="tab__label">{note.title || 'Untitled'}</span>
                  )}
                  <span className="tab__close" onClick={(e) => { e.stopPropagation(); handleCloseTab(note.id) }}>
                    {Icons.x()}
                  </span>
                </button>
              ))}
              <button className="tab-add" onClick={() => handleAddNote()} aria-label="New tab">
                {Icons.plus()}
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {showEditor ? (
          <div className="content-area">
            <MemoizedEditor note={editingNote!} allNotes={notes} onUpdate={updateNote} onNavigate={handleNavigate} />
          </div>
        ) : pluginPanel === 'agents' ? (
          profileAgent ? (
            <MemoizedProfileView
              agent={profileAgent}
              publishedNotes={publishedNotes}
              allAgents={agents}
              onBack={() => setProfileAgentId(null)}
              onOpenProfile={handleOpenProfile}
              onOpenNote={handleOpenNote}
            />
          ) : (
            <MemoizedAgentsView
              agents={agents}
              alerts={alerts}
              publishedNotes={publishedNotes}
              contracts={projectContracts}
              onCreateAgent={createAgent}
              onDeleteAgent={handleDeleteAgent}
              onOpenProfile={handleOpenProfile}
              onMarkAlertRead={markAlertRead}
              onCreateContract={handleCreateContract}
              onDeleteContract={deleteContract}
            />
          )
        ) : view === 'feed' ? (
          <MemoizedFeedView
            publishedNotes={publishedNotes}
            agents={agents}
            systemEvents={systemEvents}
            onOpenNote={handleOpenNote}
            onOpenProfile={handleOpenProfile}
          />
        ) : view === 'chat' ? (
          <div className="content-area" style={{ position: 'relative' }}>
            <MemoizedHomeScreen
              notes={notes}
              publishedNotes={publishedNotes}
              onCreateNote={handleCreateFromChat}
              onOpenNote={handleOpenNote}
              onSaveChat={saveChat}
              initialSession={activeSession}
              key={activeChatId || 'new'}
            />
            {showHistory && (
              <div className="chat-history-panel">
                <div className="chat-history-panel__header">
                  <span className="chat-history-panel__title">History</span>
                  <button className="chat-history-panel__new" onClick={newChat}>
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
                      onClick={() => openChat(session.id)}
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
          <MemoizedGraphView notes={notes} onOpenNote={handleOpenNote} onCreateNote={handleCreateFromChat} />
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

// ── Utility hooks ──

import { useState } from 'react'

function useLocalState<T>(initial: T) {
  return useState<T>(initial)
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [active, ref, onClose])
}
