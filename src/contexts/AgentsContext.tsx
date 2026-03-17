import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { Agent, Alert, Contract, Note } from '../types'
import {
  loadAgents, saveAgent, deleteAgent as deleteAgentStore,
  loadAlerts, saveAlerts, generateAlerts,
  loadContracts, saveContract, deleteContract as deleteContractStore, getContractsForProject,
} from '../store'

interface AgentsContextValue {
  agents: Agent[]
  alerts: Alert[]
  contracts: Contract[]
  createAgent: (data: Omit<Agent, 'id' | 'createdAt' | 'notes' | 'followers' | 'following'>) => void
  deleteAgent: (id: string) => void
  markAlertRead: (alertId: string) => void
  markAllAlertsRead: () => void
  createContract: (agentId: string, name: string, description: string, projectId: string) => void
  deleteContract: (id: string) => void
  getProjectContracts: (projectId: string) => Contract[]
  unreadAlerts: number
}

const AgentsContext = createContext<AgentsContextValue | null>(null)

export function AgentsProvider({ children, publishedNotes }: { children: ReactNode; publishedNotes: Note[] }) {
  const [agents, setAgents] = useState<Agent[]>(() => loadAgents())
  const [alerts, setAlerts] = useState<Alert[]>(() => loadAlerts())
  const [contracts, setContracts] = useState<Contract[]>(() => loadContracts())

  // Regenerate alerts when published notes change
  useEffect(() => {
    const updated = generateAlerts(agents, publishedNotes)
    setAlerts(updated)
  }, [agents, publishedNotes])

  const createAgent = useCallback((data: Omit<Agent, 'id' | 'createdAt' | 'notes' | 'followers' | 'following'>) => {
    const agent: Agent = {
      ...data, id: `agent-${Date.now()}`, createdAt: Date.now(),
      notes: [], followers: 0, following: 0,
    }
    saveAgent(agent)
    setAgents(loadAgents())
  }, [])

  const deleteAgent = useCallback((id: string) => {
    deleteAgentStore(id)
    setAgents(loadAgents())
  }, [])

  const markAlertRead = useCallback((alertId: string) => {
    setAlerts((prev) => {
      const updated = prev.map((a) => a.id === alertId ? { ...a, read: true } : a)
      saveAlerts(updated)
      return updated
    })
  }, [])

  const markAllAlertsRead = useCallback(() => {
    setAlerts((prev) => {
      const updated = prev.map((a) => ({ ...a, read: true }))
      saveAlerts(updated)
      return updated
    })
  }, [])

  const createContract = useCallback((agentId: string, name: string, description: string, projectId: string) => {
    const contract: Contract = {
      id: `contract-${Date.now()}`, agentId, projectId,
      name, description, status: 'active', createdAt: Date.now(),
    }
    saveContract(contract)
    setContracts(loadContracts())
  }, [])

  const deleteContract = useCallback((id: string) => {
    deleteContractStore(id)
    setContracts(loadContracts())
  }, [])

  const getProjectContracts = useCallback((projectId: string) => {
    return getContractsForProject(projectId)
  }, [])

  const unreadAlerts = alerts.filter((a) => !a.read).length

  return (
    <AgentsContext.Provider value={{
      agents, alerts, contracts,
      createAgent, deleteAgent, markAlertRead, markAllAlertsRead,
      createContract, deleteContract, getProjectContracts,
      unreadAlerts,
    }}>
      {children}
    </AgentsContext.Provider>
  )
}

export function useAgentsContext() {
  const ctx = useContext(AgentsContext)
  if (!ctx) throw new Error('useAgentsContext must be used within AgentsProvider')
  return ctx
}
