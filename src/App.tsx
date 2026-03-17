import { useCallback, useState, useMemo, memo } from 'react'
import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { HomeScreen } from './components/HomeScreen'
import { FeedView } from './components/FeedView'
import { GraphView } from './components/GraphView'
import { AgentsView } from './components/AgentsView'
import { ProfileView } from './components/ProfileView'
import { PluginsView } from './components/PluginsView'
import { Header } from './components/Header'
import { TabsBar } from './components/TabsBar'
import { PublishModal } from './components/PublishModal'
import { PeoplePanel } from './components/PeoplePanel'
import { useTheme } from './hooks/useTheme'
import { useResizable } from './hooks/useResizable'
import { useNotesContext } from './contexts/NotesContext'
import { useAgentsContext } from './contexts/AgentsContext'
import { useProjectContext } from './contexts/ProjectContext'
import { useUIContext } from './contexts/UIContext'
import { useSocialContext } from './contexts/SocialContext'

const MemoizedSidebar = memo(Sidebar)
const MemoizedEditor = memo(Editor)
const MemoizedFeedView = memo(FeedView)
const MemoizedHomeScreen = memo(HomeScreen)
const MemoizedGraphView = memo(GraphView)
const MemoizedAgentsView = memo(AgentsView)
const MemoizedProfileView = memo(ProfileView)
const MemoizedPluginsView = memo(PluginsView)

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const {
    notes, activeId, setActiveId, addNote, updateNote, deleteNote,
    moveNoteToFolder,
    publishedNotes, publishNote, folders, createFolder, moveFolderToParent,
    workspaces, activeWorkspaceId, setActiveWorkspaceId, createWorkspace,
    workspaceNotes, workspaceFolders,
  } = useNotesContext()
  const {
    agents, alerts, unreadAlerts,
    createAgent, deleteAgent, markAlertRead,
    createContract, deleteContract, getProjectContracts,
  } = useAgentsContext()
  const { projects, activeProjectId, activeProject, systemEvents, switchProject, createProject } = useProjectContext()
  const {
    view, setView,
    sidebarCollapsed, toggleSidebar, setSidebarCollapsed,
    editingNoteId, setEditingNoteId,
    openTabs, openTab, closeTab,
    profileAgentId, setProfileAgentId,
    chatSessions, activeChatId,
    showHistory, setShowHistory,
    saveChat,
  } = useUIContext()
  const {
    isFollowing, followUser, unfollowUser,
    getFollowedAgents,
  } = useSocialContext()

  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showPeoplePanel, setShowPeoplePanel] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const [attachedFiles, setAttachedFiles] = useState<{ id: string; title: string }[]>([])

  const handleDividerMouseDown = useResizable(sidebarWidth, setSidebarWidth, { min: 180, max: 480 })

  // Social data
  const followedAgents = useMemo(() => getFollowedAgents(agents), [getFollowedAgents, agents])
  const followedAgentIds = useMemo(() => new Set(followedAgents.map(a => a.id)), [followedAgents])

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

  const handleAddNote = useCallback((folderId?: string) => {
    const note = addNote()
    if (folderId) updateNote(note.id, { folderId })
    openNoteInEditor(note.id)
  }, [addNote, updateNote, openNoteInEditor])

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
    setView('agents')
  }, [setProfileAgentId, setView])

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
        projects={projects}
        activeProjectId={activeProjectId}
        onSwitchProject={switchProject}
        onCreateProject={createProject}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        width={sidebarWidth}
        theme={theme}
        onToggleTheme={toggleTheme}
        view={view}
        onNavigate={(v) => { setView(v); setEditingNoteId(null); setProfileAgentId(null) }}
        onPost={() => { setView('feed'); setEditingNoteId(null); setProfileAgentId(null) }}
        unreadAlerts={unreadAlerts}
        onOpenAgents={() => { setView('agents'); setProfileAgentId(null) }}
        onOpenContracts={() => { setView('agents'); setProfileAgentId(null) }}
        onOpenPlugins={() => { setView('plugins'); setProfileAgentId(null) }}
        notes={workspaceNotes}
        folders={workspaceFolders}
        activeNoteId={activeId}
        onOpenNote={handleOpenNote}
        onAddNote={handleAddNote}
        onDeleteNote={deleteNote}
        onRenameNote={handleRenameNote}
        onDuplicateNote={handleDuplicateNote}
        onMoveNoteToFolder={moveNoteToFolder}
        onCreateFolder={createFolder}
        onMoveFolderToParent={moveFolderToParent}
        workspaces={workspaces.filter(w => w.spaceId === activeProjectId || w.id === 'ws-default')}
        activeWorkspaceId={activeWorkspaceId}
        onSwitchWorkspace={setActiveWorkspaceId}
        onCreateWorkspace={(name: string) => createWorkspace(name, activeProjectId)}
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
          setView={(v) => { setView(v); setEditingNoteId(null); setProfileAgentId(null) }}
          showEditor={showEditor}
          editingNote={editingNote}
          showPeoplePanel={showPeoplePanel}
          setShowPeoplePanel={setShowPeoplePanel}
          onPublish={handlePublish}
          showHistory={showHistory}
          onToggleHistory={() => setShowHistory(!showHistory)}
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
        ) : view === 'agents' ? (
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
        ) : view === 'plugins' ? (
          <MemoizedPluginsView
            onOpenAgents={() => { setView('agents'); setProfileAgentId(null) }}
          />
        ) : view === 'feed' ? (
          <MemoizedFeedView
            publishedNotes={publishedNotes}
            agents={agents}
            systemEvents={systemEvents}
            onOpenNote={handleOpenNote}
            onOpenProfile={handleOpenProfile}
            onCreatePost={handleCreatePost}
            isFollowing={isFollowing}
            onFollow={followUser}
            onUnfollow={unfollowUser}
            followedAgentIds={followedAgentIds}
            activeSpaceId={activeProjectId}
            activeSpaceName={activeProject?.name}
            workspaces={workspaces.filter(w => w.spaceId === activeProjectId || w.id === 'ws-default')}
            activeWorkspaceId={activeWorkspaceId}
            onSwitchWorkspace={setActiveWorkspaceId}
            onCreateWorkspace={(name: string) => createWorkspace(name, activeProjectId)}
            notes={notes}
            folders={folders}
            onAddNote={handleAddNote}
            onDeleteNote={deleteNote}
            onCreateFolder={createFolder}
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
