import { useCallback, useState, memo } from 'react'
import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { HomeScreen } from './components/HomeScreen'
import { FeedView } from './components/FeedView'
import { GraphView } from './components/GraphView'
import { AgentsView } from './components/AgentsView'
import { ProfileView } from './components/ProfileView'
import { Header } from './components/Header'
import { TabsBar } from './components/TabsBar'
import { PublishModal } from './components/PublishModal'
import { PeoplePanel } from './components/PeoplePanel'
import { useTheme } from './hooks/useTheme'
import { useResizable } from './hooks/useResizable'
import { Icons } from './lib/icons'
import { useNotesContext } from './contexts/NotesContext'
import { useAgentsContext } from './contexts/AgentsContext'
import { useProjectContext } from './contexts/ProjectContext'
import { useUIContext } from './contexts/UIContext'

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

  const [showPlugins, setShowPlugins] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showPeoplePanel, setShowPeoplePanel] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const [attachedFiles, setAttachedFiles] = useState<{ id: string; title: string }[]>([])

  const handleDividerMouseDown = useResizable(sidebarWidth, setSidebarWidth, { min: 180, max: 480 })

  // Handle file drop from sidebar into chat
  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const noteId = e.dataTransfer.getData('text/note-id')
    const noteTitle = e.dataTransfer.getData('text/note-title')
    if (noteId && noteTitle) {
      setAttachedFiles(prev => {
        if (prev.some(f => f.id === noteId)) return prev
        return [...prev, { id: noteId, title: noteTitle }]
      })
    }
  }, [setAttachedFiles])

  const removeAttachedFile = useCallback((id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id))
  }, [setAttachedFiles])

  const editingNote = editingNoteId ? notes.find((n) => n.id === editingNoteId) : null

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

  const handleCreatePost = useCallback((content: string) => {
    const note = addNote()
    updateNote(note.id, { content, published: true })
    publishNote({ ...note, content, published: true }, 'You')
  }, [addNote, updateNote, publishNote])

  const handlePublish = useCallback(() => {
    if (!editingNote || editingNote.published) return
    setShowPublishModal(true)
  }, [editingNote, setShowPublishModal])

  const handlePublishConfirm = useCallback((note: import('./types').Note, author: string) => {
    publishNote(note, author)
    updateNote(note.id, { published: true })
  }, [publishNote, updateNote])

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
  const tabNotes = openTabs.map((id) => notes.find((n) => n.id === id)).filter(Boolean) as import('./types').Note[]

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
        onDragNote={true}
        projects={projects}
        activeProjectId={activeProjectId}
        onSwitchProject={switchProject}
        onCreateProject={createProject}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        width={sidebarWidth}
        folders={folders}
        onCreateFolder={createFolder}
        onDeleteFolder={deleteFolder}
        onMoveNote={handleMoveNote}
        theme={theme}
        onToggleTheme={toggleTheme}
        view={view}
        onNavigate={(v) => { setView(v); setEditingNoteId(null); setPluginPanel(null); setProfileAgentId(null) }}
        onPost={() => { setView('feed'); setEditingNoteId(null); setPluginPanel(null); setProfileAgentId(null) }}
        unreadAlerts={unreadAlerts}
      />

      {/* Resizable divider */}
      {!sidebarCollapsed && (
        <div className="app-divider" onMouseDown={handleDividerMouseDown} />
      )}

      <div className="app-main">
        <Header
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          view={view}
          setView={setView}
          showEditor={showEditor}
          editingNote={editingNote}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          showPlugins={showPlugins}
          setShowPlugins={setShowPlugins}
          pluginPanel={pluginPanel}
          setPluginPanel={setPluginPanel}
          showPeoplePanel={showPeoplePanel}
          setShowPeoplePanel={setShowPeoplePanel}
          unreadAlerts={unreadAlerts}
          profileAgentId={profileAgentId}
          setProfileAgentId={setProfileAgentId}
          setEditingNoteId={setEditingNoteId}
          onPublish={handlePublish}
        />

        {/* Tabs bar — open files (only in editor) */}
        {showEditor && tabNotes.length > 0 && (
          <TabsBar
            tabNotes={tabNotes}
            editingNoteId={editingNoteId}
            onSelectTab={(id) => { setEditingNoteId(id); setActiveId(id) }}
            onCloseTab={handleCloseTab}
            onAddTab={() => handleAddNote()}
            onRenameNote={handleRenameNote}
          />
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
            onCreatePost={handleCreatePost}
          />
        ) : view === 'chat' ? (
          <div className="content-area" style={{ flexDirection: 'row' }}>
            <MemoizedHomeScreen
              notes={notes}
              publishedNotes={publishedNotes}
              onCreateNote={handleCreateFromChat}
              onOpenNote={handleOpenNote}
              onSaveChat={saveChat}
              initialSession={activeSession}
              attachedFiles={attachedFiles}
              onRemoveAttachedFile={removeAttachedFile}
              onFileDrop={handleFileDrop}
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

      {/* People panel */}
      {showPeoplePanel && (
        <PeoplePanel
          agents={agents}
          onClose={() => setShowPeoplePanel(false)}
          onOpenProfile={handleOpenProfile}
        />
      )}

      {/* Publish modal */}
      {showPublishModal && editingNote && (
        <PublishModal
          note={editingNote}
          onClose={() => setShowPublishModal(false)}
          onPublish={handlePublishConfirm}
        />
      )}
    </div>
  )
}
