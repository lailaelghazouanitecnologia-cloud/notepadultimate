import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export type View = 'feed' | 'chat' | 'graph'
export type PluginPanel = 'agents' | null

export interface ChatSession {
  id: string
  title: string
  messages: { id: string; role: 'user' | 'assistant'; content: string; timestamp?: number }[]
  createdAt: number
}

const VIEW_PATHS: Record<string, View> = {
  '/': 'feed',
  '/feed': 'feed',
  '/chat': 'chat',
  '/graph': 'graph',
}

const PATH_FOR_VIEW: Record<View, string> = {
  feed: '/feed',
  chat: '/chat',
  graph: '/graph',
}

interface UIContextValue {
  view: View
  setView: (view: View) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  pluginPanel: PluginPanel
  setPluginPanel: (panel: PluginPanel) => void
  editingNoteId: string | null
  setEditingNoteId: (id: string | null) => void
  openTabs: string[]
  openTab: (id: string) => void
  closeTab: (id: string) => void
  profileAgentId: string | null
  setProfileAgentId: (id: string | null) => void
  chatSessions: ChatSession[]
  activeChatId: string | null
  setActiveChatId: (id: string | null) => void
  showHistory: boolean
  setShowHistory: (show: boolean) => void
  saveChat: (session: ChatSession) => void
  newChat: () => void
  openChat: (id: string) => void
}

const UIContext = createContext<UIContextValue | null>(null)

export function UIProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()

  // Derive initial view from URL
  const initialView = VIEW_PATHS[location.pathname] || 'feed'
  const [view, setViewState] = useState<View>(initialView)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [pluginPanel, setPluginPanel] = useState<PluginPanel>(null)
  const [editingNoteId, setEditingNoteIdState] = useState<string | null>(null)
  const [openTabs, setOpenTabs] = useState<string[]>([])
  const [profileAgentId, setProfileAgentId] = useState<string | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  // Sync URL → view when navigating with browser buttons
  useEffect(() => {
    const newView = VIEW_PATHS[location.pathname]
    if (newView && newView !== view) {
      setViewState(newView)
      setEditingNoteIdState(null)
      setPluginPanel(null)
      setProfileAgentId(null)
    }

    // Handle /note/:id URLs
    const noteMatch = location.pathname.match(/^\/note\/(.+)$/)
    if (noteMatch) {
      setEditingNoteIdState(noteMatch[1])
      setOpenTabs(prev => prev.includes(noteMatch[1]) ? prev : [...prev, noteMatch[1]])
    }

    // Handle /agents URL
    if (location.pathname === '/agents') {
      setPluginPanel('agents')
      setEditingNoteIdState(null)
    }
  }, [location.pathname])

  const setView = useCallback((v: View) => {
    setViewState(v)
    navigate(PATH_FOR_VIEW[v])
  }, [navigate])

  const setEditingNoteId = useCallback((id: string | null) => {
    setEditingNoteIdState(id)
    if (id) {
      navigate(`/note/${id}`)
    }
  }, [navigate])

  const toggleSidebar = useCallback(() => setSidebarCollapsed(prev => !prev), [])

  const openTab = useCallback((id: string) => {
    setOpenTabs(prev => prev.includes(id) ? prev : [...prev, id])
  }, [])

  const closeTab = useCallback((id: string) => {
    setOpenTabs(prev => {
      const next = prev.filter(t => t !== id)
      setEditingNoteIdState(currentId => {
        if (currentId === id) {
          const newId = next.length > 0 ? next[next.length - 1] : null
          if (newId) navigate(`/note/${newId}`)
          else navigate(PATH_FOR_VIEW[view])
          return newId
        }
        return currentId
      })
      return next
    })
  }, [navigate, view])

  const saveChat = useCallback((session: ChatSession) => {
    setChatSessions(prev => {
      const exists = prev.findIndex(s => s.id === session.id)
      if (exists >= 0) {
        const next = [...prev]
        next[exists] = session
        return next
      }
      return [session, ...prev]
    })
  }, [])

  const newChat = useCallback(() => {
    setActiveChatId(null)
    setShowHistory(false)
  }, [])

  const openChat = useCallback((id: string) => {
    setActiveChatId(id)
    setShowHistory(false)
  }, [])

  return (
    <UIContext.Provider value={{
      view, setView,
      sidebarCollapsed, toggleSidebar, setSidebarCollapsed,
      pluginPanel, setPluginPanel,
      editingNoteId, setEditingNoteId,
      openTabs, openTab, closeTab,
      profileAgentId, setProfileAgentId,
      chatSessions, activeChatId, setActiveChatId,
      showHistory, setShowHistory,
      saveChat, newChat, openChat,
    }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUIContext() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUIContext must be used within UIProvider')
  return ctx
}
