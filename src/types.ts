export interface Note {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
  published?: boolean
  author?: string
  authorId?: string
  folderId?: string  // parent folder
  workspaceId?: string  // which workspace this note belongs to
}

export interface Folder {
  id: string
  name: string
  parentId?: string  // nested folders
  createdAt: number
  workspaceId?: string  // which workspace this folder belongs to
}

export interface Workspace {
  id: string
  name: string
  spaceId: string  // which project/space this belongs to
  isPublic?: boolean
  createdAt: number
}

export interface Agent {
  id: string
  name: string
  handle: string
  avatar: string  // emoji or color code
  bio: string
  personality: string
  interests: string[]
  createdAt: number
  isPreset?: boolean
  notes: string[]     // published note IDs
  followers: number
  following: number
  services?: AgentService[]
}

// ── Agent Services ──
// A service module: name, description, and a list of endpoints

export interface ServiceEndpoint {
  method: 'GET' | 'POST'
  path: string
}

export interface AgentService {
  id: string
  name: string
  description: string
  endpoints: ServiceEndpoint[]
}

// ── Direct Messages ──

export interface DirectMessage {
  id: string
  conversationId: string
  sender: 'user' | 'agent'
  content: string
  timestamp: number
}

export interface Conversation {
  id: string
  agentId: string
  messages: DirectMessage[]
  unread: number
  updatedAt: number
}

export type AlertType = 'interest' | 'mention' | 'publish' | 'like' | 'reply' | 'repost' | 'contract' | 'system'

export interface Alert {
  id: string
  agentId: string
  type: AlertType
  title: string
  content: string
  noteId?: string
  read: boolean
  createdAt: number
  /** extra agent ids for grouped notifications (e.g. "and 4 others liked") */
  groupAgentIds?: string[]
}

export interface SystemEvent {
  id: string
  type: 'welcome' | 'project_created' | 'project_switched' | 'budget_alert' | 'system_update'
  message: string
  detail?: string
  createdAt: number
}

export interface Project {
  id: string
  name: string
  emoji: string
  createdAt: number
  ownerId?: string
  members?: SpaceMember[]
  isGlobal?: boolean  // true for the "Zarnetti" global space
}

export interface SpaceMember {
  userId: string
  role: 'owner' | 'member'
  joinedAt: number
}

export interface SpaceInvite {
  id: string
  spaceId: string
  invitedHandle: string
  invitedBy: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: number
}

export interface UserProfile {
  id: string
  name: string
  handle: string
  avatar: string
  bio: string
  createdAt: number
}

export interface Follow {
  followerId: string
  followingId: string
  createdAt: number
}

export interface Contract {
  id: string
  agentId: string
  projectId: string
  name: string
  description: string
  status: 'active' | 'paused'
  createdAt: number
}

// ── Workspace OS ──

export interface WorkspaceApp {
  id: string
  name: string
  icon: string          // emoji or URL
  type: 'builtin' | 'web' | 'sandbox'
  url?: string          // for web apps (iframe src)
  builtinId?: string    // for builtin apps: 'files', 'notes', 'settings', 'terminal'
  workspaceId: string
  installedAt: number
  pinned?: boolean      // pinned to taskbar
}

export interface WindowState {
  id: string
  appId: string
  title: string
  x: number
  y: number
  width: number
  height: number
  minimized: boolean
  maximized: boolean
  zIndex: number
}
