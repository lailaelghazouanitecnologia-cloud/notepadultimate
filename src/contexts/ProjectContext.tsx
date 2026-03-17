import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Project, SystemEvent, SpaceMember, SpaceInvite } from '../types'
import {
  loadProjects, saveProjects,
  getActiveProjectId, setActiveProjectId,
  loadSystemEvents, addSystemEvent,
  loadInvites, saveInvites,
} from '../store'

interface ProjectContextValue {
  projects: Project[]
  activeProjectId: string
  activeProject: Project | undefined
  systemEvents: SystemEvent[]
  switchProject: (id: string) => void
  createProject: (name: string, emoji: string) => void
  inviteToSpace: (spaceId: string, handle: string) => void
  acceptInvite: (inviteId: string) => void
  getSpaceMembers: (spaceId: string) => SpaceMember[]
  getSpaceInvites: (spaceId: string) => SpaceInvite[]
  invites: SpaceInvite[]
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(() => loadProjects())
  const [activeProjectId, setActiveProjectIdState] = useState(() => getActiveProjectId())
  const [invites, setInvites] = useState<SpaceInvite[]>(() => loadInvites())
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>(() => {
    const existing = loadSystemEvents()
    if (existing.length === 0) {
      const evt = addSystemEvent('welcome', 'Welcome to Zarnetti', 'Your workspace is ready. Create notes, publish to the feed, and explore agents.')
      return [evt]
    }
    return existing
  })

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0]

  const switchProject = useCallback((id: string) => {
    setActiveProjectIdState(id)
    setActiveProjectId(id)
    const proj = projects.find(p => p.id === id)
    if (proj) {
      const evt = addSystemEvent('project_switched', `Switched to ${proj.name}`, `You are now working in "${proj.name}"`)
      setSystemEvents(prev => [...prev, evt])
    }
  }, [projects])

  const createProject = useCallback((name: string, emoji: string) => {
    const project: Project = {
      id: `proj-${Date.now()}`, name, emoji, createdAt: Date.now(),
      ownerId: 'user-self',
      members: [{ userId: 'user-self', role: 'owner', joinedAt: Date.now() }],
    }
    setProjects(prev => {
      const updated = [...prev, project]
      saveProjects(updated)
      return updated
    })
    const evt = addSystemEvent('project_created', `Space "${name}" created`, 'A new space has been added.')
    setSystemEvents(prev => [...prev, evt])
    setActiveProjectIdState(project.id)
    setActiveProjectId(project.id)
  }, [])

  const inviteToSpace = useCallback((spaceId: string, handle: string) => {
    const invite: SpaceInvite = {
      id: `invite-${Date.now()}`,
      spaceId,
      invitedHandle: handle,
      invitedBy: 'user-self',
      status: 'pending',
      createdAt: Date.now(),
    }
    setInvites(prev => {
      const next = [...prev, invite]
      saveInvites(next)
      return next
    })
  }, [])

  const acceptInvite = useCallback((inviteId: string) => {
    setInvites(prev => {
      const next = prev.map(i => i.id === inviteId ? { ...i, status: 'accepted' as const } : i)
      saveInvites(next)
      return next
    })
  }, [])

  const getSpaceMembers = useCallback((spaceId: string) => {
    const proj = projects.find(p => p.id === spaceId)
    return proj?.members || []
  }, [projects])

  const getSpaceInvites = useCallback((spaceId: string) => {
    return invites.filter(i => i.spaceId === spaceId)
  }, [invites])

  return (
    <ProjectContext.Provider value={{
      projects, activeProjectId, activeProject, systemEvents,
      switchProject, createProject,
      inviteToSpace, acceptInvite,
      getSpaceMembers, getSpaceInvites, invites,
    }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjectContext() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProjectContext must be used within ProjectProvider')
  return ctx
}
