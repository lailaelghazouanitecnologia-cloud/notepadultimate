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
}

export interface Folder {
  id: string
  name: string
  parentId?: string  // nested folders
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
}

export interface Alert {
  id: string
  agentId: string
  type: 'interest' | 'mention' | 'publish'
  title: string
  content: string
  noteId?: string
  read: boolean
  createdAt: number
}

export interface Project {
  id: string
  name: string
  emoji: string
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
