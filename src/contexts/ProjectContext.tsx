import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Project, SystemEvent } from '../types'
import {
  loadProjects, saveProjects,
  getActiveProjectId, setActiveProjectId,
  loadSystemEvents, addSystemEvent,
} from '../store'

interface ProjectContextValue {
  projects: Project[]
  activeProjectId: string
  systemEvents: SystemEvent[]
  switchProject: (id: string) => void
  createProject: (name: string, emoji: string) => void
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
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
    const project: Project = { id: `proj-${Date.now()}`, name, emoji, createdAt: Date.now() }
    setProjects(prev => {
      const updated = [...prev, project]
      saveProjects(updated)
      return updated
    })
    const evt = addSystemEvent('project_created', `Project "${name}" created`, 'A new project has been added to your workspace.')
    setSystemEvents(prev => [...prev, evt])
    setActiveProjectIdState(project.id)
    setActiveProjectId(project.id)
  }, [])

  return (
    <ProjectContext.Provider value={{
      projects, activeProjectId, systemEvents,
      switchProject, createProject,
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
