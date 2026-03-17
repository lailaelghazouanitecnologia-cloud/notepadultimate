import { useCallback, useState, useMemo, memo } from 'react'
import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { FeedView } from './components/FeedView'
import { GraphView } from './components/GraphView'
import { AgentsView } from './components/AgentsView'
import { ProfileView } from './components/ProfileView'
import { PluginsView } from './components/PluginsView'
import { WorkspaceOS } from './components/WorkspaceOS'
import { ExploreView } from './components/ExploreView'
import { MessagesView } from './components/MessagesView'
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
const MemoizedGraphView = memo(GraphView)
const MemoizedAgentsView = memo(AgentsView)
const MemoizedWorkspaceOS = memo(WorkspaceOS)
const MemoizedExploreView = memo(ExploreView)
const MemoizedProfileView = memo(ProfileView)
const MemoizedPluginsView = memo(PluginsView)
const MemoizedMessagesView = memo(MessagesView)

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const {
    notes, activeId, setActiveId, addNote, updateNote, deleteNote,
    moveNoteToFolder,
    publishedNotes, publishNote, folders, createFolder, deleteFolder, moveFolderToParent,
    workspaces, activeWorkspaceId, setActiveWorkspaceId, createWorkspace,
    workspaceNotes, workspaceFolders,
  } = useNotesContext()
  const {
    agents, alerts, unreadAlerts,
    createAgent, deleteAgent, markAlertRead,
  } = useAgentsContext()
  const { projects, activeProjectId, systemEvents, switchProject, createProject } = useProjectContext()
  const {
    view, setView,
    sidebarCollapsed, toggleSidebar, setSidebarCollapsed,
    editingNoteId, setEditingNoteId,
    openTabs, openTab, closeTab,
    profileAgentId, setProfileAgentId,
    showHistory, setShowHistory,
  } = useUIContext()
  const {
    isFollowing, followUser, unfollowUser,
    getFollowedAgents,
  } = useSocialContext()

  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showPeoplePanel, setShowPeoplePanel] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const handleDividerMouseDown = useResizable(sidebarWidth, setSidebarWidth, { min: 180, max: 480 })

  // Social data
  const followedAgents = useMemo(() => getFollowedAgents(agents), [getFollowedAgents, agents])
  const followedAgentIds = useMemo(() => new Set(followedAgents.map(a => a.id)), [followedAgents])

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

  const handleCreateContract = useCallback((agentId: string, fileName: string, content: string) => {
    const agent = agents.find(a => a.id === agentId)
    if (!agent) return
    const agentFolderName = agent.handle.replace('@', '').toLowerCase()
    // Find or create "contract" root folder
    let contractRoot = folders.find(f => f.name === 'contract' && !f.parentId)
    if (!contractRoot) contractRoot = createFolder('contract')
    // Find or create agent subfolder
    let agentFolder = folders.find(f => f.name === agentFolderName && f.parentId === contractRoot!.id)
    if (!agentFolder) agentFolder = createFolder(agentFolderName, contractRoot.id)
    // Create the .md note inside
    const note = addNote()
    updateNote(note.id, { title: fileName, content, folderId: agentFolder.id })
  }, [agents, folders, createFolder, addNote, updateNote])

  const handleDeleteContractNote = useCallback((noteId: string) => {
    deleteNote(noteId)
  }, [deleteNote])
  const tabNotes = openTabs.map((id) => notes.find((n) => n.id === id)).filter(Boolean) as import('./types').Note[]

  const profileAgent = profileAgentId ? agents.find((a) => a.id === profileAgentId) : undefined
  const showEditor = editingNoteId !== null && editingNote !== undefined && view !== 'workspace'

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
              notes={notes}
              folders={folders}
              onCreateAgent={createAgent}
              onDeleteAgent={handleDeleteAgent}
              onOpenProfile={handleOpenProfile}
              onMarkAlertRead={markAlertRead}
              onCreateContract={handleCreateContract}
              onDeleteContract={handleDeleteContractNote}
              onOpenNote={handleOpenNote}
            />
          )
        ) : view === 'plugins' ? (
          <MemoizedPluginsView
            onOpenAgents={() => { setView('agents'); setProfileAgentId(null) }}
          />
        ) : view === 'feed' ? (
          <MemoizedFeedView
            mode="home"
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
        ) : view === 'explore' ? (
          <MemoizedExploreView
            agents={agents}
            publishedNotes={publishedNotes}
            onOpenNote={handleOpenNote}
            onOpenProfile={handleOpenProfile}
            isFollowing={isFollowing}
            onFollow={followUser}
            onUnfollow={unfollowUser}
          />
        ) : view === 'workspace' ? (
          <MemoizedWorkspaceOS
            workspaces={workspaces.filter(w => w.spaceId === activeProjectId || w.id === 'ws-default')}
            activeWorkspaceId={activeWorkspaceId}
            onSwitchWorkspace={setActiveWorkspaceId}
            onCreateWorkspace={(name: string) => createWorkspace(name, activeProjectId)}
            notes={notes}
            folders={folders}
            onOpenNote={handleOpenNote}
            onAddNote={handleAddNote}
            onDeleteNote={deleteNote}
            onRenameNote={handleRenameNote}
            onCreateFolder={createFolder}
            onDeleteFolder={deleteFolder}
            onMoveNoteToFolder={moveNoteToFolder}
          />
        ) : view === 'chat' ? (
          <MemoizedMessagesView
            agents={agents}
            onOpenProfile={handleOpenProfile}
          />
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
